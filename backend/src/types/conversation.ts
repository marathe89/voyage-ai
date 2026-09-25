export interface TravelerPersona {
  id: string;
  type: "solo" | "family_kids" | "family_elderly" | "honeymoon" | "business" | "small_group" | "students" | "ladies" | "economy" | "luxury" | "second_innings";
  budget: "economy" | "standard" | "premium" | "luxury";
  interests: string[];
  travelStyle: "fast_paced" | "balanced" | "slow_travel";
  pace: "rushed" | "comfortable" | "leisurely";
  groupComposition: {
    adults: number;
    children: number;
    elderly: number;
    pets: boolean;
  };
  accessibility: string[];
  previousBookings: Trip[];
  preferences: {
    hotelChain?: string;
    airline?: string;
    cuisine?: string[];
    activities?: string[];
  };
  lastUpdated: Date;
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  location: string;
  activities: unknown[];
  accommodations: unknown[];
  transportation: unknown[];
  dining: unknown[];
  notes: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  travelers: number;
  budget: number;
  itinerary: ItineraryDay[];
  bookings: Booking[];
  conversationHistory: ConversationMessage[];
  createdAt: Date;
  status: "planning" | "booked" | "completed" | "archived";
  personaUsed: TravelerPersona;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: "explore" | "refine" | "book" | "clarify" | "modify";
    suggestionsShown?: Suggestion[];
    personaUpdated?: Partial<TravelerPersona>;
    dayScheduleUpdated?: ItineraryDay;
  };
}

export interface Suggestion {
  id: string;
  type: "flight" | "hotel" | "activity" | "restaurant" | "transport" | "visa" | "forex" | "sim" | "guide";
  title: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  details: Record<string, unknown>;
  reasonForSuggestion: string;
  bookingUrl?: string;
  selected: boolean;
  addedToItinerary: boolean;
}

export interface Booking {
  id: string;
  type: string;
  supplier: string;
  confirmationNumber: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
  details: Record<string, unknown>;
}
