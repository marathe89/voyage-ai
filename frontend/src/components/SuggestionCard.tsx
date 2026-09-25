import type { Suggestion } from "../types/conversation";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onSelect: (suggestion: Suggestion) => void;
  onAddToItinerary: (suggestion: Suggestion) => void;
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
  guide: "🧑‍🏫",
};

export function SuggestionCard({ suggestion, onSelect, onAddToItinerary }: SuggestionCardProps) {
  return (
    <div className="conv-suggest-card" onClick={() => onSelect(suggestion)}>
      {suggestion.image && (
        <div className="conv-suggest-card-media">
          <img
            src={suggestion.image}
            alt={suggestion.title}
            onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
          />
        </div>
      )}

      <div className="conv-suggest-card-head">
        <div>
          <strong>{suggestion.title}</strong>
          <span className="conv-suggest-card-type">{TYPE_ICON[suggestion.type] ?? "📌"} {suggestion.type}</span>
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
            <div key={key}><strong>{key}:</strong> {String(value)}</div>
          ))}
        </div>
      )}

      <div className="conv-suggest-card-actions">
        <button
          className="conv-suggest-add-btn"
          onClick={(e) => { e.stopPropagation(); onAddToItinerary(suggestion); }}
        >
          Add to Trip
        </button>
        {suggestion.bookingUrl && (
          <a
            href={suggestion.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="conv-suggest-book-btn"
            onClick={(e) => e.stopPropagation()}
          >
            Book Now
          </a>
        )}
      </div>
    </div>
  );
}
