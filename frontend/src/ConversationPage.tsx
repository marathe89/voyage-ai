import { useEffect, useRef, useState } from "react";
import type { DragEvent, FC } from "react";

// ============================================================================
// TYPES
// ============================================================================
interface TravelerPersona {
  type: "solo" | "family_kids" | "family_elderly" | "honeymoon" | "business" | "luxury" | "students" | "economy";
  budget: number;
  interests: string[];
  travelStyle: "adventure" | "relaxation" | "culture" | "mixed";
  pace: "fast" | "moderate" | "slow";
  groupComposition: { adults: number; children: number; elderly: number; pets: number };
}

interface Suggestion {
  id: string;
  type: "flight" | "hotel" | "activity" | "restaurant" | "transport" | "visa" | "forex" | "sim" | "guide";
  title: string;
  description: string;
  price: number;
  rating: number;
  image?: string;
  details: Record<string, string>;
  reasonForSuggestion: string;
  bookingUrl?: string;
}

interface ItineraryItem {
  id: string;
  type: Suggestion["type"];
  day: number;
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  price: number;
  details: Record<string, string>;
  notes: string;
  booked: boolean;
  orderInDay: number;
}

interface ItineraryDay {
  id: string;
  date: string;
  dayNumber: number;
  location: string;
  items: ItineraryItem[];
  dailyBudget: number;
  dailySpent: number;
  notes: string;
}

