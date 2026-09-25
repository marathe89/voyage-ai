import type { NavIcon } from "./icons";

export interface SiteEntry {
  label: string;
  group: string;
  path: string;
  state?: Record<string, unknown>;
  keywords: string[];
  icon: keyof typeof NavIcon;
}

export const siteIndex: SiteEntry[] = [
  { label: "Home", group: "Main", path: "/", keywords: ["landing", "start"], icon: "home" },
  { label: "Discover", group: "Main", path: "/discover", keywords: ["destinations", "explore", "browse trips"], icon: "discover" },
  { label: "Concierge AI", group: "Main", path: "/concierge", keywords: ["chat", "ai assistant", "plan a trip"], icon: "concierge" },
  { label: "Conversation Planner", group: "Main", path: "/conversation", keywords: ["chat", "itinerary builder", "drag drop", "budget"], icon: "concierge" },
  { label: "Plan Your Trip", group: "Main", path: "/plan", keywords: ["manual planning", "flight search", "hotel calendar"], icon: "sliders" },
  { label: "Itinerary", group: "Main", path: "/itinerary", keywords: ["day by day", "schedule", "trip plan"], icon: "calendar" },

  { label: "Book a Trip", group: "Booking", path: "/book", keywords: ["reserve", "checkout"], icon: "book" },
  { label: "Flights", group: "Booking", path: "/book", state: { stepKey: "flights" }, keywords: ["airline", "airfare", "tickets"], icon: "plane" },
  { label: "Hotels", group: "Booking", path: "/book", state: { stepKey: "hotels" }, keywords: ["stay", "accommodation", "rooms"], icon: "hotel" },
  { label: "Activities", group: "Booking", path: "/book", state: { stepKey: "activities" }, keywords: ["tours", "experiences", "things to do"], icon: "activity" },
  { label: "Packages", group: "Booking", path: "/book", state: { stepKey: "packages" }, keywords: ["bundle", "combo deal"], icon: "package" },
  { label: "Forex", group: "Booking", path: "/book", state: { stepKey: "forex" }, keywords: ["currency", "exchange", "money"], icon: "dollar" },
  { label: "Insurance", group: "Booking", path: "/book", state: { stepKey: "insurance" }, keywords: ["travel cover", "protection"], icon: "shield" },
  { label: "Local Transport", group: "Booking", path: "/book", state: { stepKey: "transport" }, keywords: ["transfers", "cabs", "rail pass"], icon: "transport" },
  { label: "Pre-Trip Tasks", group: "Booking", path: "/book", state: { stepKey: "pretrip" }, keywords: ["checklist", "packing", "visa", "sim"], icon: "list" },

  { label: "Dashboard", group: "Account", path: "/dashboard", keywords: ["overview", "trip summary"], icon: "dashboard" },
  { label: "For You", group: "Account", path: "/for-you", keywords: ["recommendations", "personalized", "ai picks"], icon: "forYou" },
  { label: "My Trips", group: "Account", path: "/my-trips", keywords: ["saved trips", "upcoming", "planning"], icon: "pin" },
  { label: "Bookings", group: "Account", path: "/bookings", keywords: ["reservations", "confirmations"], icon: "book" },
  { label: "Travel Wallet", group: "Account", path: "/wallet", keywords: ["payments", "loyalty points", "transactions"], icon: "wallet" },
  { label: "Live Assistance", group: "Account", path: "/live-assistance", keywords: ["emergency", "sos", "flight alerts", "support"], icon: "bell" },
  { label: "Trip Memories", group: "Account", path: "/memories", keywords: ["photos", "journal", "albums"], icon: "camera" },
  { label: "Profile", group: "Account", path: "/profile", keywords: ["account", "settings", "passports", "family", "loyalty programs"], icon: "userCircle" },
];

export function searchSiteIndex(query: string): SiteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return siteIndex.filter((e) => e.label.toLowerCase().includes(q) || e.keywords.some((k) => k.includes(q))).slice(0, 8);
}
