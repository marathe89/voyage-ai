import Anthropic from "@anthropic-ai/sdk";
import type { ConversationMessage, TravelerPersona, Trip, Suggestion } from "../types/conversation.js";

const client = new Anthropic();

// Anthropic.APIError.message is the raw JSON error body, which is not fit
// to show a traveler in the chat UI — map the statuses we actually see in
// this demo (bad/missing key, no credits, rate limit) to plain-English
// text and fall back to a generic message for anything else.
function friendlyClaudeError(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 401) return "The Anthropic API key isn't valid. Check ANTHROPIC_API_KEY in backend/.env.";
    if (error.status === 400 && /credit balance/i.test(error.message)) {
      return "The connected Anthropic account is out of API credits. Add credits at console.anthropic.com under Plans & Billing, then try again.";
    }
    if (error.status === 429) return "Claude is rate-limited right now — wait a moment and try again.";
    if (error.status && error.status >= 500) return "Claude is temporarily unavailable. Try again in a moment.";
  }
  return "Live AI is temporarily unavailable.";
}

export class ConversationManager {
  private conversationHistory: ConversationMessage[] = [];
  private currentPersona: TravelerPersona;
  private currentTrip: Trip;

  constructor(persona: TravelerPersona, trip: Trip) {
    this.currentPersona = persona;
    this.currentTrip = trip;
  }

  /**
   * Process user input through Claude; return streaming response + extracted suggestions
   */
  async processUserMessage(
    userInput: string,
    onChunk: (text: string) => void,
  ): Promise<{ response: string; suggestions: Suggestion[]; personaUpdates: Partial<TravelerPersona> }> {
    try {
      const systemPrompt = this.buildSystemPrompt();

      const userMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: userInput,
        timestamp: new Date(),
      };
      this.conversationHistory.push(userMessage);

      let fullResponse = "";

      const stream = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: this.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          onChunk(event.delta.text);
        }
      }

      const suggestions = this.extractSuggestions(fullResponse);
      const personaUpdates = this.inferPersonaUpdates(userInput, fullResponse);

      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
        metadata: {
          suggestionsShown: suggestions,
          personaUpdated: personaUpdates,
        },
      };
      this.conversationHistory.push(assistantMessage);

      return { response: fullResponse, suggestions, personaUpdates };
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(friendlyClaudeError(error));
    }
  }

  /**
   * Build comprehensive system prompt with persona, trip, and conversation context
   */
  private buildSystemPrompt(): string {
    return `You are an expert AI travel concierge helping plan the perfect trip.

## Current Traveler Profile
- Type: ${this.currentPersona.type}
- Budget: ${this.currentPersona.budget}
- Interests: ${this.currentPersona.interests.join(", ")}
- Travel Style: ${this.currentPersona.travelStyle}
- Group: ${this.currentPersona.groupComposition.adults} adults, ${this.currentPersona.groupComposition.children} children, ${this.currentPersona.groupComposition.elderly} elderly
- Accessibility Needs: ${this.currentPersona.accessibility.length > 0 ? this.currentPersona.accessibility.join(", ") : "None"}

## Current Trip Context
- Destination: ${this.currentTrip.destination}
- Dates: ${this.currentTrip.startDate} to ${this.currentTrip.endDate} (${this.currentTrip.duration} days)
- Budget: $${this.currentTrip.budget}
- Current Itinerary: ${this.currentTrip.itinerary.length} days planned

## Conversation Guidelines
1. **Conversational tone**: Use natural, friendly language. Avoid robotic responses.
2. **Ask clarifying questions**: If user intent is ambiguous, ask 1-2 focused questions.
3. **Build day-wise itinerary**: Structure suggestions around "Day 1, Day 2," etc.
4. **Provide suggestions as cards**: After each response, include a JSON block with suggestions in this format:

\`\`\`json
{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "flight|hotel|activity|restaurant|transport|visa|forex|sim|guide",
      "title": "Clear title",
      "description": "2-3 sentence description",
      "price": 150.00,
      "rating": 4.5,
      "image": "https://image-url.com/image.jpg",
      "details": {
        "departure": "10:00 AM",
        "duration": "6 hours",
        "airline": "Delta"
      },
      "reasonForSuggestion": "Why this suggestion fits their profile"
    }
  ]
}
\`\`\`

5. **Learn persona**: Pay attention to user choices and refine your understanding of their preferences.
6. **Natural flow**: Move conversation from exploration → refinement → booking. Don't rush to payment.
7. **Handle errors gracefully**: If data is missing, acknowledge it and offer alternatives.

## Previous Bookings (for context)
${this.currentPersona.previousBookings.slice(0, 3)
  .map((b) => `- ${b.destination} (${b.duration} days, ${new Date(b.startDate).getFullYear()})`)
  .join("\n") || "First trip with this profile"}

## Task
Help the user plan their ${this.currentTrip.duration}-day trip to ${this.currentTrip.destination}.
Focus on:
1. Understanding their goals for this trip
2. Suggesting flights, hotels, activities, dining, and logistics (visa, forex, guides)
3. Building a realistic day-wise itinerary
4. Answering their questions naturally
5. Moving toward booking when they're ready`;
  }

  /**
   * Extract structured suggestions from Claude's response (expects JSON embedded in text)
   */
  private extractSuggestions(response: string): Suggestion[] {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[1]);
      return ((parsed.suggestions ?? []) as Suggestion[]).map(
        (s): Suggestion => ({
          id: s.id || `suggestion_${Date.now()}`,
          type: s.type,
          title: s.title,
          description: s.description,
          price: s.price,
          rating: s.rating,
          image: s.image,
          details: s.details,
          reasonForSuggestion: s.reasonForSuggestion,
          bookingUrl: s.bookingUrl,
          selected: false,
          addedToItinerary: false,
        }),
      );
    } catch (error) {
      console.warn("Failed to parse suggestions from response:", error);
      return [];
    }
  }

  /**
   * Infer persona updates from conversation
   */
  private inferPersonaUpdates(userInput: string, _response: string): Partial<TravelerPersona> {
    const updates: Partial<TravelerPersona> = {};
    const lower = userInput.toLowerCase();

    if (lower.includes("budget") || lower.includes("cheap")) updates.budget = "economy";
    if (lower.includes("luxury") || lower.includes("expensive")) updates.budget = "luxury";
    if (lower.includes("hiking") || lower.includes("adventure")) {
      updates.interests = [...new Set([...this.currentPersona.interests, "hiking", "adventure"])];
    }
    if (lower.includes("relax") || lower.includes("beach")) {
      updates.interests = [...new Set([...this.currentPersona.interests, "relaxation", "beach"])];
    }

    return updates;
  }

  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  loadHistory(messages: ConversationMessage[]) {
    this.conversationHistory = messages;
  }

  updatePersona(updates: Partial<TravelerPersona>) {
    this.currentPersona = { ...this.currentPersona, ...updates, lastUpdated: new Date() };
  }

  reset() {
    this.conversationHistory = [];
  }
}