interface Trip {
  id: string;
  destination: string;
  duration: number;
  travelers: number;
  totalBudget: number;
  itinerary: ItineraryDay[];
  personaUsed: TravelerPersona;
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function genId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

const TYPE_ICON: Record<string, string> = {
  flight: "✈️",
  hotel: "🏨",
  activity: "🎭",
  restaurant: "🍽️",
  transport: "🚕",
  visa: "📋",
  forex: "💱",
  sim: "📱",
  guide: "👨‍🏫",
};

const mockTrip: Trip = {
  id: genId("trip"),
  destination: "Bali, Indonesia",
  duration: 7,
  travelers: 2,
  totalBudget: 3000,
  itinerary: Array.from({ length: 7 }, (_, i) => ({
    id: `day_${i + 1}`,
    date: new Date(2026, 11, 20 + i).toISOString().split("T")[0],
    dayNumber: i + 1,
    location: i === 0 ? "Denpasar" : i < 3 ? "Seminyak" : i < 5 ? "Ubud" : "Kuta",
    items: [],
    dailyBudget: 3000 / 7,
    dailySpent: 0,
    notes: "",
  })),
  personaUsed: {
    type: "honeymoon",
    budget: 3000,
    interests: ["romance", "beach", "culture", "dining"],
    travelStyle: "relaxation",
    pace: "moderate",
    groupComposition: { adults: 2, children: 0, elderly: 0, pets: 0 },
  },
};

const mockSuggestions: Suggestion[] = [
  {
    id: genId("sugg"),
    type: "activity",
    title: "Tirta Empul Temple",
    description: "Sacred water temple in Ubud with ritual bathing pools",
    price: 25,
    rating: 4.8,
    details: { Duration: "2 hours", "Best time": "Early morning", Includes: "Guided tour" },
    reasonForSuggestion: "Perfect for nature lovers and culture enthusiasts like you",
  },
  {
    id: genId("sugg"),
    type: "restaurant",
    title: "Karsa Kafe",
    description: "Traditional Balinese cuisine in a garden setting",
    price: 15,
    rating: 4.6,
    details: { Cuisine: "Balinese", "Avg cost": "$10–20pp", Reservations: "Recommended" },
    reasonForSuggestion: "Romantic ambiance perfect for honeymooners",
  },
  {
    id: genId("sugg"),
    type: "hotel",
    title: "The Seminyak Beach Resort",
    description: "Luxury beachfront resort with infinity pool",
    price: 250,
    rating: 4.7,
    details: { Rooms: "5-star", Amenities: "Pool, Spa, Restaurant", Location: "Beachfront" },
    reasonForSuggestion: "Matches your luxury preference and budget",
  },
];

// ============================================================================
// SUGGESTION CARD
// ============================================================================
function SuggestionCard({
  suggestion,
  trip,
  onAddToItinerary,
}: {
  suggestion: Suggestion;
  trip: Trip;
  onAddToItinerary: (suggestion: Suggestion, dayId: string) => void;
}) {
  const [showDaySelector, setShowDaySelector] = useState(false);

  return (
    <div className="conv-suggest-card">
      <div className="conv-suggest-card-head">
        <div>
          <strong>{suggestion.title}</strong>
          <span className="conv-suggest-card-type">
            {TYPE_ICON[suggestion.type] ?? "📌"} {suggestion.type}
          </span>
        </div>
        <div className="conv-suggest-card-price-block">
          <div className="conv-suggest-card-price">${suggestion.price.toFixed(2)}</div>
          <div className="conv-suggest-card-rating">{"⭐".repeat(Math.floor(suggestion.rating))} {suggestion.rating}</div>
        </div>
      </div>

      <p className="conv-suggest-card-desc">{suggestion.description}</p>
      <p className="conv-suggest-card-reason">💡 {suggestion.reasonForSuggestion}</p>

      {Object.keys(suggestion.details).length > 0 && (
        <div className="conv-suggest-card-details">
          {Object.entries(suggestion.details).map(([key, value]) => (
            <div key={key}><strong>{key}:</strong> {value}</div>
          ))}
        </div>
      )}

      {showDaySelector ? (
        <div className="conv-suggest-day-select">
          <p>Select a day to add to:</p>
          <div className="conv-suggest-day-grid">
            {trip.itinerary.map((day, idx) => (
              <button
                key={day.id}
                className="conv-suggest-day-btn"
                onClick={() => { onAddToItinerary(suggestion, day.id); setShowDaySelector(false); }}
              >
                Day {idx + 1}
              </button>
            ))}
          </div>
          <button className="conv-suggest-cancel-btn" onClick={() => setShowDaySelector(false)}>Cancel</button>
        </div>
      ) : (
        <button className="conv-suggest-add-btn" onClick={() => setShowDaySelector(true)}>Add to Itinerary</button>
      )}
    </div>
  );
}

// ============================================================================
// ITINERARY ITEM ROW (draggable, editable)
// ============================================================================
function ItineraryItemRow({
  item,
  onUpdate,
  onDelete,
  onDragStart,
  isEditing,
  onEditToggle,
}: {
  item: ItineraryItem;
  onUpdate: (item: ItineraryItem) => void;
  onDelete: (itemId: string) => void;
  onDragStart: (e: DragEvent) => void;
  isEditing: boolean;
  onEditToggle: (itemId: string) => void;
}) {
  const [localItem, setLocalItem] = useState(item);

  function handleSave() {
    onUpdate(localItem);
    onEditToggle(item.id);
  }
  function handleCancel() {
    setLocalItem(item);
    onEditToggle(item.id);
  }

  if (isEditing) {
    return (
      <div className="conv-itin-item-edit">
        <input
          type="text"
          value={localItem.title}
          onChange={(e) => setLocalItem({ ...localItem, title: e.target.value })}
          placeholder="Activity name"
        />
        <div className="conv-itin-item-edit-grid">
          <label>Start time
            <input type="time" value={localItem.startTime || "09:00"} onChange={(e) => setLocalItem({ ...localItem, startTime: e.target.value })} />
          </label>
          <label>End time
            <input type="time" value={localItem.endTime || "11:00"} onChange={(e) => setLocalItem({ ...localItem, endTime: e.target.value })} />
          </label>
        </div>
        <div className="conv-itin-item-edit-grid">
          <label>Price ($)
            <input type="number" value={localItem.price} onChange={(e) => setLocalItem({ ...localItem, price: parseFloat(e.target.value) || 0 })} />
          </label>
          <label>Type
            <select value={localItem.type} onChange={(e) => setLocalItem({ ...localItem, type: e.target.value as Suggestion["type"] })}>
              <option value="activity">Activity</option>
              <option value="restaurant">Restaurant</option>
              <option value="transport">Transport</option>
              <option value="hotel">Hotel</option>
              <option value="flight">Flight</option>
              <option value="guide">Guide</option>
              <option value="visa">Visa</option>
              <option value="forex">Forex</option>
              <option value="sim">SIM</option>
            </select>
          </label>
        </div>
        <textarea value={localItem.notes} onChange={(e) => setLocalItem({ ...localItem, notes: e.target.value })} placeholder="Any notes..." rows={2} />
        <div className="conv-itin-item-edit-actions">
          <button className="conv-btn-save" onClick={handleSave}>Save</button>
          <button className="conv-btn-cancel" onClick={handleCancel}>Cancel</button>
          <button className="conv-btn-delete" onClick={() => onDelete(item.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div draggable onDragStart={onDragStart} className="conv-itin-item">
      <div className="conv-itin-item-head">
        <span className="conv-itin-item-icon">{TYPE_ICON[item.type] ?? "📌"}</span>
        <div className="conv-itin-item-title-block">
          <strong>{item.title}</strong>
          {item.startTime && <span>{item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}</span>}
        </div>
        <div className="conv-itin-item-price">${item.price.toFixed(2)}</div>
      </div>
      {item.description && <p className="conv-itin-item-desc">{item.description}</p>}
      <div className="conv-itin-item-actions">
        <button onClick={() => onEditToggle(item.id)}>Edit</button>
        {item.booked && <span className="conv-itin-item-booked">Booked</span>}
      </div>
      {item.notes && <p className="conv-itin-item-notes">📝 {item.notes}</p>}
    </div>
  );
}

// ============================================================================
// ITINERARY DAY PANEL
// ============================================================================
function ItineraryDayPanel({
  day,
  onUpdateDay,
  onUpdateItem,
  onDeleteItem,
  onAddItemToDay,
  onDragStart,
  onDragOver,
  onDrop,
  editingItemId,
  onEditToggle,
}: {
  day: ItineraryDay;
  onUpdateDay: (day: ItineraryDay) => void;
  onUpdateItem: (dayId: string, item: ItineraryItem) => void;
  onDeleteItem: (dayId: string, itemId: string) => void;
  onAddItemToDay: (dayId: string) => void;
  onDragStart: (e: DragEvent, dayId: string, itemIndex: number) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, dayId: string) => void;
  editingItemId: string | null;
  onEditToggle: (itemId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(day.notes);

  const dateObj = new Date(`${day.date}T00:00:00`);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  function handleSaveNotes() {
    onUpdateDay({ ...day, notes });
    setIsEditingNotes(false);
  }

  const sortedItems = [...day.items].sort((a, b) => (a.startTime || "23:59").localeCompare(b.startTime || "23:59"));

  return (
    <div className="conv-itin-day">
      <button className="conv-itin-day-head" onClick={() => setIsExpanded((v) => !v)}>
        <span className="conv-itin-day-chev">{isExpanded ? "▾" : "▸"}</span>
        <span className="conv-itin-day-title">
          <strong>{dayName} {dateStr}</strong>
          <em>{day.location}</em>
        </span>
        <span className="conv-itin-day-total">
          <strong>${day.dailySpent.toFixed(2)}</strong>
          <em>{day.items.length} items</em>
        </span>
      </button>

      {isExpanded && (
        <div className="conv-itin-day-body">
          <div className="conv-itin-dropzone" onDragOver={onDragOver} onDrop={(e) => onDrop(e, day.id)}>
            {day.items.length === 0 ? "Drag suggestions here or click “Add”" : "Drag to reorder items"}
          </div>

          {sortedItems.length > 0 ? (
            sortedItems.map((item, index) => (
              <ItineraryItemRow
                key={item.id}
                item={item}
                onUpdate={(updated) => onUpdateItem(day.id, updated)}
                onDelete={(itemId) => onDeleteItem(day.id, itemId)}
                onDragStart={(e) => onDragStart(e, day.id, index)}
                isEditing={editingItemId === item.id}
                onEditToggle={onEditToggle}
              />
            ))
          ) : (
            <p className="conv-itin-empty">No activities yet</p>
          )}

          <div className="conv-itin-notes-block">
            {isEditingNotes ? (
              <div className="conv-itin-notes-edit">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for this day..." rows={2} />
                <div className="conv-itin-item-edit-actions">
                  <button className="conv-btn-save" onClick={handleSaveNotes}>Save</button>
                  <button className="conv-btn-cancel" onClick={() => { setNotes(day.notes); setIsEditingNotes(false); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="conv-itin-notes-btn" onClick={() => setIsEditingNotes(true)}>
                {day.notes ? `📝 ${day.notes}` : "+ Add notes for this day"}
              </button>
            )}
          </div>

          <button className="conv-itin-add-btn" onClick={() => onAddItemToDay(day.id)}>+ Add Activity</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ITINERARY PANEL (budget tracking)
// ============================================================================
function ItineraryPanel({ trip, onUpdateTrip }: { trip: Trip; onUpdateTrip: (trip: Trip) => void }) {
  const [dragState, setDragState] = useState<{ draggedItem: ItineraryItem | null; dragSource: { dayId: string; itemIndex: number } | null }>({
    draggedItem: null,
    dragSource: null,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const totalSpent = trip.itinerary.reduce((sum, day) => sum + day.items.reduce((s, item) => s + item.price, 0), 0);
  const budgetRemaining = trip.totalBudget - totalSpent;
  const budgetPercent = (totalSpent / trip.totalBudget) * 100;

  function handleUpdateDay(updatedDay: ItineraryDay) {
    onUpdateTrip({ ...trip, itinerary: trip.itinerary.map((d) => (d.id === updatedDay.id ? updatedDay : d)) });
  }

  function handleUpdateItem(dayId: string, updatedItem: ItineraryItem) {
    const itinerary = trip.itinerary.map((day) => {
      if (day.id !== dayId) return day;
      const items = day.items.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      return { ...day, items, dailySpent: items.reduce((s, i) => s + i.price, 0) };
    });
    onUpdateTrip({ ...trip, itinerary });
  }

  function handleDeleteItem(dayId: string, itemId: string) {
    const itinerary = trip.itinerary.map((day) => {
      if (day.id !== dayId) return day;
      const items = day.items.filter((item) => item.id !== itemId);
      return { ...day, items, dailySpent: items.reduce((s, i) => s + i.price, 0) };
    });
    onUpdateTrip({ ...trip, itinerary });
  }

  function handleAddItemToDay(dayId: string) {
    const newItem: ItineraryItem = {
      id: genId("item"),
      type: "activity",
      day: 0,
      title: "New Activity",
      description: "",
      startTime: "09:00",
      endTime: "11:00",
      price: 0,
      details: {},
      notes: "",
      booked: false,
      orderInDay: 999,
    };
    const itinerary = trip.itinerary.map((day) => {
      if (day.id !== dayId) return day;
      const items = [...day.items, newItem];
      return { ...day, items, dailySpent: items.reduce((s, i) => s + i.price, 0) };
    });
    onUpdateTrip({ ...trip, itinerary });
    setEditingItemId(newItem.id);
  }

  function handleDragStart(e: DragEvent, dayId: string, itemIndex: number) {
    const day = trip.itinerary.find((d) => d.id === dayId);
    if (!day) return;
    setDragState({ draggedItem: day.items[itemIndex], dragSource: { dayId, itemIndex } });
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: DragEvent, targetDayId: string) {
    e.preventDefault();
    if (!dragState.draggedItem || !dragState.dragSource) return;
    const { dayId: sourceDayId, itemIndex } = dragState.dragSource;
    const draggedItem = dragState.draggedItem;

    if (sourceDayId === targetDayId) {
      const day = trip.itinerary.find((d) => d.id === targetDayId);
      if (!day) return;
      const items = [...day.items];
      items.splice(itemIndex, 1);
      items.push(draggedItem);
      handleUpdateDay({ ...day, items });
    } else {
      const itinerary = trip.itinerary.map((day) => {
        if (day.id === sourceDayId) {
          const items = day.items.filter((_, i) => i !== itemIndex);
          return { ...day, items, dailySpent: items.reduce((s, i) => s + i.price, 0) };
        }
        if (day.id === targetDayId) {
          const items = [...day.items, draggedItem];
          return { ...day, items, dailySpent: items.reduce((s, i) => s + i.price, 0) };
        }
        return day;
      });
      onUpdateTrip({ ...trip, itinerary });
    }
    setDragState({ draggedItem: null, dragSource: null });
  }

  return (
    <div className="conv-itin-col">
      <div className="conv-itin-head">
        <h2>Trip Itinerary</h2>
        <p>{trip.destination} • {trip.duration} days • {trip.travelers} travelers</p>
        <div className="conv-itin-budget-label">
          <span>Budget</span>
          <strong>${totalSpent.toFixed(2)} / ${trip.totalBudget.toFixed(2)}</strong>
        </div>
        <div className="conv-itin-budget-bar"><span style={{ width: `${Math.min(budgetPercent, 100)}%` }} /></div>
        <div className="conv-itin-budget-foot">
          <span>{budgetPercent.toFixed(0)}% used</span>
          <span className={budgetRemaining >= 0 ? "ok" : "over"}>
            {budgetRemaining >= 0 ? `$${budgetRemaining.toFixed(2)} remaining` : `Over budget by $${Math.abs(budgetRemaining).toFixed(2)}`}
          </span>
        </div>
      </div>

      <div className="conv-itin-days">
        {trip.itinerary.map((day) => (
          <ItineraryDayPanel
            key={day.id}
            day={day}
            onUpdateDay={handleUpdateDay}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItemToDay={handleAddItemToDay}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            editingItemId={editingItemId}
            onEditToggle={setEditingItemId}
          />
        ))}
      </div>

      <div className="conv-itin-footer">
        <button className="conv-btn-primary">Proceed to Booking</button>
        <button className="conv-btn-secondary">Save & Continue Later</button>
      </div>
    </div>
  );
}

// ============================================================================
// CONVERSATION INTERFACE (3-column layout)
// ============================================================================
function ConversationInterface({ initialTrip }: { initialTrip: Trip }) {
  const [trip, setTrip] = useState(initialTrip);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function handleSendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setError(null);
    setStreamingText("");
    setLoading(true);

    try {
      setMessages((prev) => [...prev, { id: genId("msg"), role: "user", content: userMessage, timestamp: new Date() }]);

      const mockResponse =
        "That's a great choice! I've found some amazing suggestions for you. Check the middle panel for personalized recommendations based on your honeymoon preferences.";
      setStreamingText("");
      for (let i = 0; i < mockResponse.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 12));
        setStreamingText((prev) => prev + mockResponse[i]);
      }

      setMessages((prev) => [...prev, { id: genId("msg"), role: "assistant", content: mockResponse, timestamp: new Date() }]);
      setStreamingText("");
      setSuggestions(mockSuggestions);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Failed to process message"}`);
      setStreamingText("");
    } finally {
      setLoading(false);
    }
  }

  function handleAddToItinerary(suggestion: Suggestion, dayId: string) {
    const targetDay = trip.itinerary.find((d) => d.id === dayId);
    const updatedTrip: Trip = {
      ...trip,
      itinerary: trip.itinerary.map((day) => {
        if (day.id !== dayId) return day;
        const newItem: ItineraryItem = {
          id: genId("item"),
          type: suggestion.type,
          day: day.dayNumber,
          title: suggestion.title,
          description: suggestion.description,
          startTime: "09:00",
          endTime: "11:00",
          price: suggestion.price,
          details: suggestion.details,
          notes: suggestion.reasonForSuggestion,
          booked: false,
          orderInDay: day.items.length + 1,
        };
        return { ...day, items: [...day.items, newItem], dailySpent: day.dailySpent + suggestion.price };
      }),
    };
    setTrip(updatedTrip);
    setMessages((prev) => [
      ...prev,
      {
        id: genId("msg"),
        role: "assistant",
        content: `✅ Added "${suggestion.title}" to Day ${targetDay?.dayNumber} - ${targetDay?.location}!`,
        timestamp: new Date(),
      },
    ]);
  }

  return (
    <div className="conv-page">
      <div className="conv-header">
        <h1>Plan your {trip.duration}-day trip to {trip.destination}</h1>
        <p>
          Traveler: <strong>{trip.personaUsed.type.replace(/_/g, " ")}</strong> · Budget: ${trip.totalBudget.toLocaleString()} · Group: {trip.travelers} people
        </p>
      </div>

      <div className="conv-body">
        <div className="conv-chat-col">
          <div className="conv-chat-messages">
            {messages.length === 0 ? (
              <div className="conv-chat-empty">
                <p>👋 Start planning your trip!</p>
                <span>Tell me about what you're looking for in your trip.</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={msg.role === "user" ? "conv-msg-row user" : "conv-msg-row"}>
                  <div className={msg.role === "user" ? "conv-msg-bubble user" : "conv-msg-bubble"}>
                    <p>{msg.content}</p>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}

            {streamingText && (
              <div className="conv-msg-row">
                <div className="conv-msg-bubble">
                  <p>{streamingText}<span className="conv-cursor">▌</span></p>
                </div>
              </div>
            )}

            {error && (
              <div className="conv-error">
                {error} <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="conv-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <button onClick={handleSendMessage} disabled={loading || !input.trim()}>{loading ? "…" : "Send"}</button>
          </div>
        </div>

        <div className="conv-suggest-col">
          <div className="conv-suggest-head">
            <h2>💡 Suggestions</h2>
            <p>Click to add to your itinerary</p>
          </div>
          <div className="conv-suggest-list">
            {suggestions.length === 0 ? (
              <p className="conv-suggest-empty">Start chatting to get suggestions</p>
            ) : (
              suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} trip={trip} onAddToItinerary={handleAddToItinerary} />
              ))
            )}
          </div>
        </div>

        <ItineraryPanel trip={trip} onUpdateTrip={setTrip} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export const ConversationPage: FC = () => <ConversationInterface initialTrip={mockTrip} />;

export default ConversationPage;
