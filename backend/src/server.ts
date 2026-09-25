import "dotenv/config";
import cors from "cors";
import express from "express";
import { ConversationManager } from "./lib/conversationManager.js";
import type { ConversationMessage, TravelerPersona, Trip } from "./types/conversation.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "voyage-ai" });
});

app.post("/api/concierge", (request, response) => {
  const { message } = request.body as { message?: string };

  if (!message?.trim()) {
    response.status(400).json({ error: "A travel question is required." });
    return;
  }

  response.json({
    reply: `I can help you plan around: ${message.trim()}. Tell me your dates, budget, and travel style to get started.`,
  });
});

// Live, Claude-powered conversation endpoint. Stateless per request — the
// client sends the persona/trip context and prior turns each time.
app.post("/api/concierge/converse", async (request, response) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    response.status(503).json({ error: "Live AI mode isn't configured — set ANTHROPIC_API_KEY in backend/.env and restart the server." });
    return;
  }

  const { message, persona, trip, history } = request.body as {
    message?: string;
    persona?: TravelerPersona;
    trip?: Trip;
    history?: ConversationMessage[];
  };

  if (!message?.trim()) {
    response.status(400).json({ error: "A message is required." });
    return;
  }
  if (!persona || !trip) {
    response.status(400).json({ error: "persona and trip context are required." });
    return;
  }

  try {
    const manager = new ConversationManager(persona, trip);
    if (history?.length) manager.loadHistory(history);

    const { response: reply, suggestions, personaUpdates } = await manager.processUserMessage(message, () => {});

    response.json({ reply, suggestions, personaUpdates, history: manager.getHistory() });
  } catch (error) {
    console.error("Live concierge error:", error);
    response.status(502).json({ error: error instanceof Error ? error.message : "The live concierge is unavailable right now." });
  }
});

app.listen(port, () => {
  console.log(`Voyage AI API listening on http://localhost:${port}`);
});
