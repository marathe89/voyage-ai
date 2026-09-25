import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { itineraryTemplates } from "./itineraryTemplates";
import { storage } from "./lib/storage";
import type { Trip as StoredTrip, TravelerPersona as StoredPersona, ConversationMessage as StoredMessage, Suggestion } from "./types/conversation";
import { SuggestionCard } from "./components/SuggestionCard";
import { handleError } from "./lib/errorHandler";
import { ShareButton } from "./ShareButton";
import { DatePicker } from "./DatePicker";

interface EditableActivity {
  id: string; text: string; aiAdded?: boolean;
  icon?: string; subtitle?: string; time?: string; price?: string; confirmed?: boolean;
}
interface EditableDay { label: string; activities: EditableActivity[]; }
interface CustomItinerary { title: string; destination: string; note?: string; days: EditableDay[]; }

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// Live AI mode — talks to the real Claude-powered backend (backend/src/lib/
// conversationManager.ts) instead of the scripted engine below. Mirrors the
// shapes in backend/src/types/conversation.ts, kept local since frontend and
// backend are separate packages.
// ---------------------------------------------------------------------------
interface LivePersona {
  id: string;
  type: string;
  budget: string;
  interests: string[];
  travelStyle: string;
  pace: string;
  groupComposition: { adults: number; children: number; elderly: number; pets: boolean };
  accessibility: string[];
  previousBookings: unknown[];
  preferences: Record<string, unknown>;
  lastUpdated: string;
}

interface LiveTrip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  travelers: number;
  budget: number;
  itinerary: unknown[];
  bookings: unknown[];
  conversationHistory: unknown[];
  createdAt: string;
  status: string;
  personaUsed: LivePersona;
}

interface LiveMessage { id: string; role: "user" | "assistant"; content: string; timestamp: string; }

function defaultLivePersona(): LivePersona {
  return {
    id: "p1", type: "solo", budget: "standard", interests: [], travelStyle: "balanced", pace: "comfortable",
    groupComposition: { adults: 1, children: 0, elderly: 0, pets: false }, accessibility: [],
    previousBookings: [], preferences: {}, lastUpdated: new Date().toISOString(),
  };
}

function defaultLiveTrip(persona: LivePersona): LiveTrip {
  const start = new Date();
  const end = new Date(Date.now() + 7 * 86400000);
  return {
    id: "t1", destination: "Not chosen yet", startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10),
    duration: 7, travelers: 1, budget: 2000, itinerary: [], bookings: [], conversationHistory: [],
    createdAt: start.toISOString(), status: "planning", personaUsed: persona,
  };
}

// Converters between the loose Live* shapes used in this component and the
// stricter storage types (Date fields, literal unions) in ./types/conversation.
function toStoredPersona(p: LivePersona): StoredPersona {
  return {
    ...p,
    type: p.type as StoredPersona["type"],
    budget: p.budget as StoredPersona["budget"],
    travelStyle: p.travelStyle as StoredPersona["travelStyle"],
    pace: p.pace as StoredPersona["pace"],
    previousBookings: [],
    lastUpdated: new Date(p.lastUpdated),
  };
}

function toStoredTrip(t: LiveTrip): StoredTrip {
  return {
    ...t,
    itinerary: [],
    bookings: [],
    conversationHistory: [],
    createdAt: new Date(t.createdAt),
    status: t.status as StoredTrip["status"],
    personaUsed: toStoredPersona(t.personaUsed),
  };
}

function toStoredMessages(history: LiveMessage[]): StoredMessage[] {
  return history.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.timestamp) }));
}

function fromStoredMessages(history: StoredMessage[]): LiveMessage[] {
  return history.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toString() }));
}

interface CardOption {
  title: string;
  subtitle?: string;
  price?: string;
  from?: string;
  image?: string;
  tags?: string[];
  rating?: number;
  badge?: string;
  time?: string;
}

type Msg =
  | { from: "ai" | "user"; type: "text"; text: string; time?: string }
  | { from: "ai"; type: "chips"; label: string; options: string[] }
  | { from: "ai"; type: "confirm"; text: string }
  | { from: "ai"; type: "info"; title: string; rows: { label: string; value: string }[] }
  | { from: "ai"; type: "cards"; variant: string; options: CardOption[] }
  | { from: "ai"; type: "datepicker" }
  | { from: "ai"; type: "travelers" }
  | { from: "ai"; type: "suggestions"; items: Suggestion[] }
  | { from: "ai"; type: "personaPicker" }
  | { from: "ai"; type: "passengerForm"; roster: string[] }
  | { from: "ai"; type: "flightDetailsForm" }
  | {
      from: "ai"; type: "flightLeg"; title: string; onboardLocation: string; flightName: string; departureTime: string;
      passengers: { name: string; cls: string; seat: string }[];
    };

const conversations = [
  { id: "sf-dallas", title: "San Francisco → Dallas", meta: "Business · Apr 25–28", status: "In progress", updated: "Just now" },
  { id: "nyc", title: "New York City Trip", meta: "Business · Mar 10–14", status: "Booked", updated: "2 days ago" },
  { id: "london", title: "London Business Visit", meta: "Conference · May 5–8", status: "Planning", updated: "5 days ago" },
];

const savedTrips = [
  { title: "San Francisco → Dallas", dates: "Apr 25–28, 2026", status: "Upcoming", travelers: 4, budget: "$4,240" },
  { title: "New York City", dates: "Mar 10–14, 2026", status: "Completed", travelers: 1, budget: "$2,180" },
  { title: "London, UK", dates: "May 5–8, 2026", status: "Upcoming", travelers: 1, budget: "$1,950" },
  { title: "Dubai, UAE", dates: "Feb 20–23, 2026", status: "Completed", travelers: 2, budget: "$3,600" },
];

const travellers: { name: string; role: string; initials: string; photo?: string; passport: string }[] = [
  { name: "Alex Johnson", role: "Primary", initials: "AJ", photo: "/images/avatar-user.jpg", passport: "Valid until 14 Mar 2031" },
  { name: "Sarah Johnson", role: "Spouse", initials: "SJ", photo: "/images/avatar-emma.png", passport: "Valid until 14 Mar 2031" },
  { name: "Emma Johnson", role: "Child · Age 8", initials: "EJ", photo: "/images/avatar-child-girl.svg", passport: "⚠️ Expires 02 Jan 2026 — renew before travel" },
  { name: "Lucas Johnson", role: "Child · Age 5", initials: "LJ", photo: "/images/avatar-child-boy.svg", passport: "Valid until 14 Mar 2031" },
];

// Canned thread/itinerary for the sidebar's other conversations and saved
// trips — "San Francisco → Dallas" always prefers the live in-progress
// state instead, so clicking it never overwrites real progress.
const MOCK_CONVERSATION_THREADS: Record<string, Msg[]> = {
  nyc: [
    { from: "ai", type: "text", text: "Hello! I'm your AI Travel Concierge. I'll help you plan every detail of your trip — flights, hotels, transfers, restaurants and more.\nWhat kind of trip are you planning?", time: "09:12" },
    { from: "user", type: "text", text: "Business trip", time: "09:12" },
    { from: "ai", type: "text", text: "Perfect! Here are the best onward flight options for your family:" },
    { from: "ai", type: "cards", variant: "flight", options: [
      { title: "Delta Airlines · Nonstop", subtitle: "08:00 → 11:20 · 5h 20m", price: "$620", image: "/images/book-flight1.jpg", rating: 4.6, badge: "AI Pick" },
    ] },
    { from: "ai", type: "confirm", text: "Delta Airlines · Nonstop confirmed! Seats reserved at $620." },
    { from: "ai", type: "confirm", text: "All set! Your complete trip is ready — flights, hotel, transfers, activities, insurance, and forex all confirmed in your itinerary. Have a wonderful trip! 🎉" },
  ],
  london: [
    { from: "ai", type: "text", text: "Hello! I'm your AI Travel Concierge. I'll help you plan every detail of your trip — flights, hotels, transfers, restaurants and more.\nWhat kind of trip are you planning?", time: "14:03" },
    { from: "user", type: "text", text: "Business trip", time: "14:03" },
    { from: "ai", type: "text", text: "Got it — a business trip ✈️ Is this for a single meeting, multiple meetings, or a conference?" },
    { from: "ai", type: "chips", label: "Trip type", options: ["Single meeting", "Multiple meetings", "Conference", "Client visit"] },
    { from: "user", type: "text", text: "Conference", time: "14:04" },
    { from: "ai", type: "text", text: "Noted. I'm still working out the rest of the details for this trip — check back soon." },
  ],
};

const MOCK_TRIP_ITINERARIES: Record<string, CustomItinerary> = {
  "New York City": {
    title: "New York City Trip",
    destination: "New York, NY",
    days: [
      { label: "Day 1 — Arrival Day", activities: [
        { id: "nyc-1", text: "Delta Airlines · Nonstop", subtitle: "SFO → JFK · 5h 20m", time: "08:00", price: "$620", confirmed: true, aiAdded: true, icon: "plane" },
        { id: "nyc-2", text: "Check-in: The Peninsula New York", subtitle: "Deluxe Room · 4 nights", time: "14:00", price: "$480/night", confirmed: true, aiAdded: true, icon: "hotel" },
      ] },
      { label: "Day 4 — Departure Day", activities: [
        { id: "nyc-3", text: "Delta Airlines · Nonstop", subtitle: "JFK → SFO · 6h 10m", time: "18:45", price: "$610", confirmed: true, aiAdded: true, icon: "plane" },
      ] },
    ],
  },
  "London, UK": {
    title: "London Business Visit",
    destination: "London, UK",
    days: [
      { label: "Day 1 — Arrival Day", activities: [
        { id: "ldn-1", text: "British Airways · Nonstop", subtitle: "SFO → LHR · 10h 30m", time: "19:30", price: "$1,240", confirmed: true, aiAdded: true, icon: "plane" },
        { id: "ldn-2", text: "Check-in: The Savoy", subtitle: "Executive Room · 3 nights", time: "13:00", price: "$620/night", confirmed: true, aiAdded: true, icon: "hotel" },
      ] },
      { label: "Day 2", activities: [
        { id: "ldn-3", text: "Conference registration & networking", aiAdded: true },
      ] },
      { label: "Day 3 — Departure Day", activities: [
        { id: "ldn-4", text: "British Airways · Nonstop", subtitle: "LHR → SFO · 11h 05m", time: "16:15", price: "$1,180", confirmed: true, aiAdded: true, icon: "plane" },
      ] },
    ],
  },
  "Dubai, UAE": {
    title: "Dubai Trip",
    destination: "Dubai, UAE",
    days: [
      {
        label: "Day 1 — Arrival Day",
        activities: [
          { id: "s1-flight", text: "Reunion Airlines · Nonstop", subtitle: "07:00 → 13:15 · 6h 15m", time: "07:00", price: "$1,720", confirmed: true, aiAdded: true, icon: "plane" },
          { id: "s1-cab", text: "Airport Transfer", subtitle: "DXB Airport → Hotel", time: "14:00", price: "$32", confirmed: true, aiAdded: true, icon: "transport" },
          { id: "s1-hotel", text: "Check-in: Burj Al Arab", subtitle: "Deluxe Suite · 3 nights", time: "15:00", price: "$890/night", confirmed: true, aiAdded: true, icon: "hotel" },
        ],
      },
      {
        label: "Day 2 — City & Culture",
        activities: [
          { id: "s2-a1", text: "Burj Khalifa · At the Top", subtitle: "Skip-the-line · Level 124-125", time: "10:00", price: "$45/person", confirmed: true, aiAdded: true, icon: "camera" },
          { id: "s2-r1", text: "Dinner: Pierchic", subtitle: "Seafood · Overwater dining", time: "19:30", price: "$120/person", confirmed: true, aiAdded: true, icon: "dining" },
        ],
      },
      {
        label: "Day 3 — Desert & Departure",
        activities: [
          { id: "s3-a1", text: "Desert Safari with BBQ Dinner", subtitle: "Dune bashing · Camel ride · Live show", time: "15:00", price: "$75/person", confirmed: true, aiAdded: true, icon: "camera" },
          { id: "s3-flight", text: "Southwest Airlines · Nonstop", subtitle: "23:30 → 06:05+1 · 6h 35m", time: "23:30", price: "$780", confirmed: true, aiAdded: true, icon: "plane" },
        ],
      },
    ],
  },
};


type TripPace = "relaxed" | "balanced" | "packed";
interface DayPlanState { destination: string; totalDays: number; currentDay: number; pace: TripPace; paceConfirmed: boolean; itemsToday: number; }
const PACE_THRESHOLD: Record<TripPace, number> = { relaxed: 1, balanced: 2, packed: 4 };

const dayTaskCards: Record<"activity" | "restaurant" | "transport", { variant: string; options: CardOption[] }> = {
  activity: { variant: "activity", options: [
    { title: "Guided City Walking Tour", subtitle: "3 hours · Small group", price: "$28/person" },
    { title: "Landmark Museum Visit", subtitle: "Skip-the-line tickets", price: "$18/person" },
    { title: "Sunset Viewpoint Hike", subtitle: "Moderate · 2.5 h round trip", price: "$15/person" },
  ] },
  restaurant: { variant: "restaurant", options: [
    { title: "Rooftop Bistro", subtitle: "Modern local cuisine · Reservation", price: "$45/person" },
    { title: "Local Street Food Market", subtitle: "Casual · Highly rated", price: "$12/person" },
    { title: "Fine Dining Tasting Menu", subtitle: "7 courses · Wine pairing", price: "$120/person" },
  ] },
  transport: { variant: "cab", options: [
    { title: "Private Airport Transfer", subtitle: "Door-to-door · English-speaking driver", price: "$32" },
    { title: "Full-Day Cab Rental", subtitle: "8 hours · Unlimited stops", price: "$65" },
    { title: "Metro Day Pass", subtitle: "Unlimited rides · 24 hours", price: "$8" },
  ] },
};

const dayTaskChipOptions = ["Add an activity", "Add a restaurant", "Add local transport"];

type PersonaKey =
  | "business" | "family" | "family_elderly" | "honeymoon" | "solo" | "group"
  | "students" | "ladies" | "economy" | "luxury" | "second_innings"
  | "bachelors" | "mens" | "other";

const personaLabels: Record<PersonaKey, string> = {
  business: "Business Traveller",
  family: "Family with Kids",
  family_elderly: "Family with Elderly",
  honeymoon: "Honeymoon",
  solo: "Solo Traveller",
  group: "Small Group",
  students: "Students",
  ladies: "Ladies Special",
  economy: "Economy",
  luxury: "Luxury",
  second_innings: "Second Innings",
  bachelors: "Bachelors",
  mens: "Men's",
  other: "Other",
};

// Order matters — more specific phrases are matched before generic ones.
const personaTriggers: { key: PersonaKey; match: RegExp }[] = [
  { key: "family_elderly", match: /elderly|aging parent|senior parent|family.*(elder|parent)/i },
  { key: "second_innings", match: /second innings|retire(ment|d)?|senior citizen trip|60s? and beyond/i },
  { key: "students", match: /student|college trip|university trip/i },
  { key: "ladies", match: /ladies special|women.?only|girls trip|solo female/i },
  { key: "bachelors", match: /bachelor(ette)?|stag do|hen party/i },
  { key: "mens", match: /men.?s special|guys trip|boys trip|men.?s only/i },
  { key: "economy", match: /economy|budget trip|backpack/i },
  { key: "luxury", match: /luxury|5.?star trip|premium trip/i },
  { key: "business", match: /business/i },
  { key: "family", match: /famil/i },
  { key: "honeymoon", match: /honeymoon/i },
  { key: "solo", match: /solo/i },
  { key: "group", match: /group|friends trip/i },
  { key: "other", match: /other trip|something else/i },
];

interface PersonaMeta {
  tier: "economy" | "standard" | "luxury";
  tags: string[];
  intro: string;
  travelersHint: string;
}

const personaMeta: Record<PersonaKey, PersonaMeta> = {
  business: { tier: "standard", tags: ["work"], intro: "Got it — a business trip ✈️", travelersHint: "1 Adult" },
  family: { tier: "standard", tags: ["kids"], intro: "A family trip with the kids! 👨‍👩‍👧‍👦", travelersHint: "2 Adults, 2 Children" },
  family_elderly: { tier: "standard", tags: ["elderly"], intro: "A family trip with your parents along — I'll keep things comfortable and accessible. 👵👴", travelersHint: "2 Adults, 2 Elderly" },
  honeymoon: { tier: "luxury", tags: ["romance"], intro: "Congratulations! 💍", travelersHint: "2 Adults" },
  solo: { tier: "standard", tags: ["solo"], intro: "Nice, solo adventure! 🌍", travelersHint: "1 Adult" },
  group: { tier: "standard", tags: ["group"], intro: "Awesome, a group trip! 🎉", travelersHint: "4 Adults" },
  students: { tier: "economy", tags: ["budget", "nightlife"], intro: "A student trip — let's keep it fun and affordable! 🎒", travelersHint: "3 Adults" },
  ladies: { tier: "standard", tags: ["ladies", "safety"], intro: "A ladies-special trip — I'll prioritize safety and comfort throughout. 💃", travelersHint: "2 Adults" },
  economy: { tier: "economy", tags: ["budget"], intro: "Smart travel, great value — let's plan an economy trip. 💰", travelersHint: "2 Adults" },
  luxury: { tier: "luxury", tags: ["premium"], intro: "A luxury escape — only the best from here on. ✨", travelersHint: "2 Adults" },
  second_innings: { tier: "standard", tags: ["senior", "relaxed"], intro: "A well-earned second-innings trip — relaxed pace, comfortable stays. 🌅", travelersHint: "2 Adults" },
  bachelors: { tier: "standard", tags: ["bachelors", "nightlife"], intro: "A bachelor/bachelorette trip — let's make it memorable! 🥂", travelersHint: "4 Adults" },
  mens: { tier: "standard", tags: ["mens"], intro: "A men's trip — sounds fun! 🏄", travelersHint: "3 Adults" },
  other: { tier: "standard", tags: [], intro: "Got it — let's plan your trip! ✨", travelersHint: "2 Adults" },
};

const PERSONA_PICKER_OPTIONS: { key: PersonaKey; label: string }[] = [
  { key: "solo", label: "Solo" },
  { key: "family", label: "Family with Kids" },
  { key: "family_elderly", label: "Family with Elderly" },
  { key: "honeymoon", label: "Honeymoon" },
  { key: "business", label: "Business" },
  { key: "group", label: "Small Group" },
  { key: "students", label: "Students" },
  { key: "ladies", label: "Ladies Special" },
  { key: "mens", label: "Men's" },
  { key: "bachelors", label: "Bachelors" },
  { key: "economy", label: "Economy" },
  { key: "luxury", label: "Luxury" },
  { key: "second_innings", label: "Second Innings" },
  { key: "other", label: "Other" },
];

// Persona signals are flexible, not exclusive — e.g. "family with children,
// economy" — so combine several selections into one merged trip profile.
function mergePersonaMeta(keys: PersonaKey[]): { meta: PersonaMeta; label: string } {
  const tiers = keys.map((k) => personaMeta[k].tier);
  const tier: PersonaMeta["tier"] = tiers.includes("luxury") ? "luxury" : tiers.includes("economy") ? "economy" : "standard";
  const tags = [...new Set(keys.flatMap((k) => personaMeta[k].tags))];
  const label = keys.map((k) => personaLabels[k]).join(" + ");
  return {
    meta: { tier, tags, intro: `Great combo — ${label}! I'll tailor everything to match all of that.`, travelersHint: personaMeta[keys[0]].travelersHint },
    label,
  };
}

type TaskStatus = "not-started" | "in-progress" | "needs-attention" | "confirmed";

const READINESS_ROWS: { key: string; label: string }[] = [
  { key: "profile", label: "Traveller Profile" },
  { key: "documents", label: "Documents & Visa" },
  { key: "flights", label: "Flights" },
  { key: "hotels", label: "Hotels" },
  { key: "transport", label: "Local Transport" },
  { key: "itinerary", label: "Itinerary" },
  { key: "activities", label: "Activities & Guides" },
  { key: "restaurants", label: "Restaurants" },
  { key: "forex", label: "Forex" },
  { key: "connectivity", label: "Connectivity (SIM)" },
  { key: "language", label: "Language Support" },
  { key: "budget", label: "Budget" },
];

// Derives real readiness status from conversation progress. Precise per-step
// mapping is only possible for the generic-engine flow (fixed step order);
// hand-authored scripts fall back to a coarser in-progress/confirmed split.
// Every persona now runs the exact same 20-step reference script (steps
// 0–19, see the `family` workflow below), so readiness thresholds map to
// that one fixed step order regardless of which persona pill(s) were picked.
function computeReadiness(params: {
  personaTag: string | null;
  activeFlow: { persona: PersonaKey; step: number } | null;
  customItinerary: CustomItinerary | null;
}): Record<string, TaskStatus> {
  const { personaTag, activeFlow, customItinerary } = params;
  const r: Record<string, TaskStatus> = Object.fromEntries(READINESS_ROWS.map((x) => [x.key, "not-started"])) as Record<string, TaskStatus>;
  if (!personaTag) return r;
  r.profile = "confirmed";

  const itinActivityCount = customItinerary?.days.reduce((sum, d) => sum + d.activities.length, 0) ?? 0;
  r.itinerary = itinActivityCount > 0 ? "confirmed" : customItinerary ? "in-progress" : "not-started";

  const step = activeFlow ? activeFlow.step : 20;
  const at = (threshold: number): TaskStatus => (step > threshold ? "confirmed" : step === threshold ? "in-progress" : "not-started");
  r.documents = at(4);
  r.flights = at(6);
  r.hotels = at(10);
  r.transport = at(12);
  r.activities = at(14);
  r.restaurants = at(16);
  r.forex = at(18);
  // Connectivity/Language aren't part of the reference script — left
  // not-started, since nothing in the fixed conversation ever covers them.
  const confirmedCount = READINESS_ROWS.filter((x) => r[x.key] === "confirmed").length;
  r.budget = !activeFlow ? "confirmed" : confirmedCount >= 4 ? "in-progress" : "not-started";
  return r;
}

// Mock traveler roster per persona, used to proactively surface a per-member
// document briefing instead of waiting for the user to ask.
// Parses the traveler-count reply (e.g. "2 Adults, 2 Children, 1 Infants")
// into a real passenger roster, so the passenger form matches what was
// actually selected instead of a fixed persona mock.
// "San Francisco to Dubai" → { origin, destination }
function parseRoute(text: string): { origin: string; destination: string } {
  const m = text.match(/(.+?)\s+to\s+(.+)/i);
  return m ? { origin: m[1].trim(), destination: m[2].trim() } : { origin: "Origin", destination: text.trim() || "Destination" };
}

// "Depart Apr 25, 2026 – Return Apr 28, 2026" → { depart, ret }
function parseTripDates(text: string): { depart: string; ret: string } {
  const m = text.match(/Depart\s+(.+?)\s+[–-]\s+Return\s+(.+)/i);
  return m ? { depart: m[1].trim(), ret: m[2].trim() } : { depart: text.trim() || "TBD", ret: "TBD" };
}

// Turns the encoded "FLIGHT|airline|pnr|class|name:depSeat:retSeat,..." string
// from FlightDetailsFormMsg into a confirmation card with the full itinerary.
const MOCK_FLIGHT_NAMES = ["Emirates EK502", "Qatar Airways QR701", "Singapore Airlines SQ326", "Etihad Airways EY204"];
const MOCK_FLIGHT_CLASSES = ["Economy", "Premium Economy", "Business"];

function pnrHash(s: string): number {
  return s.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
}

// Simulates a PNR lookup: deterministically generates a flight name, class,
// and one seat per passenger from the PNR string, so re-submitting the same
// PNR always "fetches" the same result.
function mockFlightLookup(pnrSeed: string, roster: string[]) {
  const idx = pnrHash(pnrSeed);
  const hours = idx % 24;
  const minutes = (idx * 7) % 60;
  return {
    flightName: MOCK_FLIGHT_NAMES[idx % MOCK_FLIGHT_NAMES.length],
    flightClass: MOCK_FLIGHT_CLASSES[idx % MOCK_FLIGHT_CLASSES.length],
    departureTime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    seats: roster.map((_, i) => `${12 + i}${String.fromCharCode(65 + ((idx + i) % 6))}`),
  };
}

// Turns the encoded "FLIGHT|pnr" string from FlightDetailsFormMsg into the
// fetched departure + return flight details for every passenger.
function businessPlacesQuestionStep(): Msg[] {
  return [{ from: "ai", type: "text", text: "I will create daywise itinerary for you. You can do necessary changes in the same" }];
}

function businessMeetingQuestionStep(): Msg[] {
  return [{ from: "ai", type: "text", text: "Let's start with Day 1 of your schedule — when and where is your first meeting? (e.g. \"10:00 AM at 500 Elm Street, Downtown Dallas\")" }];
}

function businessMeetingHotelStep(meetingLocation: string, placesText: string | null): Msg[] {
  const placesNote = placesText ? ` and close to ${placesText}` : "";
  return [
    { from: "ai", type: "text", text: `Here are hotels closest to your first meeting (${meetingLocation})${placesNote}:` },
    {
      from: "ai", type: "cards", variant: "hotel", options: [
        { title: "The Ritz-Carlton Dallas", subtitle: `5 min walk to ${meetingLocation}`, price: "$520/night", image: "/images/book-hotel1.jpg", tags: ["Near meeting", "Business Lounge"], rating: 4.9, badge: "AI Pick" },
        { title: "Omni Dallas Hotel", subtitle: `10 min walk to ${meetingLocation}`, price: "$380/night", image: "/images/book-hotel2.jpg", tags: ["Meeting rooms", "Gym"], rating: 4.7 },
        { title: "Aloft Dallas Downtown", subtitle: `15 min walk to ${meetingLocation}`, price: "$295/night", image: "/images/book-hotel3.jpg", tags: ["Budget-friendly"], rating: 4.5 },
      ],
    },
  ];
}

function buildFlightConfirmMsg(encoded: string, routeText: string | null, datesText: string | null, roster: string[]): Msg[] {
  const pnr = encoded.split("|")[1]?.trim() || "—";
  const { origin, destination } = parseRoute(routeText ?? "");
  const { depart, ret } = parseTripDates(datesText ?? "");
  const departure = mockFlightLookup(`${pnr}-D`, roster);
  const returning = mockFlightLookup(`${pnr}-R`, roster);

  function leg(title: string, onboardLocation: string, flight: typeof departure): Msg {
    return {
      from: "ai", type: "flightLeg", title, onboardLocation, flightName: flight.flightName, departureTime: flight.departureTime,
      passengers: roster.map((name, i) => ({ name, cls: flight.flightClass, seat: flight.seats[i] })),
    };
  }

  return [
    leg(`Departure Flight · PNR ${pnr} · ${depart}`, origin, departure),
    leg(`Return Flight · PNR ${pnr} · ${ret}`, destination, returning),
  ];
}

const DUMMY_ADULT_NAMES = ["Priya Sharma", "Rahul Mehta", "Neha Kapoor", "Vikram Rao", "Ananya Iyer", "Karan Nair"];
const DUMMY_CHILD_NAMES = ["Aarav Sharma", "Diya Sharma", "Kabir Mehta", "Myra Kapoor"];
const DUMMY_INFANT_NAMES = ["Ishaan Sharma", "Aadhya Mehta"];

function parseTravelerRoster(text: string): string[] | null {
  const adultsMatch = text.match(/(\d+)\s*Adults?/i);
  if (!adultsMatch) return null;
  const childrenMatch = text.match(/(\d+)\s*Children/i);
  const infantsMatch = text.match(/(\d+)\s*Infants?/i);
  const adults = parseInt(adultsMatch[1], 10);
  const children = childrenMatch ? parseInt(childrenMatch[1], 10) : 0;
  const infants = infantsMatch ? parseInt(infantsMatch[1], 10) : 0;
  const roster: string[] = [];
  for (let i = 0; i < adults; i++) roster.push(i === 0 ? "Amit Sharma (You)" : `${DUMMY_ADULT_NAMES[(i - 1) % DUMMY_ADULT_NAMES.length]} (Adult)`);
  for (let i = 0; i < children; i++) roster.push(`${DUMMY_CHILD_NAMES[i % DUMMY_CHILD_NAMES.length]} (Child)`);
  for (let i = 0; i < infants; i++) roster.push(`${DUMMY_INFANT_NAMES[i % DUMMY_INFANT_NAMES.length]} (Infant)`);
  return roster.length ? roster : null;
}

function travelerRoster(key: PersonaKey): string[] {
  switch (key) {
    case "family": return ["Amit Sharma (You)", "Priya Sharma (Spouse)", "Aarav Sharma (Child)", "Diya Sharma (Child)"];
    case "family_elderly": return ["Amit Sharma (You)", "Priya Sharma (Spouse)", "Lakshmi Rao (Mother)", "Ramesh Rao (Father)"];
    case "honeymoon": return ["Amit Sharma (You)", "Priya Sharma (Spouse)"];
    case "group": return ["Amit Sharma (You)", "Rahul Mehta", "Vikram Rao", "Karan Nair"];
    case "students": return ["Amit Sharma (You)", "Rahul Mehta", "Vikram Rao"];
    case "ladies": return ["Ananya Iyer (You)", "Neha Kapoor"];
    case "bachelors": return ["Amit Sharma (You)", "Rahul Mehta", "Vikram Rao", "Karan Nair"];
    case "mens": return ["Amit Sharma (You)", "Rahul Mehta", "Vikram Rao"];
    case "economy": case "luxury": case "second_innings": return ["Amit Sharma (You)", "Priya Sharma (Companion)"];
    default: return ["Amit Sharma (You)"];
  }
}

// Proactively checks every traveler's documents on file and reports status +
// dates upfront, before asking anything — rather than reacting to a chip pick.
function documentBriefing(rosterKey: PersonaKey, meta: PersonaMeta, rosterOverride?: string[]): Msg[] {
  const roster = rosterOverride ?? travelerRoster(rosterKey);
  const renewalIdx = meta.tags.includes("kids")
    ? roster.findIndex((m) => m.includes("(Child)"))
    : meta.tags.includes("elderly") || meta.tags.includes("senior")
      ? roster.findIndex((m) => /\(Mother\)|\(Father\)/.test(m))
      : -1;

  const rows = roster.map((member, i) =>
    i === renewalIdx
      ? { label: `${member} — Passport`, value: "⚠️ Expires 02 Jan 2026 (renew before travel)" }
      : { label: `${member} — Passport`, value: "✅ Valid until 14 Mar 2031" }
  );
  rows.push({ label: "Visa (all travelers)", value: "Required — apply by 3 weeks before departure" });

  return [
    { from: "ai", type: "text", text: "I've checked everyone's travel documents on file — here's where things stand:" },
    { from: "ai", type: "info", title: "Travel Document Status", rows },
    {
      from: "ai", type: "chips", label: "Next step",
      options: renewalIdx >= 0
        ? ["Help me renew the passport", "Apply visas for the group", "I'll handle it myself"]
        : ["Apply visas for the group", "All sorted — continue"],
    },
  ];
}

function detectPersona(text: string): PersonaKey | null {
  const hit = personaTriggers.find((p) => p.match.test(text));
  return hit ? hit.key : null;
}

const PROFILE_KEY = "voyageai_traveler_profile";

function saveTravelerProfile(persona: PersonaKey) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ persona, label: personaLabels[persona], tier: personaMeta[persona].tier, savedAt: Date.now() }));
  } catch { /* localStorage unavailable — skip silently */ }
}

// ---------------------------------------------------------------------------
// Tiered + tag-aware card catalogs shared by the generic persona builder
// ---------------------------------------------------------------------------
type Tier = "economy" | "standard" | "luxury";

function tierPick<T>(map: Record<Tier, T[]>, tier: Tier): T[] {
  return map[tier];
}

const flightCatalog: Record<Tier, CardOption[]> = {
  economy: [
    { title: "Southwest Airlines · 1 stop", subtitle: "Basic economy · Budget fare", price: "$420", image: "/images/book-flight2.jpg", tags: ["Budget fare"], rating: 4.1, badge: "AI Pick" },
    { title: "Spirit Airlines · Nonstop", subtitle: "No frills · Lowest fare", price: "$290", image: "/images/book-flight3.jpg", tags: ["Lowest fare"], rating: 3.8 },
  ],
  standard: [
    { title: "United Economy Plus · Nonstop", subtitle: "Extra legroom · Free bag", price: "$780", image: "/images/book-flight1.jpg", tags: ["Non-stop", "Extra legroom"], rating: 4.6, badge: "AI Pick" },
    { title: "Delta Comfort+ · Nonstop", subtitle: "Priority boarding", price: "$860", image: "/images/book-flight2.jpg", tags: ["Non-stop", "Priority boarding"], rating: 4.5 },
  ],
  luxury: [
    { title: "Emirates Business Class · Nonstop", subtitle: "Lie-flat seat · Lounge access", price: "$3,200", image: "/images/book-flight3.jpg", tags: ["Lie-flat seat", "Lounge access"], rating: 4.9, badge: "AI Pick" },
    { title: "Singapore Airlines Suites", subtitle: "Private suite · Chauffeur transfer", price: "$5,400", image: "/images/book-flight1.jpg", tags: ["Private suite", "Chauffeur"], rating: 5.0 },
  ],
};

const hotelCatalog: Record<Tier, CardOption[]> = {
  economy: [
    { title: "Budget Inn Express", subtitle: "Clean & simple · Free Wi-Fi", price: "$65/night", image: "/images/book-hotel3.jpg", tags: ["Free Wi-Fi"], rating: 4.0, badge: "AI Pick" },
    { title: "City Hostel & Co-work", subtitle: "Social lounge · Shared kitchen", price: "$32/night", image: "/images/book-hotel2.jpg", tags: ["Shared kitchen"], rating: 4.2 },
  ],
  standard: [
    { title: "Marriott Downtown", subtitle: "Free Wi-Fi · Gym & pool", price: "$210/night", image: "/images/book-hotel1.jpg", tags: ["Gym", "Pool"], rating: 4.6, badge: "AI Pick" },
    { title: "Hyatt Regency", subtitle: "Central location · Breakfast included", price: "$185/night", image: "/images/book-hotel2.jpg", tags: ["Breakfast included"], rating: 4.5 },
  ],
  luxury: [
    { title: "The Ritz-Carlton", subtitle: "5★ · Spa · Skyline views", price: "$520/night", image: "/images/book-hotel1.jpg", tags: ["Spa", "Skyline views"], rating: 4.9, badge: "AI Pick" },
    { title: "Overwater Villa Suite", subtitle: "Private pool · Butler service", price: "$780/night", image: "/images/book-hotel3.jpg", tags: ["Private pool", "Butler service"], rating: 4.8 },
  ],
};

const cabCatalog: Record<Tier, CardOption[]> = {
  economy: [
    { title: "Shared Shuttle", subtitle: "Budget airport transfer", price: "$12/trip", image: "/images/book-transport2.jpg", rating: 4.0, badge: "AI Pick" },
    { title: "Metro Day Pass", subtitle: "Unlimited rides · 24 hours", price: "$8", image: "/images/book-transport1.jpg", rating: 4.2 },
  ],
  standard: [
    { title: "Private Airport Transfer", subtitle: "Door-to-door", price: "$32", image: "/images/book-transport1.jpg", tags: ["Meet & greet"], rating: 4.6, badge: "AI Pick" },
    { title: "Full-Day Cab Rental", subtitle: "8 hours · Unlimited stops", price: "$65", image: "/images/book-transport2.jpg", rating: 4.4 },
  ],
  luxury: [
    { title: "Chauffeured Sedan", subtitle: "Private driver · All day", price: "$140/day", image: "/images/book-transport1.jpg", tags: ["Private driver"], rating: 4.9, badge: "AI Pick" },
    { title: "Luxury SUV Transfer", subtitle: "Meet & greet · Premium fleet", price: "$95/trip", image: "/images/book-transport2.jpg", tags: ["Premium fleet"], rating: 4.8 },
  ],
};

const guideCatalog: Record<Tier, CardOption[]> = {
  economy: [{ title: "Group Walking Tour Guide", subtitle: "Shared group · 2 hours", price: "$15/person" }],
  standard: [{ title: "Kenji Sato", subtitle: "Food & Culture · ★4.8", price: "$70/half-day" }, { title: "Aiko Tanaka", subtitle: "Temples & Gardens · ★4.9", price: "$65/half-day" }],
  luxury: [{ title: "Private VIP Guide & Driver", subtitle: "Full day · Skip-the-line access", price: "$280/day" }],
};

const activityCatalog: Record<Tier, CardOption[]> = {
  economy: [{ title: "Free Walking Tour", subtitle: "Tip-based · 2.5 hours", price: "Free" }, { title: "Local Market Crawl", subtitle: "Self-guided · Street food", price: "$5" }],
  standard: [{ title: "Landmark Museum Visit", subtitle: "Skip-the-line tickets", price: "$18/person" }, { title: "Sunset Viewpoint Hike", subtitle: "Moderate · 2.5h round trip", price: "$15/person" }],
  luxury: [{ title: "Private Yacht Sunset Cruise", subtitle: "3 hours · Champagne included", price: "$450" }, { title: "Spa & Wellness Day", subtitle: "Full day · Couples treatment available", price: "$320" }],
};

const restaurantCatalog: Record<Tier, CardOption[]> = {
  economy: [{ title: "Local Street Food Market", subtitle: "Casual · Highly rated", price: "$8/person" }],
  standard: [{ title: "Rooftop Bistro", subtitle: "Modern local cuisine", price: "$45/person" }],
  luxury: [{ title: "Chef's Tasting Menu", subtitle: "7 courses · Wine pairing", price: "$180/person" }],
};

const simCards: CardOption[] = [
  { title: "Local Tourist SIM", subtitle: "7-day unlimited data", price: "$18" },
  { title: "eSIM (instant activation)", subtitle: "10GB, 30 days", price: "$19" },
];
const forexCards: CardOption[] = [
  { title: "VoyageAI Travel Card", subtitle: "Prepaid · Zero forex markup", price: "$500 loaded", image: "/images/book-forex1.jpg", tags: ["Zero fees", "Instant load"], badge: "Best Rate" },
  { title: "Currency Exchange", subtitle: "Cash pickup at airport", price: "Best rate", image: "/images/book-forex2.jpg", tags: ["Cash pickup"] },
];
const insuranceCards: CardOption[] = [
  { title: "VoyageAI Standard Cover", subtitle: "Medical + cancellation", price: "$60/person", image: "/images/book-insurance1.jpg", tags: ["Medical", "Cancellation"], rating: 4.6, badge: "Best" },
  { title: "VoyageAI Comprehensive Cover", subtitle: "Medical, cancellation, lost baggage", price: "$95/person", image: "/images/book-insurance2.jpg", tags: ["Medical", "Baggage"], rating: 4.8 },
];

// Tag-specific cards, prepended to the relevant tier catalog when a persona carries that tag.
const tagHotelCard: Record<string, CardOption> = {
  kids: { title: "Family Resort & Suites", subtitle: "Kids club · Pool · Connecting rooms", price: "$260/night" },
  elderly: { title: "Ground-Floor Accessible Suites", subtitle: "Elevator · Step-free access · Grab bars", price: "$220/night" },
  senior: { title: "Quiet Garden Wing Rooms", subtitle: "Elevator access · Away from nightlife", price: "$195/night" },
  ladies: { title: "Female-Only Floor Rooms", subtitle: "Keycard-restricted floor · 24h security", price: "$200/night" },
};
const tagCabCard: Record<string, CardOption> = {
  ladies: { title: "Women-Only Cab Service", subtitle: "Verified female drivers · Live tracking", price: "$38/trip" },
  elderly: { title: "Wheelchair-Accessible Cab", subtitle: "Ramp-equipped · Assisted boarding", price: "$40/trip" },
  senior: { title: "Wheelchair-Accessible Cab", subtitle: "Ramp-equipped · Assisted boarding", price: "$40/trip" },
};
const tagGuideCard: Record<string, CardOption> = {
  ladies: { title: "Priya Nair (Female Guide)", subtitle: "Culture & Shopping · ★4.9", price: "$68/half-day" },
  elderly: { title: "Gentle-Pace Heritage Guide", subtitle: "Slow walking pace · Seating breaks", price: "$60/half-day" },
  senior: { title: "Gentle-Pace Heritage Guide", subtitle: "Slow walking pace · Seating breaks", price: "$60/half-day" },
};
const tagActivityCard: Record<string, CardOption> = {
  kids: { title: "Interactive Science Museum", subtitle: "All-ages · Hands-on exhibits", price: "$16/child" },
  elderly: { title: "Botanical Gardens Stroll", subtitle: "Low-intensity · Benches throughout", price: "$10/person" },
  senior: { title: "Botanical Gardens Stroll", subtitle: "Low-intensity · Benches throughout", price: "$10/person" },
  nightlife: { title: "Rooftop Bar Crawl", subtitle: "Small group · Budget-friendly", price: "$20/person" },
};

function withTagFirst(base: CardOption[], tags: string[], tagMap: Record<string, CardOption>): CardOption[] {
  const extra = tags.map((t) => tagMap[t]).find(Boolean);
  return extra ? [extra, ...base] : base;
}

// Generic step builder — used for personas that don't have a hand-authored
// script, and for any composite persona combination picked from the
// multi-select persona picker. `rosterKey` drives the mock traveler names;
// `meta`/`label` may be a merged composite of several selected personas.
function buildGenericSteps(rosterKey: PersonaKey, meta: PersonaMeta, label: string): Msg[][] {
  return [
    // 0
    [{ from: "ai", type: "text", text: "Perfect! Where are you flying from, and what is your destination? (e.g. \"San Francisco to Dubai\")" }],
    // 1
    [{ from: "ai", type: "text", text: "When would you like to travel? Select your departure and return dates:" }, { from: "ai", type: "datepicker" }],
    // 2
    [{ from: "ai", type: "text", text: `How many people are traveling? (Typical for this trip type: ${meta.travelersHint})` }, { from: "ai", type: "travelers" }],
    // 3
    [{ from: "ai", type: "text", text: "How long is your trip?" }, { from: "ai", type: "chips", label: "Trip length", options: ["2–3 nights", "4–6 nights", "7+ nights"] }],
    // 4 — Passport & Visa
    documentBriefing(rosterKey, meta),
    // 5 — Hotels
    [{ from: "ai", type: "text", text: "What type of stay are you looking for?" }, { from: "ai", type: "chips", label: "Stay type", options: ["5-Star Luxury", "Comfortable Mid-range", "Budget-friendly"] }],
    // 6
    [{ from: "ai", type: "text", text: "Any facilities that matter most to you?" }, { from: "ai", type: "chips", label: "Facilities", options: ["Free breakfast", "Free Wi-Fi", "No specific preference"] }],
    // 7
    [{ from: "ai", type: "text", text: "Here are stays that match your trip:" }, { from: "ai", type: "cards", variant: "hotel", options: withTagFirst(tierPick(hotelCatalog, meta.tier), meta.tags, tagHotelCard) }],
    // 8
    [{ from: "ai", type: "text", text: meta.tags.includes("ladies") || meta.tags.includes("elderly") || meta.tags.includes("senior") ? "Would you like me to enable live safety check-ins for this trip?" : "You have loyalty points on file — apply them to this stay?" }, { from: "ai", type: "chips", label: "Confirm", options: ["Yes, please", "No thanks"] }],
    // 9 — Flights
    [{ from: "ai", type: "text", text: "Do you have a specific flight in mind, or shall I find the best options?" }, { from: "ai", type: "chips", label: "Flights", options: ["Help me find the best flight", "I have a flight in mind"] }],
    // 10
    [{ from: "ai", type: "text", text: "Here are flight options that match your style:" }, { from: "ai", type: "cards", variant: "flight", options: tierPick(flightCatalog, meta.tier) }],
    // 11 — Local Taxi
    [{ from: "ai", type: "text", text: "Let's sort local transport — here are cab options for you:" }, { from: "ai", type: "cards", variant: "cab", options: withTagFirst(tierPick(cabCatalog, meta.tier), meta.tags, tagCabCard) }],
    // 12 — Tour Guide
    [{ from: "ai", type: "text", text: "Would you like a local tour guide?" }, { from: "ai", type: "chips", label: "Guide", options: ["Yes, book a guide", "No thanks"] }],
    // 13
    [{ from: "ai", type: "text", text: "Here are vetted local guides:" }, { from: "ai", type: "cards", variant: "guide", options: withTagFirst(tierPick(guideCatalog, meta.tier), meta.tags, tagGuideCard) }],
    // 14 — Local recreational activities
    [{ from: "ai", type: "text", text: "Here are recreational activities picked for your trip:" }, { from: "ai", type: "cards", variant: "activity", options: withTagFirst(tierPick(activityCatalog, meta.tier), meta.tags, tagActivityCard) }],
    // 15 — Forex
    [{ from: "ai", type: "text", text: "Want me to arrange local currency forex at the best rate?" }, { from: "ai", type: "cards", variant: "forex", options: forexCards }],
    // 16 — SIM Card
    [{ from: "ai", type: "text", text: "Let's get you connected — local SIM or eSIM options:" }, { from: "ai", type: "cards", variant: "sim", options: simCards }],
    // 17 — Multilingual support
    [{ from: "ai", type: "text", text: "I can chat in over 40 languages 🌐 Which would you like to continue in?" }, { from: "ai", type: "chips", label: "Language", options: ["English", "Español", "Français", "日本語", "Deutsch", "中文"] }],
    // 18 — Local restaurants
    [{ from: "ai", type: "text", text: "Would you like a restaurant recommendation?" }, { from: "ai", type: "cards", variant: "restaurant", options: tierPick(restaurantCatalog, meta.tier) }],
    // 19 — Insurance (assumed necessary, not explicitly listed)
    [{ from: "ai", type: "text", text: "Last thing — travel insurance for peace of mind:" }, { from: "ai", type: "cards", variant: "insurance", options: insuranceCards }],
    // 20 — final
    [{ from: "ai", type: "confirm", text: `Your ${label} trip is fully planned — documents, stay, flights, transport, guide, activities, forex, connectivity, dining, and cover are all set. Have a wonderful trip! 🎉` }],
  ];
}

// Each persona has an ordered list of "turns" — every user reply while a workflow
// is active advances to the next turn, until the workflow completes.
const personaWorkflows: Record<PersonaKey, Msg[][]> = {
  business: [
    [
      { from: "ai", type: "text", text: "Got it — a business trip ✈️ Is this for a single meeting, multiple meetings, or a conference?" },
      { from: "ai", type: "chips", label: "Trip type", options: ["Single meeting", "Multiple meetings", "Conference", "Client visit"] },
    ],
    [
      { from: "ai", type: "text", text: "Noted. Do you need fast Wi-Fi and a quiet workspace at your hotel?" },
      { from: "ai", type: "chips", label: "Workspace needs", options: ["Yes, essential", "Not necessary"] },
    ],
    [
      { from: "ai", type: "text", text: "Here are business-friendly nonstop flights with lounge access:" },
      { from: "ai", type: "cards", variant: "flight", options: [
        { title: "United Business Select · Nonstop", subtitle: "Lounge access · Flexible fare", price: "$890", image: "/images/book-flight1.jpg", tags: ["Lounge access", "Flexible fare"], rating: 4.7, badge: "AI Pick" },
        { title: "Delta One · Nonstop", subtitle: "Lie-flat seat · Priority boarding", price: "$1,240", image: "/images/book-flight2.jpg", tags: ["Lie-flat seat"], rating: 4.8 },
      ] },
    ],
    [
      { from: "ai", type: "text", text: "And hotels near the business district with workspace + fast Wi-Fi:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "Marriott Downtown", subtitle: "Business Lounge · Free Wi-Fi", price: "$260/night", image: "/images/book-hotel1.jpg", tags: ["Business Lounge", "Free Wi-Fi"], rating: 4.6, badge: "AI Pick" },
        { title: "Hyatt Regency", subtitle: "Meeting rooms · 24h gym", price: "$210/night", image: "/images/book-hotel2.jpg", tags: ["Meeting rooms", "24h gym"], rating: 4.5 },
      ] },
    ],
    [
      { from: "ai", type: "text", text: "Want me to block focus time on your calendar between meetings?" },
      { from: "ai", type: "chips", label: "Calendar", options: ["Yes, block time", "No thanks"] },
    ],
    [
      { from: "ai", type: "text", text: "One more thing — since you'll be traveling internationally, want me to set up a local SIM or calling card for Tokyo?" },
      { from: "ai", type: "chips", label: "Connectivity", options: ["Physical SIM", "eSIM", "Not needed"] },
    ],
    [
      { from: "ai", type: "text", text: "Here are your options at Narita Airport:" },
      { from: "ai", type: "cards", variant: "sim", options: [
        { title: "Softbank Tourist SIM", subtitle: "Physical SIM · 7-day unlimited data", price: "¥3,500" },
        { title: "Airalo Japan eSIM", subtitle: "eSIM · 10GB, 30 days, instant activation", price: "$19" },
        { title: "International Calling Card", subtitle: "60 minutes, any country", price: "¥1,200" },
      ] },
      { from: "ai", type: "confirm", text: "Connectivity sorted — activation details will be sent to your email before departure." },
    ],
    [
      { from: "ai", type: "confirm", text: "Your business trip is taking shape — flights, hotel, and connectivity shortlisted, calendar sync ready." },
    ],
  ],
  solo: [
    [
      { from: "ai", type: "text", text: "Nice, solo adventure! 🌍 What's your vibe?" },
      { from: "ai", type: "chips", label: "Trip style", options: ["Adventure & Outdoors", "Culture & Food", "Relaxation"] },
    ],
    [
      { from: "ai", type: "text", text: "Love it. Want solo-friendly stays, a local guide, or both?" },
      { from: "ai", type: "chips", label: "Support", options: ["Solo-friendly stays", "Local guide", "Both"] },
    ],
    [
      { from: "ai", type: "text", text: "Here's a solo-friendly stay, plus vetted local guides for Kyoto:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "Boutique Hostel & Co-work", subtitle: "Social lounge · Solo-friendly", price: "$45/night", image: "/images/book-hotel3.jpg", tags: ["Social lounge", "Solo-friendly"], rating: 4.5, badge: "AI Pick" },
      ] },
      { from: "ai", type: "cards", variant: "guide", options: [
        { title: "Aiko Tanaka", subtitle: "Temples & Gardens · ★4.9", price: "$65/half-day" },
        { title: "Kenji Sato", subtitle: "Food & Culture · ★4.8", price: "$70/half-day" },
        { title: "Yui Nakamura", subtitle: "Photography Tours · ★5.0", price: "$85/half-day" },
      ] },
    ],
    [
      { from: "ai", type: "text", text: "Great pick! She speaks English and Japanese fluently. Want her to also arrange a traditional tea ceremony during the tour?" },
      { from: "ai", type: "chips", label: "Tea ceremony", options: ["Yes please!", "No thanks"] },
    ],
    [
      { from: "ai", type: "confirm", text: "Tea ceremony added to your Kyoto tour — your guide will meet you at the hotel lobby at 9:00 AM." },
      { from: "ai", type: "text", text: "For safety, want me to enable live location sharing with an emergency contact during your trip?" },
      { from: "ai", type: "chips", label: "Safety", options: ["Yes, enable it", "No thanks"] },
    ],
    [
      { from: "ai", type: "confirm", text: "You're set for a great solo trip — stay, local guide, and tea ceremony shortlisted, safety sharing configured." },
    ],
  ],
  family: [
    // 0 — pushed immediately when "family" is detected
    [
      { from: "ai", type: "text", text: "Perfect! Where are you flying from, and what is your destination? (e.g. \"San Francisco to Dubai\")" },
    ],
    // 1
    [
      { from: "ai", type: "text", text: "Great choice! When would you like to travel? Select your departure and return dates:" },
      { from: "ai", type: "datepicker" },
    ],
    // 2
    [
      { from: "ai", type: "text", text: "Got it. How many people are traveling with you?" },
      { from: "ai", type: "travelers" },
    ],
    // 3 — duration is already implied by the departure/return date range
    [
      { from: "ai", type: "text", text: "Do you have a specific flight in mind, or shall I find the best options for your family?" },
      { from: "ai", type: "chips", label: "Flights", options: ["Help me find the best flight", "I have a flight in mind"] },
    ],
    // 4
    [
      { from: "ai", type: "text", text: "I found your family's passport and children's records from your previous trip 🎉 Want to use the same passenger details for everyone?" },
      { from: "ai", type: "chips", label: "Passenger details", options: ["Yes, use them all", "Enter new details"] },
    ],
    // 5 — Onward journey
    [
      { from: "ai", type: "text", text: "Perfect! Here are the best onward flight options for your family:" },
      { from: "ai", type: "cards", variant: "flight", options: [
        { title: "Reunion Airlines · Nonstop", subtitle: "07:00 → 13:15 · 6h 15m", price: "$1,720", image: "/images/book-flight1.jpg", tags: ["Non-stop", "Economy · 4 pax"], rating: 4.7, badge: "AI Pick" },
        { title: "Southwest Airlines · Nonstop", subtitle: "10:30 → 17:05 · 6h 35m", price: "$780", image: "/images/book-flight2.jpg", tags: ["Non-stop", "Economy · 4 pax"], rating: 4.3 },
      ] },
    ],
    // 6 — Return journey
    [
      { from: "ai", type: "text", text: "Great choice! And here are the best return flight options:" },
      { from: "ai", type: "cards", variant: "flight", options: [
        { title: "Reunion Airlines · Nonstop", subtitle: "18:20 → 21:10 · 6h 50m", price: "$1,650", image: "/images/book-flight3.jpg", tags: ["Non-stop", "Economy · 4 pax"], rating: 4.6, badge: "AI Pick" },
        { title: "Southwest Airlines · Nonstop", subtitle: "21:45 → 00:40+1 · 6h 55m", price: "$740", image: "/images/book-flight1.jpg", tags: ["Non-stop", "Economy · 4 pax"], rating: 4.2 },
      ] },
    ],
    // 7
    [
      { from: "ai", type: "text", text: "Would you like to stay at the same hotel as last time, or shall I suggest something new?" },
      { from: "ai", type: "chips", label: "Hotel", options: ["Suggest something new", "Same as last time"] },
    ],
    // 8
    [
      { from: "ai", type: "text", text: "What type of stay are you looking for?" },
      { from: "ai", type: "chips", label: "Stay type", options: ["5-Star Luxury", "Comfortable Mid-range", "Budget-friendly"] },
    ],
    // 9
    [
      { from: "ai", type: "text", text: "Any facilities you need for the family?" },
      { from: "ai", type: "chips", label: "Facilities", options: ["Children-friendly", "Pool & fitness", "No specific preference"] },
    ],
    // 10
    [
      { from: "ai", type: "text", text: "Here are the best family-friendly hotels for your dates:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "The Ritz-Carlton Dallas", subtitle: "0.4 km to Business District", price: "$520/night", image: "/images/book-hotel1.jpg", tags: ["Kids Club", "Family Pool", "Spa"], rating: 4.9, badge: "AI Pick" },
        { title: "Omni Dallas Hotel", subtitle: "0.1 km to Business District", price: "$380/night", image: "/images/book-hotel2.jpg", tags: ["Kids Pool", "Family Rooms", "Gym"], rating: 4.7 },
        { title: "Aloft Dallas Downtown", subtitle: "0.2 km to Business District", price: "$295/night", image: "/images/book-hotel3.jpg", tags: ["Rooftop Pool", "Pet Friendly"], rating: 4.5 },
      ] },
    ],
    // 11
    [
      { from: "ai", type: "text", text: "Hotel confirmed! You have 12,400 loyalty points. Would you like to apply them toward this stay?" },
      { from: "ai", type: "chips", label: "Loyalty points", options: ["Yes, apply my points", "No thanks"] },
    ],
    // 12
    [
      { from: "ai", type: "text", text: "Points applied — saving $280! Would you like me to arrange cab transfers from the airport?" },
      { from: "ai", type: "cards", variant: "cab", options: [
        { title: "Yellow Cab Dallas (7-seater)", subtitle: "DFW Airport → Hotel · 4 pax", price: "$48/trip", image: "/images/book-transport1.jpg", tags: ["Child seats", "Meet & greet"], rating: 4.6, badge: "AI Pick" },
        { title: "Uber XL", subtitle: "On-demand · 4 stops", price: "$36/trip", image: "/images/book-transport2.jpg", tags: ["On-demand"], rating: 4.4 },
      ] },
    ],
    // 13
    [
      { from: "ai", type: "text", text: "Transfers booked! Would you like me to suggest fun things to do in Dallas with the family?" },
      { from: "ai", type: "chips", label: "Activities", options: ["Suggest family activities", "I'll plan my own"] },
    ],
    // 14
    [
      { from: "ai", type: "text", text: "Here are some great things to do in Dallas:" },
      { from: "ai", type: "cards", variant: "activity", options: [
        { title: "Reunion Tower GeO-Deck", subtitle: "1–2 hrs · Panoramic city views", price: "$26/person", image: "/images/book-act-fuji.jpg", tags: ["Viewpoint"], badge: "Pick" },
        { title: "Perot Museum of Nature", subtitle: "2–3 hrs · Interactive exhibits", price: "$22/person", image: "/images/book-act-kyoto.jpg", tags: ["Museum"], badge: "Pick" },
        { title: "Dallas Arboretum", subtitle: "2 hrs · Gardens & seasonal festival", price: "$15/person", image: "/images/book-act-onsen.jpg", tags: ["Outdoor"] },
      ] },
    ],
    // 15
    [
      { from: "ai", type: "text", text: "Activities added! Do you have dinner plans this evening?" },
      { from: "ai", type: "chips", label: "Dinner", options: ["Suggest a restaurant", "We have plans"] },
    ],
    // 16
    [
      { from: "ai", type: "text", text: "Shall I book a top family-friendly restaurant for you?" },
      { from: "ai", type: "cards", variant: "restaurant", options: [
        { title: "Knife Dallas", subtitle: "Prime Steakhouse · Available 8:30 PM", price: "$150/person", image: "/images/book-hotel1.jpg", tags: ["Kid-friendly"], rating: 4.9, badge: "AI Pick" },
        { title: "Nobu Dallas", subtitle: "Japanese Fusion · Available 8:30 PM", price: "$180/person", image: "/images/book-hotel2.jpg", rating: 4.8 },
        { title: "CBD Provisions", subtitle: "Modern American · Available 8:00 PM", price: "$110/person", image: "/images/book-hotel3.jpg", rating: 4.7 },
      ] },
    ],
    // 17
    [
      { from: "ai", type: "text", text: "Restaurant reserved! Would you like travel insurance for your family? Covers medical, cancellations, and lost baggage." },
      { from: "ai", type: "cards", variant: "insurance", options: [
        { title: "VoyageAI Family Shield", subtitle: "AIG Travel", price: "$48/family", image: "/images/book-insurance1.jpg", tags: ["Medical up to $500K", "Cancellation $10K", "Baggage $5K"], rating: 4.9, badge: "Best" },
        { title: "Basic Family Cover", subtitle: "Allianz Travel", price: "$28/family", image: "/images/book-insurance2.jpg", tags: ["Medical up to $100K", "Cancellation $2K", "Baggage $1K"], rating: 4.3 },
      ] },
    ],
    // 18
    [
      { from: "ai", type: "text", text: "Great choice! Want me to also arrange local currency forex? I can get you the best USD exchange rate." },
      { from: "ai", type: "cards", variant: "forex", options: [
        { title: "VoyageAI Travel Card", subtitle: "$1 = $1.00 USD", price: "$500 loaded", image: "/images/book-forex1.jpg", tags: ["Zero fees", "Instant load", "ATM access"], badge: "Best Rate" },
        { title: "Currency Exchange", subtitle: "$1 = $0.97 USD", price: "$508 loaded", image: "/images/book-forex2.jpg", tags: ["$8 service fee", "Home delivery"] },
      ] },
    ],
    // 19 — final
    [
      { from: "ai", type: "confirm", text: "All set! Your complete family trip is ready — flights, hotel, transfers, activities, insurance, and forex all confirmed in your itinerary. Have a wonderful trip! 🎉" },
    ],
  ],
  group: [
    [
      { from: "ai", type: "text", text: "Awesome, a group trip! 🎉 How many people total?" },
      { from: "ai", type: "chips", label: "Group size", options: ["2–4", "5–8", "9+"] },
    ],
    [
      { from: "ai", type: "text", text: "What's everyone into?" },
      { from: "ai", type: "chips", label: "Vibe", options: ["Nightlife", "Adventure", "Relaxation", "A mix of everything"] },
    ],
    [
      { from: "ai", type: "text", text: "Here's a group-friendly stay and activities that work for everyone:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "Group Villa (8 guests)", subtitle: "Private pool · Shared spaces", price: "$680/night total", image: "/images/book-hotel1.jpg", tags: ["Private pool", "Shared spaces"], rating: 4.7, badge: "AI Pick" },
        { title: "Group Adventure Package", subtitle: "Ziplining + BBQ night", price: "$95/person", image: "/images/book-act-fuji.jpg", tags: ["Ziplining", "BBQ night"], rating: 4.6 },
      ] },
    ],
    [
      { from: "ai", type: "text", text: "Want me to split costs evenly and send a shared payment link to the group?" },
      { from: "ai", type: "chips", label: "Payments", options: ["Yes, split it", "No, I'll handle it"] },
    ],
    [
      { from: "ai", type: "text", text: "Quick heads up ⚠️ — your group's connecting flight just had a gate change. Checking details now…" },
      { from: "ai", type: "info", title: "Gate Change Detected", rows: [
        { label: "From", value: "Terminal B, Gate 22" },
        { label: "To", value: "Terminal D, Gate 12" },
        { label: "Walking time", value: "18 min (or 6 min via AirTrain)" },
        { label: "Boarding closes in", value: "52 min" },
      ] },
      { from: "ai", type: "confirm", text: "Directions sent to the whole group's phones — I'll notify everyone if the gate changes again." },
    ],
    [
      { from: "ai", type: "confirm", text: "Your group trip is ready to firm up — stay, activities, and payment split link ready, and everyone's briefed on the gate change." },
    ],
  ],
  honeymoon: [
    [
      { from: "ai", type: "text", text: "Congratulations! 💍 Looking for a beach escape, a romantic city break, or an adventurous honeymoon?" },
      { from: "ai", type: "chips", label: "Style", options: ["Beach escape", "Romantic city break", "Adventurous honeymoon"] },
    ],
    [
      { from: "ai", type: "text", text: "Any special touches you'd like arranged?" },
      { from: "ai", type: "chips", label: "Special touches", options: ["Private dinner", "Spa package", "Room upgrade", "Surprise me"] },
    ],
    [
      { from: "ai", type: "text", text: "Here are a few romantic stays perfect for honeymooners:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "Overwater Villa Suite", subtitle: "Private pool · Sunset views", price: "$780/night", image: "/images/book-hotel3.jpg", tags: ["Private pool", "Sunset views"], rating: 4.9, badge: "AI Pick" },
        { title: "Cliffside Boutique Hotel", subtitle: "Couples spa · Rooftop dining", price: "$420/night", image: "/images/book-hotel1.jpg", tags: ["Couples spa", "Rooftop dining"], rating: 4.7 },
      ] },
    ],
    [
      { from: "ai", type: "text", text: "Since you'll be traveling abroad, I can chat in over 40 languages 🌐 Which would you like to continue in?" },
      { from: "ai", type: "chips", label: "Choose a language", options: ["English", "Español", "Français", "日本語", "Deutsch", "中文"] },
    ],
    [
      { from: "ai", type: "text", text: "¡Perfecto! Continuaré en español a partir de ahora. Tu escapada romántica está casi lista — ¿confirmamos las fechas?" },
      { from: "ai", type: "chips", label: "Idioma", options: ["Continuar en español", "Switch back to English"] },
    ],
    [
      { from: "ai", type: "text", text: "Of course! Switching back to English. Your honeymoon plan is ready whenever you are." },
      { from: "ai", type: "confirm", text: "Romance locked in 💕 — I've shortlisted stays, arranged your special touches, and multilingual support is ready for your trip." },
    ],
  ],
  family_elderly: buildGenericSteps("family_elderly", personaMeta.family_elderly, personaLabels.family_elderly),
  students: buildGenericSteps("students", personaMeta.students, personaLabels.students),
  ladies: buildGenericSteps("ladies", personaMeta.ladies, personaLabels.ladies),
  economy: buildGenericSteps("economy", personaMeta.economy, personaLabels.economy),
  luxury: buildGenericSteps("luxury", personaMeta.luxury, personaLabels.luxury),
  second_innings: buildGenericSteps("second_innings", personaMeta.second_innings, personaLabels.second_innings),
  bachelors: buildGenericSteps("bachelors", personaMeta.bachelors, personaLabels.bachelors),
  mens: buildGenericSteps("mens", personaMeta.mens, personaLabels.mens),
  other: buildGenericSteps("other", personaMeta.other, personaLabels.other),
};

const scenarioReplies: { match: RegExp; build: () => Msg[] }[] = [
  {
    match: /sim|calling card|esim|phone/i,
    build: () => [
      { from: "ai", type: "text", text: "Here are the best local SIM & calling card options for your destination:" },
      { from: "ai", type: "cards", variant: "sim", options: [
        { title: "Local Tourist SIM", subtitle: "7-day unlimited data", price: "$18" },
        { title: "eSIM (instant activation)", subtitle: "10GB, 30 days", price: "$19" },
        { title: "International Calling Card", subtitle: "60 minutes, any country", price: "$12" },
      ] },
    ],
  },
  {
    match: /terminal|gate|transit|connect(ing|ion)? flight/i,
    build: () => [
      { from: "ai", type: "text", text: "Checking your connection details now…" },
      { from: "ai", type: "info", title: "Gate Change Detected", rows: [
        { label: "From", value: "Terminal B, Gate 22" },
        { label: "To", value: "Terminal D, Gate 12" },
        { label: "Walking time", value: "18 min (or 6 min via AirTrain)" },
        { label: "Boarding closes in", value: "52 min" },
      ] },
      { from: "ai", type: "confirm", text: "Directions sent to your phone — I'll notify you if the gate changes again." },
    ],
  },
  {
    match: /spanish|español|français|japanese|language|translat/i,
    build: () => [
      { from: "ai", type: "text", text: "I can chat in over 40 languages 🌐 Which would you like to continue in?" },
      { from: "ai", type: "chips", label: "Choose a language", options: ["English", "Español", "Français", "日本語", "Deutsch", "中文"] },
    ],
  },
  {
    match: /local guide|tour guide|guide/i,
    build: () => [
      { from: "ai", type: "text", text: "I can connect you with a vetted local guide 🗺️ Here are top-rated options nearby:" },
      { from: "ai", type: "cards", variant: "guide", options: [
        { title: "Aiko Tanaka", subtitle: "Temples & Gardens · ★4.9", price: "$65/half-day" },
        { title: "Kenji Sato", subtitle: "Food & Culture · ★4.8", price: "$70/half-day" },
        { title: "Yui Nakamura", subtitle: "Photography Tours · ★5.0", price: "$85/half-day" },
      ] },
    ],
  },
  {
    match: /flight|fly/i,
    build: () => [
      { from: "ai", type: "text", text: "Here are the best flight options I found:" },
      { from: "ai", type: "cards", variant: "flight", options: [
        { title: "American Airlines · Nonstop", subtitle: "07:00 → 13:15 · 3h 15m", price: "$1,723", image: "/images/book-flight1.jpg", tags: ["Non-stop"], rating: 4.6, badge: "AI Pick" },
        { title: "Southwest Airlines · 1 stop", subtitle: "10:30 → 17:05 · 4h 35m", price: "$780", image: "/images/book-flight3.jpg", tags: ["1 stop"], rating: 4.2 },
      ] },
    ],
  },
  {
    match: /hotel|stay/i,
    build: () => [
      { from: "ai", type: "text", text: "Here are highly-rated stays for your dates:" },
      { from: "ai", type: "cards", variant: "hotel", options: [
        { title: "The Ritz-Carlton Dallas", subtitle: "5★ · Downtown · Free cancellation", price: "$520/night", image: "/images/book-hotel1.jpg", tags: ["Downtown", "Free cancellation"], rating: 4.9, badge: "AI Pick" },
        { title: "Omni Dallas Hotel", subtitle: "4.5★ · Convention Center", price: "$380/night", image: "/images/book-hotel2.jpg", tags: ["Convention Center"], rating: 4.7 },
      ] },
    ],
  },
];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AiAvatar() {
  return <span className="msg-avatar"><NavIcon.sparkle /></span>;
}

function CardIcon({ variant }: { variant: string }) {
  const map: Record<string, keyof typeof NavIcon> = {
    flight: "plane", hotel: "hotel", cab: "transport", activity: "camera",
    restaurant: "dining", insurance: "shield", sim: "sim", guide: "compass", forex: "dollar",
  };
  const Icon = NavIcon[map[variant] ?? "sparkle"];
  return <Icon />;
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalDate { y: number; m: number; d: number; }
function calKey(p: CalDate) { return p.y * 10000 + p.m * 100 + p.d; }
function calFmt(p: CalDate) { return `${MONTH_ABBR[p.m]} ${p.d}, ${p.y}`; }
function calSame(a: CalDate | null, b: CalDate | null) { return !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d; }

function DatePickerMsg({ onPick }: { onPick: (dateLabel: string) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [start, setStart] = useState<CalDate | null>(null);
  const [end, setEnd] = useState<CalDate | null>(null);
  const cells = buildCalendar(year, month);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function handlePick(d: number) {
    const picked: CalDate = { y: year, m: month, d };
    if (!start || end) {
      setStart(picked);
      setEnd(null);
    } else if (calKey(picked) <= calKey(start)) {
      setStart(picked);
      setEnd(null);
    } else {
      setEnd(picked);
    }
  }

  function inRange(d: number) {
    if (!start || !end) return false;
    const k = calKey({ y: year, m: month, d });
    return k > calKey(start) && k < calKey(end);
  }

  function confirm() {
    if (start && end) onPick(`Depart ${calFmt(start)} – Return ${calFmt(end)}`);
    else if (start) onPick(calFmt(start));
  }

  return (
    <div className="msg-inline-panel date-picker-panel">
      <div className="calendar-popover-head">
        <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
        <strong>{MONTH_NAMES[month]} {year}</strong>
        <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
      </div>
      <div className="calendar-popover-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="calendar-day" style={{ fontWeight: 700, cursor: "default" }}>{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <button key={i} className="calendar-day" disabled>{""}</button>;
          const cell: CalDate = { y: year, m: month, d };
          const isEdge = calSame(start, cell) || calSame(end, cell);
          const cls = ["calendar-day", isEdge ? "edge" : "", inRange(d) ? "in-range" : ""].filter(Boolean).join(" ");
          return (
            <button key={i} className={cls} onClick={() => handlePick(d)}>{d}</button>
          );
        })}
      </div>
      <p className="calendar-popover-hint">
        {!start ? "Select your departure date" : !end ? `Departure: ${calFmt(start)} — now pick your return date` : `${calFmt(start)} → ${calFmt(end)}`}
      </p>
      {start && (
        <button className="msg-travelers-confirm" onClick={confirm}>
          {end ? "Confirm departure & return" : "Confirm departure only"}
        </button>
      )}
    </div>
  );
}

function TravelersMsg({ onConfirm }: { onConfirm: (label: string) => void }) {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const total = adults + children + infants;
  return (
    <div className="msg-inline-panel">
      {([
        ["Adults", "Age 13+", adults, setAdults, 1],
        ["Children", "Age 2–12", children, setChildren, 0],
        ["Infants", "Under 2", infants, setInfants, 0],
      ] as const).map(([label, hint, value, setValue, min]) => (
        <div className="msg-travelers-row" key={label}>
          <div><strong>{label}</strong><span>{hint}</span></div>
          <div className="guests-stepper">
            <button type="button" onClick={() => setValue(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}><NavIcon.minus /></button>
            <strong>{value}</strong>
            <button type="button" onClick={() => setValue(value + 1)} aria-label={`More ${label}`}><NavIcon.plus /></button>
          </div>
        </div>
      ))}
      <button className="msg-travelers-confirm" onClick={() => onConfirm(`${adults} Adults${children ? `, ${children} Children` : ""}${infants ? `, ${infants} Infants` : ""}`)}>
        Confirm — {total} traveler{total === 1 ? "" : "s"}
      </button>
    </div>
  );
}

function PersonaPickerMsg({ onContinue }: { onContinue: (keys: PersonaKey[]) => void }) {
  const [selected, setSelected] = useState<Set<PersonaKey>>(new Set());
  function toggle(key: PersonaKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  return (
    <div className="msg-inline-panel">
      <div className="persona-picker-grid">
        {PERSONA_PICKER_OPTIONS.map((o) => (
          <button key={o.key} type="button" className={selected.has(o.key) ? "persona-chip active" : "persona-chip"} onClick={() => toggle(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      <button className="msg-travelers-confirm" disabled={selected.size === 0} onClick={() => onContinue([...selected])}>
        Continue{selected.size > 0 ? ` — ${selected.size} selected` : ""}
      </button>
    </div>
  );
}

interface PassengerVisaEntry { name: string; visaNumber: string; validity: string; }

function PassengerFormMsg({ roster, onSave }: { roster: string[]; onSave: (summary: string) => void }) {
  const [entries, setEntries] = useState<PassengerVisaEntry[]>(() => roster.map((name) => ({ name, visaNumber: "", validity: "" })));
  function update(i: number, field: keyof PassengerVisaEntry, value: string) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  }
  return (
    <div className="msg-inline-panel passenger-form">
      {entries.map((e, i) => (
        <div className="passenger-form-row" key={i}>
          <label>Passenger name
            <input value={e.name} onChange={(ev) => update(i, "name", ev.target.value)} placeholder="Full name" />
          </label>
          <div className="passenger-form-grid">
            <label>Visa number
              <input value={e.visaNumber} onChange={(ev) => update(i, "visaNumber", ev.target.value)} placeholder="e.g. V1234567" />
            </label>
            <label>Validity date
              <DatePicker value={e.validity} onChange={(v) => update(i, "validity", v)} />
            </label>
          </div>
          {entries.length > 1 && (
            <button type="button" className="passenger-form-remove" onClick={() => setEntries((prev) => prev.filter((_, idx) => idx !== i))} aria-label={`Remove ${e.name || "passenger"}`}>
              <NavIcon.close /> Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="passenger-form-add"
        onClick={() => setEntries((prev) => [...prev, { name: `Traveler ${prev.length + 1}`, visaNumber: "", validity: "" }])}
      >
        <NavIcon.plus /> Add passenger
      </button>
      <button
        className="msg-travelers-confirm"
        onClick={() => onSave(`Saved: ${entries.map((e) => `${e.name || "Traveler"} — Visa ${e.visaNumber || "pending"} (valid ${e.validity || "TBD"})`).join("; ")}`)}
      >
        Save passenger details
      </button>
    </div>
  );
}

function FlightDetailsFormMsg({ onSave }: { onSave: (encoded: string) => void }) {
  const [pnr, setPnr] = useState("");
  return (
    <div className="msg-inline-panel passenger-form">
      <div className="passenger-form-row">
        <label>PNR / Booking reference
          <input value={pnr} onChange={(e) => setPnr(e.target.value)} placeholder="e.g. XZ7Q9K" />
        </label>
      </div>
      <button className="msg-travelers-confirm" disabled={!pnr.trim()} onClick={() => onSave(`FLIGHT|${pnr.trim()}`)}>
        Fetch flight details
      </button>
    </div>
  );
}

function cardConfirmText(variant: string, opt: CardOption): string {
  switch (variant) {
    case "flight": return `${opt.title} confirmed! Seats reserved at ${opt.price ?? "the listed fare"}.`;
    case "hotel": return `${opt.title} added to your itinerary!`;
    case "cab": return `${opt.title} pre-booked for your transfers.`;
    case "activity": return `${opt.title} added to your itinerary!`;
    case "restaurant": return `${opt.title} reserved — table confirmed.`;
    case "insurance": return `${opt.title} added — you're fully covered!`;
    case "forex": return `${opt.title} ordered — ready to spend!`;
    case "sim": return `${opt.title} activated for your trip.`;
    case "guide": return `${opt.title} booked as your local guide.`;
    default: return `${opt.title} added to your itinerary.`;
  }
}

// Persists the in-progress scripted-demo conversation to sessionStorage so a
// dev-server HMR reload (or an accidental browser refresh) resumes where you
// left off instead of dropping back to the empty-state screen.
const DEMO_SESSION_KEY = "voyageai_demo_session";

interface DemoSessionSnapshot {
  thread: Msg[];
  activeFlow: { persona: PersonaKey; step: number } | null;
  customSteps: Msg[][] | null;
  partyRoster: string[] | null;
  tripRouteText: string | null;
  tripDatesText: string | null;
  skipFlightCards: boolean;
  meetingLocation: string | null;
  placesText: string | null;
  personaTag: string | null;
  customItinerary: CustomItinerary | null;
  dayPlan: DayPlanState | null;
}

function loadDemoSession(): DemoSessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDemoSession() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch { /* storage unavailable — ignore */ }
}

function greetingThread(withTime?: string): Msg[] {
  return [
    { from: "ai", type: "text", text: "Hello! I'm your AI Travel Concierge. I'll help you plan every detail of your trip — flights, hotels, transfers, restaurants and more.\nWhat kind of trip are you planning? Pick everything that applies below — you can combine, e.g. \"Family with Kids\" + \"Economy\".", time: withTime },
    { from: "ai", type: "personaPicker" },
  ];
}

export function ConciergePage() {
  const { setToast } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [savedSession] = useState<DemoSessionSnapshot | null>(loadDemoSession);
  const [thread, setThread] = useState<Msg[]>(() => savedSession?.thread ?? []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [rightTab, setRightTab] = useState<"itinerary" | "calendar" | "cost" | "readiness">("calendar");
  const [activeFlow, setActiveFlow] = useState<{ persona: PersonaKey; step: number } | null>(() => savedSession?.activeFlow ?? null);
  const [customSteps, setCustomSteps] = useState<Msg[][] | null>(() => savedSession?.customSteps ?? null);
  const [partyRoster, setPartyRoster] = useState<string[] | null>(() => savedSession?.partyRoster ?? null);
  const [tripRouteText, setTripRouteText] = useState<string | null>(() => savedSession?.tripRouteText ?? null);
  const [skipFlightCards, setSkipFlightCards] = useState(() => savedSession?.skipFlightCards ?? false);
  const [meetingLocation, setMeetingLocation] = useState<string | null>(() => savedSession?.meetingLocation ?? null);
  const [placesText, setPlacesText] = useState<string | null>(() => savedSession?.placesText ?? null);
  const [tripDatesText, setTripDatesText] = useState<string | null>(() => savedSession?.tripDatesText ?? null);
  const [personaTag, setPersonaTag] = useState<string | null>(() => savedSession?.personaTag ?? null);
  const isBusinessTrip = /business/i.test(personaTag ?? "");
  const [customItinerary, setCustomItinerary] = useState<CustomItinerary | null>(() => savedSession?.customItinerary ?? null);
  const [dayPlan, setDayPlan] = useState<DayPlanState | null>(() => savedSession?.dayPlan ?? null);
  const [itinEditInput, setItinEditInput] = useState("");
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [itinBusy, setItinBusy] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [sidebarDetail, setSidebarDetail] = useState<
    | { kind: "conversation"; item: (typeof conversations)[number] }
    | { kind: "trip"; item: (typeof savedTrips)[number] }
    | { kind: "traveller"; item: (typeof travellers)[number] }
    | null
  >(null);
  const [livePersona, setLivePersona] = useState<LivePersona>(defaultLivePersona);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPromptHandled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const liveHistoryRef = useRef<LiveMessage[]>([]);
  const storageLoaded = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  // Autosave the scripted-demo conversation so an HMR/dev-server reload (or
  // an accidental browser refresh) resumes instead of resetting to empty.
  useEffect(() => {
    if (thread.length === 0) return;
    try {
      const snapshot: DemoSessionSnapshot = {
        thread, activeFlow, customSteps, partyRoster, tripRouteText, tripDatesText,
        skipFlightCards, meetingLocation, placesText, personaTag, customItinerary, dayPlan,
      };
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(snapshot));
    } catch { /* storage unavailable — ignore */ }
  }, [thread, activeFlow, customSteps, partyRoster, tripRouteText, tripDatesText, skipFlightCards, meetingLocation, placesText, personaTag, customItinerary, dayPlan]);

  // Restore the last saved persona + conversation from IndexedDB so Live AI
  // mode continues where you left off across reloads.
  useEffect(() => {
    if (storageLoaded.current) return;
    storageLoaded.current = true;
    (async () => {
      try {
        await storage.init();
        const [savedPersona, savedConvo] = await Promise.all([storage.getPersona("p1"), storage.getConversation("t1")]);
        if (savedPersona) {
          setLivePersona({
            ...savedPersona,
            lastUpdated: savedPersona.lastUpdated.toString(),
          } as LivePersona);
        }
        if (savedConvo?.length) {
          liveHistoryRef.current = fromStoredMessages(savedConvo);
          const restored: Msg[] = savedConvo.map((m) => ({ from: m.role === "user" ? "user" : "ai", type: "text", text: m.content }));
          setThread((prev) => [...prev, { from: "ai", type: "text", text: "Welcome back — restored your last live conversation below." }, ...restored]);
        }
      } catch (err) {
        console.warn("IndexedDB restore failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (initialPromptHandled.current) return;
    initialPromptHandled.current = true;
    const state = location.state as { initialPrompt?: string; itineraryKey?: string; customItinerary?: CustomItinerary; showLanding?: boolean } | null;
    if (state?.showLanding) {
      // Entering via the top nav's "Concierge" link — always land on the
      // blank starting screen rather than resuming whatever conversation
      // (or stale greeting) was last left open.
      clearDemoSession();
      setThread([]);
      setSelected({});
      setActiveFlow(null);
      setCustomSteps(null);
      setPersonaTag(null);
      setDayPlan(null);
      setPartyRoster(null);
      setSkipFlightCards(false);
      setMeetingLocation(null);
      setPlacesText(null);
      setTripRouteText(null);
      setTripDatesText(null);
      setCustomItinerary(null);
      navigate(location.pathname, { replace: true, state: null });
    }
    if (state?.initialPrompt) {
      // A card on the Home page (Explore / Book Now) is starting this
      // conversation — drop any leftover thread (e.g. the persona-picker
      // greeting from a prior "New Conversation") so it opens straight into
      // the tailored trip the user already configured, not a stale prompt.
      clearDemoSession();
      setThread([]);
      setSelected({});
      setActiveFlow(null);
      setCustomSteps(null);
      setPersonaTag(null);
      setDayPlan(null);
      setPartyRoster(null);
      setSkipFlightCards(false);
      setMeetingLocation(null);
      setPlacesText(null);
      setTripRouteText(null);
      setTripDatesText(null);
      setCustomItinerary(null);
    }
    if (state?.customItinerary) {
      setCustomItinerary(state.customItinerary);
      setRightTab("itinerary");
    } else if (state?.itineraryKey && itineraryTemplates[state.itineraryKey]) {
      const tpl = itineraryTemplates[state.itineraryKey];
      setCustomItinerary({
        title: tpl.title,
        destination: tpl.destination,
        note: tpl.note,
        days: tpl.days.map((d, di) => ({ label: d.label, activities: d.activities.map((a, ai) => ({ id: `${di}-${ai}`, text: a })) })),
      });
      setRightTab("itinerary");
    }
    if (state?.initialPrompt) {
      sendMessage(state.initialPrompt);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetConversation() {
    clearDemoSession();
    setThread(greetingThread(nowTime()));
    setSelected({});
    setActiveFlow(null);
    setCustomSteps(null);
    setPersonaTag(null);
    setDayPlan(null);
    setPartyRoster(null);
    setSkipFlightCards(false);
    setMeetingLocation(null);
    setPlacesText(null);
    setTripRouteText(null);
    setTripDatesText(null);
    setCustomItinerary(null);
    setToast("Started a new conversation");
  }

  // Multiple persona chips were selected — merge them into one composite trip
  // profile (e.g. "Family with Kids" + "Economy") instead of the single fixed
  // script, or fall back to a hand-authored script if exactly one classic
  // persona was picked alone.
  // Every pill combination follows the exact same reference script — only
  // the displayed trip-type label changes, never the questions or cards.
  function startCompositeFlow(keys: PersonaKey[]) {
    const { label } = mergePersonaMeta(keys);
    const steps = personaWorkflows.family;

    setThread((prev) => [...prev, { from: "user", type: "text", text: `${label} trip`, time: nowTime() }]);
    setSending(true);
    setPersonaTag(label);
    setCustomSteps(steps);
    setTimeout(() => {
      setThread((prev) => [...prev, ...steps[0]]);
      setActiveFlow({ persona: keys[0], step: 1 });
      setSending(false);
    }, 550);
  }

  function dayIntroMsgs(day: DayPlanState): Msg[] {
    const threshold = PACE_THRESHOLD[day.pace];
    const nudge = day.itemsToday >= threshold
      ? ` That's a solid ${day.pace} day (${day.itemsToday} item${day.itemsToday === 1 ? "" : "s"} planned) — ready to move on?`
      : "";
    return [
      { from: "ai", type: "text", text: `Day ${day.currentDay} of ${day.totalDays} in ${day.destination} — what would you like to add?${nudge}` },
      { from: "ai", type: "chips", label: "Add to this day", options: [...dayTaskChipOptions, day.currentDay < day.totalDays ? "Next day →" : "Finish trip"] },
    ];
  }

  function ensureItineraryFor(day: DayPlanState): void {
    setCustomItinerary((prev) => {
      if (prev) return prev;
      return {
        title: `${day.destination} Trip`,
        destination: day.destination,
        days: Array.from({ length: day.totalDays }, (_, i) => ({ label: `Day ${i + 1}`, activities: [] })),
      };
    });
  }

  function startDayPlan() {
    const destination = customItinerary?.destination ?? "Tokyo, Japan";
    const totalDays = customItinerary?.days.length ?? 3;
    const plan: DayPlanState = { destination, totalDays, currentDay: 1, pace: "balanced", paceConfirmed: false, itemsToday: 0 };
    setDayPlan(plan);
    setActiveFlow(null);
    ensureItineraryFor(plan);
    setRightTab("itinerary");
    setThread((prev) => [...prev, ...paceQuestionMsgs()]);
  }

  function paceQuestionMsgs(): Msg[] {
    return [
      { from: "ai", type: "text", text: "Before we go day by day — what pace do you want for this trip?" },
      { from: "ai", type: "chips", label: "Trip pace", options: ["Relaxed", "Balanced", "Packed"] },
    ];
  }

  async function sendLiveMessage(text: string) {
    setThread((prev) => [...prev, { from: "user", type: "text", text, time: nowTime() }]);
    setSending(true);
    try {
      const trip = defaultLiveTrip(livePersona);
      const res = await fetch(`${apiUrl}/api/concierge/converse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, persona: livePersona, trip, history: liveHistoryRef.current }),
      });
      const data = await res.json();

      if (!res.ok) {
        setThread((prev) => [...prev, { from: "ai", type: "text", text: `${data.error ?? "Live AI is unavailable right now."} Switching to demo mode — try any of the quick replies below.` }]);
        setLiveMode(false);
        return;
      }

      const cleanReply: string = (data.reply ?? "").replace(/```json[\s\S]*?```/, "").trim();
      if (cleanReply) setThread((prev) => [...prev, { from: "ai", type: "text", text: cleanReply, time: nowTime() }]);

      const rawSuggestions = (data.suggestions ?? []) as Partial<Suggestion>[];
      const suggestions: Suggestion[] = rawSuggestions.map((s, i) => ({
        id: s.id ?? `suggestion_${Date.now()}_${i}`,
        type: (s.type ?? "activity") as Suggestion["type"],
        title: s.title ?? "Suggestion",
        description: s.description ?? "",
        price: s.price ?? 0,
        rating: s.rating ?? 0,
        image: s.image ?? "",
        details: s.details ?? {},
        reasonForSuggestion: s.reasonForSuggestion ?? "",
        bookingUrl: s.bookingUrl,
        selected: false,
        addedToItinerary: false,
      }));
      if (suggestions.length) {
        setThread((prev) => [...prev, { from: "ai", type: "suggestions", items: suggestions }]);
      }

      const mergedPersona: LivePersona = data.personaUpdates && Object.keys(data.personaUpdates).length
        ? { ...livePersona, ...data.personaUpdates, lastUpdated: new Date().toISOString() }
        : livePersona;
      if (mergedPersona !== livePersona) setLivePersona(mergedPersona);
      if (Array.isArray(data.history)) liveHistoryRef.current = data.history;

      try {
        await storage.savePersona(toStoredPersona(mergedPersona));
        await storage.saveTrip(toStoredTrip(defaultLiveTrip(mergedPersona)));
        await storage.saveConversation("t1", toStoredMessages(liveHistoryRef.current));
      } catch (err) {
        console.warn("IndexedDB save failed:", err);
      }
    } catch (err) {
      setThread((prev) => [...prev, { from: "ai", type: "text", text: `${handleError(err)} Switching to demo mode — make sure the backend is running with ANTHROPIC_API_KEY set.` }]);
      setLiveMode(false);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;

    if (liveMode) {
      sendLiveMessage(text);
      return;
    }

    setThread((prev) => [...prev, { from: "user", type: "text", text, time: nowTime() }]);

    // Kick off the day-by-day itinerary builder.
    if (!activeFlow && !dayPlan && /plan.*day.?by.?day|day.?by.?day.*plan|day.?by.?day itinerary/i.test(text)) {
      setSending(true);
      setTimeout(() => { startDayPlan(); setSending(false); }, 450);
      return;
    }

    // A day-plan is active — interpret the reply as a task for the current day.
    if (dayPlan) {
      setSending(true);
      setTimeout(() => {
        if (!dayPlan.paceConfirmed) {
          const pace: TripPace = /relax/i.test(text) ? "relaxed" : /pack/i.test(text) ? "packed" : "balanced";
          const next = { ...dayPlan, pace, paceConfirmed: true };
          setDayPlan(next);
          setThread((prev) => [...prev, ...dayIntroMsgs(next)]);
          setSending(false);
          return;
        }
        if (/next day|finish|done|move on/i.test(text)) {
          if (dayPlan.currentDay >= dayPlan.totalDays) {
            setThread((prev) => [...prev, { from: "ai", type: "confirm", text: `Your ${dayPlan.totalDays}-day ${dayPlan.destination} itinerary is complete! You can keep editing it on the right, or ask me anything else.` }]);
            setDayPlan(null);
          } else {
            const next = { ...dayPlan, currentDay: dayPlan.currentDay + 1, itemsToday: 0 };
            setDayPlan(next);
            setThread((prev) => [...prev, ...dayIntroMsgs(next)]);
          }
          setSending(false);
          return;
        }
        const category = /activity|things to do|sightseeing/i.test(text) ? "activity"
          : /restaurant|food|dining|eat/i.test(text) ? "restaurant"
          : /transport|cab|taxi|ride/i.test(text) ? "transport"
          : null;
        if (category) {
          const { variant, options } = dayTaskCards[category];
          setThread((prev) => [...prev, { from: "ai", type: "text", text: `Here are some ${category} options for Day ${dayPlan.currentDay}:` }, { from: "ai", type: "cards", variant, options }]);
        } else {
          setThread((prev) => [...prev, { from: "ai", type: "text", text: "Not sure I caught that — pick one of the options below." }, { from: "ai", type: "chips", label: "Add to this day", options: [...dayTaskChipOptions, dayPlan.currentDay < dayPlan.totalDays ? "Next day →" : "Finish trip"] }]);
        }
        setSending(false);
      }, 500);
      return;
    }

    // A workflow is already in progress — advance it to the next turn.
    if (activeFlow) {
      const steps = customSteps ?? personaWorkflows[activeFlow.persona];

      // Capture the destination and date-range answers as they go by, so
      // later steps (flight confirmation) can echo them back accurately.
      if (activeFlow.step === 1) setTripRouteText(text);
      if (activeFlow.step === 2) setTripDatesText(text);

      // The traveler-count step was just answered — capture the real party
      // so later steps (like the passenger form) match it exactly.
      if (activeFlow.step === 3) {
        const parsed = parseTravelerRoster(text);
        if (parsed) setPartyRoster(parsed);
      }

      // The flight-preference step branches for real: "I have a flight in
      // mind" asks for the PNR and fetches the flight instead of moving
      // straight on to the passenger-details step.
      if (activeFlow.step === 4 && /i have a flight in mind/i.test(text)) {
        setSkipFlightCards(true);
        setSending(true);
        setTimeout(() => {
          setThread((prev) => [...prev, { from: "ai", type: "flightDetailsForm" }]);
          setSending(false);
        }, 450);
        return;
      }

      // The passenger-details step of the reference script branches for
      // real: "Enter new details" opens an editable form instead of moving
      // straight on to flights.
      if (activeFlow.step === 5 && /enter new details/i.test(text)) {
        setSending(true);
        setTimeout(() => {
          const roster = partyRoster ?? travelerRoster(activeFlow.persona);
          setThread((prev) => [...prev, { from: "ai", type: "passengerForm", roster }]);
          setSending(false);
        }, 450);
        return;
      }

      setSending(true);
      setTimeout(() => {
        // The PNR was just submitted — "fetch" and confirm the flight for
        // every passenger before moving on.
        const extraFlightConfirm: Msg[] = activeFlow.step === 4 && text.startsWith("FLIGHT|")
          ? buildFlightConfirmMsg(text, tripRouteText, tripDatesText, partyRoster ?? travelerRoster(activeFlow.persona))
          : [];
        if (activeFlow.step === 4 && text.startsWith("FLIGHT|")) {
          // Mirror the exact flight details just "fetched" for the leg cards
          // (same airline, onboard location, time, class, per-passenger
          // seats) into the itinerary, instead of a generic placeholder.
          const pnr = text.split("|")[1]?.trim() || "—";
          const { origin, destination } = parseRoute(tripRouteText ?? "");
          const roster = partyRoster ?? travelerRoster(activeFlow.persona);
          const departureFlight = mockFlightLookup(`${pnr}-D`, roster);
          const returnFlight = mockFlightLookup(`${pnr}-R`, roster);
          const seatsSummary = (seats: string[]) => roster.map((name, i) => `${name.includes("(You)") ? "You" : name.split(" ")[0]} ${seats[i]}`).join(" · ");
          addBookingToItinerary(
            "flight",
            { title: departureFlight.flightName, subtitle: `${origin} · ${departureFlight.flightClass} · PNR ${pnr} · ${seatsSummary(departureFlight.seats)}`, time: departureFlight.departureTime },
            "first"
          );
          addBookingToItinerary(
            "flight",
            { title: returnFlight.flightName, subtitle: `${destination} · ${returnFlight.flightClass} · PNR ${pnr} · ${seatsSummary(returnFlight.seats)}`, time: returnFlight.departureTime },
            "last"
          );
        }
        // Whether the user kept the records on file ("Yes, use them all")
        // or just saved a new passenger form, show passport/visa status
        // with validity for every traveler before moving on to flights.
        const extraBriefing: Msg[] = activeFlow.step === 5
          ? text.startsWith("Saved:")
            ? [{ from: "ai", type: "confirm", text: "Passenger details saved for this trip." }]
            : documentBriefing(activeFlow.persona, personaMeta[activeFlow.persona], partyRoster ?? undefined).filter((m) => m.type !== "chips")
          : [];
        // Documents + passenger details are confirmed at this point — start
        // building the day-wise itinerary right away and switch to it, for
        // every trip type (not just business), so it's visible immediately.
        if (activeFlow.step === 5) {
          ensureMultiDayItinerary();
          setRightTab("itinerary");
        }
        // Already have a booked flight (entered via PNR) — skip both the
        // onward and return "here are the best flight options" card steps.
        const stepToPush = activeFlow.step === 5 && skipFlightCards ? activeFlow.step + 2 : activeFlow.step;

        // Business trips replace "same hotel as last time" → "stay type" →
        // "facilities" with a 3-turn sequence: what places are you visiting,
        // then your first meeting, then hotels centered on both answers —
        // skipping straight to hotel cards once we have what we need.
        let nextStep = steps[stepToPush];
        let businessNextIndex: number | null = null;
        if (isBusinessTrip && stepToPush === 7) {
          nextStep = businessPlacesQuestionStep();
          ensureMultiDayItinerary();
          setRightTab("itinerary");
        } else if (isBusinessTrip && stepToPush === 8 && placesText === null) {
          setPlacesText(text);
          nextStep = businessMeetingQuestionStep();
        } else if (isBusinessTrip && stepToPush === 9 && meetingLocation === null && placesText !== null) {
          setMeetingLocation(text);
          nextStep = businessMeetingHotelStep(text, placesText);
          businessNextIndex = 11; // skip the now-unused "facilities"/"hotel cards" slots
        }
        if (nextStep) setThread((prev) => [...prev, ...extraFlightConfirm, ...extraBriefing, ...nextStep]);
        const nextIndex = businessNextIndex ?? stepToPush + 1;
        const isComplete = nextIndex >= steps.length;
        setActiveFlow(isComplete ? null : { persona: activeFlow.persona, step: nextIndex });
        if (isComplete) { saveTravelerProfile(activeFlow.persona); setCustomSteps(null); }
        setSending(false);
      }, 550);
      return;
    }

    // No workflow active — does this message start a new persona workflow?
    // Every persona (however detected) follows the same exact reference
    // script — only the displayed label changes, never the conversation.
    const persona = detectPersona(text);
    if (persona) {
      const steps = personaWorkflows.family;
      setSending(true);
      setPersonaTag(personaLabels[persona]);
      setCustomSteps(steps);
      setTimeout(() => {
        setThread((prev) => [...prev, ...steps[0]]);
        setActiveFlow({ persona, step: 1 });
        setSending(false);
      }, 550);
      return;
    }

    // Otherwise, check for a standalone on-trip assistance scenario.
    const scenario = scenarioReplies.find((s) => s.match.test(text));
    if (scenario) {
      setSending(true);
      setTimeout(() => {
        setThread((prev) => [...prev, ...scenario.build()]);
        setSending(false);
      }, 500);
      return;
    }

    // Fall back to the real concierge backend for freeform questions.
    setSending(true);
    try {
      const response = await fetch(`${apiUrl}/api/concierge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      const reply = data.reply ?? data.error ?? "I couldn't process that just yet.";
      setThread((prev) => [...prev, { from: "ai", type: "text", text: reply, time: nowTime() }]);
    } catch {
      setThread((prev) => [...prev, { from: "ai", type: "text", text: "The concierge is offline right now — start the backend and try again.", time: nowTime() }]);
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }

  function handleSuggestionAdd(suggestion: Suggestion) {
    setToast(`${suggestion.title} added to your trip`);
    setThread((prev) => [...prev, { from: "ai", type: "confirm", text: `Added "${suggestion.title}" to your itinerary.` }]);

    setCustomItinerary((prev) => {
      const base = prev ?? { title: "Live AI Trip", destination: "Your destination", days: [{ label: "Day 1", activities: [] }] };
      const dayIdx = dayPlan ? Math.max(0, dayPlan.currentDay - 1) : 0;
      const days = base.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: [...d.activities, { id: `sugg-${Date.now()}`, text: suggestion.title, aiAdded: true }] }));
      return { ...base, days };
    });

    if (dayPlan) {
      const updated = { ...dayPlan, itemsToday: dayPlan.itemsToday + 1 };
      setDayPlan(updated);
      setThread((prev) => [...prev, ...dayIntroMsgs(updated)]);
    }
  }

  const VARIANT_ICON: Record<string, string> = {
    flight: "plane", hotel: "hotel", cab: "transport", activity: "camera",
    restaurant: "dining", insurance: "shield", sim: "sim", guide: "compass", forex: "dollar",
  };
  const VARIANT_TIME: Record<string, string> = {
    flight: "07:00", hotel: "14:00", cab: "13:30", activity: "10:00",
    restaurant: "19:00", insurance: "—", sim: "—", guide: "09:00", forex: "—",
  };

  // Builds up the visual "Day 1" itinerary in the sidebar as the user picks
  // flights/hotels/transport/etc. through the scripted conversation — not
  // just through the standalone day-by-day planner.
  // Departure/return dates were captured as free text (e.g. "Depart Apr 25,
  // 2026 – Return Apr 28, 2026") — estimate a sensible day count from them.
  function estimateTripDays(datesText: string | null): number {
    if (!datesText) return 3;
    const { depart, ret } = parseTripDates(datesText);
    const d1 = new Date(depart);
    const d2 = new Date(ret);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 3;
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    return Math.min(14, Math.max(1, diff + 1));
  }

  // Suggests plain (editable, non-"confirmed") activities for a given day,
  // themed by destination, trip purpose, and where the day falls in the
  // trip — arrival day, departure day, or a day in between.
  function suggestDayActivities(destination: string, dayIdx: number, totalDays: number, tags: string[]): string[] {
    const isBusiness = tags.includes("work");
    const isFirst = dayIdx === 0;
    const isLast = dayIdx === totalDays - 1 && totalDays > 1;

    if (isBusiness) {
      if (isFirst) return [`Arrive in ${destination} and check in to your hotel`, "Review tomorrow's meeting agenda"];
      if (isLast) return ["Final wrap-up meeting", `Check out and head to the airport for your return flight`];
      return [`Client meetings in ${destination}`, "Team dinner with local colleagues"];
    }

    const kid = tags.includes("kids");
    const elderly = tags.includes("elderly") || tags.includes("senior");
    const romance = tags.includes("romance");
    const luxury = tags.includes("premium");
    const budget = tags.includes("budget");
    const nightlife = tags.includes("nightlife");

    if (isFirst) {
      return [`Arrive in ${destination} and check in to your hotel`, elderly || kid ? "Relaxed evening near the hotel" : `Evening stroll around ${destination}`];
    }
    if (isLast) {
      return [elderly ? "Slow morning, pack at leisure" : "Last-minute shopping", `Check out and head to the airport for your return flight`];
    }
    const morning = luxury ? `Private guided tour of ${destination}` : elderly ? `Gentle, low-walking sightseeing in ${destination}` : budget ? `Free walking tour of ${destination}` : `Explore ${destination}'s top sights`;
    const evening = romance ? `Romantic dinner in ${destination}` : nightlife ? `Night out exploring ${destination}'s nightlife` : kid ? "Family-friendly activity or park visit" : `Try a local restaurant in ${destination}`;
    return [morning, evening];
  }

  function itineraryShareLink(itin: CustomItinerary) {
    return `https://voyageai.app/itinerary/${itin.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  async function exportItinerary() {
    if (!customItinerary) {
      setToast("Build an itinerary first, then export it");
      return;
    }
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 16;
    let y = 20;

    doc.setFontSize(18);
    doc.text(customItinerary.title, marginX, y);
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(customItinerary.destination, marginX, y);
    y += 6;
    if (customItinerary.note) {
      const noteLines = doc.splitTextToSize(customItinerary.note, pageWidth - marginX * 2);
      doc.text(noteLines, marginX, y);
      y += noteLines.length * 5 + 2;
    }
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 10;

    customItinerary.days.forEach((day) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(day.label, marginX, y);
      y += 7;
      doc.setFontSize(10.5);
      doc.setTextColor(60);
      if (day.activities.length === 0) {
        doc.text("No activities added yet", marginX + 4, y);
        y += 6;
      }
      day.activities.forEach((a) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const line = `• ${a.text}${a.time ? `  (${a.time})` : ""}${a.price ? `  · ${a.price}` : ""}`;
        const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2 - 4);
        doc.text(wrapped, marginX + 4, y);
        y += wrapped.length * 5.5;
      });
      y += 6;
    });

    doc.save(`${customItinerary.title.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
    setToast("Itinerary exported as PDF");
  }

  function buildBaseItinerary(): CustomItinerary {
    const { destination } = parseRoute(tripRouteText ?? "");
    const dayCount = estimateTripDays(tripDatesText);
    const tags = activeFlow ? personaMeta[activeFlow.persona]?.tags ?? [] : [];
    const destLabel = destination !== "Destination" ? destination : "your destination";
    const days: EditableDay[] = Array.from({ length: dayCount }, (_, i) => ({
      label: i === 0 ? "Day 1 — Arrival Day" : i === dayCount - 1 ? `Day ${i + 1} — Departure Day` : `Day ${i + 1}`,
      activities: suggestDayActivities(destLabel, i, dayCount, tags).map((text, ai) => ({ id: `sugg-${i}-${ai}-${Date.now()}`, text, aiAdded: true })),
    }));
    return {
      title: destination !== "Destination" ? `${destination} Trip` : "Your Trip",
      destination: destination !== "Destination" ? destination : "Your destination",
      days,
    };
  }

  // Creates the full day-wise itinerary shell (sized to the actual trip
  // length) the moment we tell the user we're building one, rather than
  // waiting for the first booking to trigger it.
  function ensureMultiDayItinerary() {
    setCustomItinerary((prev) => prev ?? buildBaseItinerary());
  }

  // `slot` identifies "this step's booking" (e.g. onward flight vs. return
  // flight are different slots, but re-picking a card within the same slot
  // replaces the earlier choice instead of stacking up duplicates).
  function addBookingToItinerary(variant: string, opt: CardOption, dayTarget: "first" | "last" = "first", slot: string = `${variant}-${dayTarget}`) {
    setCustomItinerary((prev) => {
      const base = prev ?? buildBaseItinerary();
      const slotId = `book-${slot}`;
      const item: EditableActivity = {
        id: slotId,
        text: variant === "flight" ? opt.title : variant === "hotel" ? `Check-in: ${opt.title}` : opt.title,
        aiAdded: true,
        icon: VARIANT_ICON[variant] ?? "sparkle",
        subtitle: opt.subtitle,
        time: opt.time ?? VARIANT_TIME[variant] ?? "",
        price: opt.price,
        confirmed: true,
      };
      const targetIdx = dayTarget === "last" ? base.days.length - 1 : 0;
      const days = base.days.map((d, i) => {
        const withoutOldSlot = d.activities.filter((a) => a.id !== slotId);
        return i !== targetIdx ? { ...d, activities: withoutOldSlot } : { ...d, activities: [...withoutOldSlot, item] };
      });
      return { ...base, days };
    });
  }

  function handleCardSelect(key: string, oi: number, opt: CardOption, variant: string) {
    if (sending) return;
    setSelected((s) => ({ ...s, [key]: oi }));
    setToast(`${opt.title} selected`);
    setThread((prev) => [...prev, { from: "ai", type: "confirm", text: cardConfirmText(variant, opt) }]);

    if (activeFlow) addBookingToItinerary(variant, opt, variant === "flight" && activeFlow.step === 7 ? "last" : "first");

    if (dayPlan) {
      const dayIdx = dayPlan.currentDay - 1;
      setCustomItinerary((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: [...d.activities, { id: `dp-${Date.now()}`, text: opt.title, aiAdded: true }] }));
        return { ...prev, days };
      });
      const updated = { ...dayPlan, itemsToday: dayPlan.itemsToday + 1 };
      setDayPlan(updated);
      setThread((prev) => [...prev, ...dayIntroMsgs(updated)]);
      return;
    }

    // A scripted persona workflow is active — selecting a card advances it,
    // just like replying to a chip, so the AI asks the next contextual question.
    if (activeFlow) {
      const steps = customSteps ?? personaWorkflows[activeFlow.persona];
      setSending(true);
      setTimeout(() => {
        // Business trips skip "same hotel as last time" and instead start
        // the Day 1 places/meeting sequence — same override as the
        // chip-driven path, needed here too since selecting a flight card
        // advances the flow through this handler instead.
        let nextStep = steps[activeFlow.step];
        if (activeFlow.step === 7 && isBusinessTrip) {
          nextStep = businessPlacesQuestionStep();
          ensureMultiDayItinerary();
          setRightTab("itinerary");
        }
        if (nextStep) setThread((prev) => [...prev, ...nextStep]);
        const nextIndex = activeFlow.step + 1;
        const isComplete = nextIndex >= steps.length;
        setActiveFlow(isComplete ? null : { persona: activeFlow.persona, step: nextIndex });
        if (isComplete) { saveTravelerProfile(activeFlow.persona); setCustomSteps(null); }
        setSending(false);
      }, 550);
    }
  }

  function updateActivityText(dayIdx: number, actId: string, text: string) {
    setCustomItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: d.activities.map((a) => (a.id === actId ? { ...a, text } : a)) }));
      return { ...prev, days };
    });
  }

  function removeActivity(dayIdx: number, actId: string) {
    setCustomItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: d.activities.filter((a) => a.id !== actId) }));
      return { ...prev, days };
    });
  }

  function addActivity(dayIdx: number) {
    setCustomItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: [...d.activities, { id: `${dayIdx}-${Date.now()}`, text: "" }] }));
      return { ...prev, days };
    });
  }

  function moveActivity(dayIdx: number, actId: string, direction: -1 | 1) {
    setCustomItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => {
        if (i !== dayIdx) return d;
        const idx = d.activities.findIndex((a) => a.id === actId);
        const swapWith = idx + direction;
        if (idx === -1 || swapWith < 0 || swapWith >= d.activities.length) return d;
        const activities = [...d.activities];
        [activities[idx], activities[swapWith]] = [activities[swapWith], activities[idx]];
        return { ...d, activities };
      });
      return { ...prev, days };
    });
  }

  function updateActivityField(dayIdx: number, actId: string, field: "text" | "subtitle" | "time" | "price", value: string) {
    setCustomItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => (i !== dayIdx ? d : { ...d, activities: d.activities.map((a) => (a.id === actId ? { ...a, [field]: value } : a)) }));
      return { ...prev, days };
    });
  }

  function loadSampleItinerary() {
    setCustomItinerary({
      title: "Dubai Trip",
      destination: "Dubai, UAE",
      days: [
        {
          label: "Day 1 — Arrival Day",
          activities: [
            { id: "s1-flight", text: "Reunion Airlines · Nonstop", subtitle: "07:00 → 13:15 · 6h 15m", time: "07:00", price: "$1,720", confirmed: true, aiAdded: true, icon: "plane" },
            { id: "s1-cab", text: "Airport Transfer", subtitle: "DXB Airport → Hotel", time: "14:00", price: "$32", confirmed: true, aiAdded: true, icon: "transport" },
            { id: "s1-hotel", text: "Check-in: Burj Al Arab", subtitle: "Deluxe Suite · 3 nights", time: "15:00", price: "$890/night", confirmed: true, aiAdded: true, icon: "hotel" },
            { id: "s1-a1", text: "Evening walk at Jumeirah Beach", aiAdded: true },
          ],
        },
        {
          label: "Day 2 — City & Culture",
          activities: [
            { id: "s2-a1", text: "Burj Khalifa · At the Top", subtitle: "Skip-the-line · Level 124-125", time: "10:00", price: "$45/person", confirmed: true, aiAdded: true, icon: "camera" },
            { id: "s2-a2", text: "Dubai Mall & Aquarium", time: "13:00", aiAdded: true },
            { id: "s2-r1", text: "Dinner: Pierchic", subtitle: "Seafood · Overwater dining", time: "19:30", price: "$120/person", confirmed: true, aiAdded: true, icon: "dining" },
          ],
        },
        {
          label: "Day 3 — Desert & Departure",
          activities: [
            { id: "s3-a1", text: "Desert Safari with BBQ Dinner", subtitle: "Dune bashing · Camel ride · Live show", time: "15:00", price: "$75/person", confirmed: true, aiAdded: true, icon: "camera" },
            { id: "s3-cab", text: "Airport Transfer", subtitle: "Hotel → DXB Airport", time: "21:00", price: "$32", confirmed: true, aiAdded: true, icon: "transport" },
            { id: "s3-flight", text: "Southwest Airlines · Nonstop", subtitle: "23:30 → 06:05+1 · 6h 35m", time: "23:30", price: "$780", confirmed: true, aiAdded: true, icon: "plane" },
          ],
        },
      ],
    });
    setToast("Sample 3-day itinerary loaded");
  }

  function submitItinEdit(e: React.FormEvent) {
    e.preventDefault();
    const instruction = itinEditInput.trim();
    if (!instruction || !customItinerary || itinBusy) return;
    setItinEditInput("");
    setItinBusy(true);
    setThread((prev) => [...prev, { from: "user", type: "text", text: `Update my itinerary: ${instruction}`, time: nowTime() }]);
    setTimeout(() => {
      const dayMatch = instruction.match(/day\s*(\d+)/i);
      const dayIdx = dayMatch ? Math.min(parseInt(dayMatch[1], 10) - 1, customItinerary.days.length - 1) : 0;
      const targetDay = customItinerary.days[Math.max(dayIdx, 0)];
      setCustomItinerary((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((d, i) => (i !== Math.max(dayIdx, 0) ? d : { ...d, activities: [...d.activities, { id: `ai-${Date.now()}`, text: instruction.charAt(0).toUpperCase() + instruction.slice(1), aiAdded: true }] }));
        return { ...prev, days };
      });
      setThread((prev) => [...prev, { from: "ai", type: "text", text: `Done! I've updated "${targetDay.label}" with: "${instruction}". You can keep editing the itinerary on the right, or ask me for another change.`, time: nowTime() }]);
      setItinBusy(false);
    }, 900);
  }


  return (
    <div className="concierge-page">
      <div className="concierge-layout">
        <aside className="concierge-sidebar">
          <button className="new-convo-btn" onClick={resetConversation}>+ New Conversation</button>

          <p className="side-heading">Conversations</p>
          {conversations.map((c) => (
            <button key={c.id} className={activeConvo === c.id ? "convo-item2 active" : "convo-item2"} onClick={() => { setActiveConvo(c.id); setSidebarDetail({ kind: "conversation", item: c }); }}>
              <NavIcon.chat />
              <span>
                <strong>{c.title}</strong>
                <em>{c.meta}</em>
              </span>
            </button>
          ))}

          <p className="side-heading">Saved Trips</p>
          {savedTrips.map((t) => (
            <button key={t.title} className="convo-item2" onClick={() => setSidebarDetail({ kind: "trip", item: t })}>
              <span className="side-flag"><NavIcon.location /></span>
              <span>
                <strong>{t.title}</strong>
                <em>{t.dates}</em>
              </span>
            </button>
          ))}

          <p className="side-heading">Travellers</p>
          {travellers.map((t) => (
            <button key={t.name} className="convo-item2" onClick={() => setSidebarDetail({ kind: "traveller", item: t })}>
              {t.photo ? (
                <img className="side-avatar" src={t.photo} alt="" />
              ) : (
                <span className="side-avatar side-avatar-initials">{t.initials}</span>
              )}
              <span>
                <strong>{t.name}</strong>
                <em>{t.role}</em>
              </span>
            </button>
          ))}
        </aside>

        <main className="concierge-center">
          <div className="concierge-header">
            <div className="concierge-header-left">
              <span className="concierge-header-avatar"><NavIcon.sparkle /></span>
              <div>
                <strong>Travel Concierge</strong>
                <span className="concierge-status"><i /> AI Assistant · Online</span>
              </div>
            </div>
            <div className="concierge-header-actions">
              <button
                className={liveMode ? "concierge-live-toggle on" : "concierge-live-toggle"}
                onClick={() => setLiveMode((v) => !v)}
                title={liveMode ? "Using live Claude AI — click to switch to scripted demo mode" : "Using scripted demo mode — click to switch to live Claude AI"}
              >
                <NavIcon.sparkle /> {liveMode ? "Live AI" : "Demo Mode"}
              </button>
              <button onClick={() => setRightTab("itinerary")}>Your Trip</button>
              {customItinerary && (
                <ShareButton
                  title={customItinerary.title}
                  text={`${customItinerary.title} — ${customItinerary.destination}`}
                  link={itineraryShareLink(customItinerary)}
                />
              )}
              <button aria-label="Reset" onClick={resetConversation}><NavIcon.reset /></button>
              <button aria-label="More" onClick={() => setToast("More options coming soon")}><NavIcon.dots /></button>
            </div>
          </div>

          <div className="concierge-thread" ref={scrollRef}>
            {thread.length === 0 && (
              <div className="concierge-empty-state">
                <span className="concierge-empty-icon"><NavIcon.sparkle /></span>
                <h2>Your AI Travel Concierge</h2>
                <p>I'll ask you one question at a time to plan your perfect trip — flights, hotels, transfers, restaurants, insurance, and more.</p>
                <div className="concierge-empty-pills">
                  {[
                    { icon: "plane", label: "Flights" },
                    { icon: "hotel", label: "Hotels" },
                    { icon: "transport", label: "Cabs" },
                    { icon: "dining", label: "Restaurants" },
                    { icon: "camera", label: "Activities" },
                    { icon: "shield", label: "Insurance" },
                    { icon: "dollar", label: "Forex" },
                  ].map((p) => {
                    const PillIcon = NavIcon[p.icon as keyof typeof NavIcon];
                    return <span key={p.label} className="concierge-empty-pill"><PillIcon /> {p.label}</span>;
                  })}
                </div>
                <button className="concierge-empty-start" onClick={resetConversation}><NavIcon.plus /> Start New Conversation</button>
                <p className="concierge-empty-hint">or click <strong>"New Conversation"</strong> in the sidebar</p>
              </div>
            )}
            {thread.map((m, i) => {
              const key = `${activeConvo}-${i}`;
              if (m.type === "text") {
                return (
                  <div key={key} className={m.from === "user" ? "msg-row msg-row-user" : "msg-row"}>
                    {m.from === "ai" && <AiAvatar />}
                    <div className="msg-col">
                      <div className={m.from === "user" ? "msg-bubble msg-bubble-user" : "msg-bubble"}>{m.text}</div>
                      {m.from === "ai" && (
                        <div className="msg-meta">
                          {m.time && <span>{m.time}</span>}
                          <button aria-label="Copy" onClick={() => { navigator.clipboard?.writeText(m.text); setToast("Copied"); }}><NavIcon.copy /></button>
                          <button aria-label="Help"><NavIcon.help /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              if (m.type === "confirm") {
                return <div key={key} className="msg-row"><AiAvatar /><div className="msg-confirm"><NavIcon.check /> {m.text}</div></div>;
              }
              if (m.type === "chips") {
                return (
                  <div key={key} className="msg-row">
                    <AiAvatar />
                    <div className="msg-col">
                      <span className="msg-chips-label">{m.label}</span>
                      <div className="msg-chips">
                        {m.options.map((o) => (
                          <button key={o} onClick={() => sendMessage(o)} disabled={sending}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (m.type === "personaPicker") {
                return (
                  <div key={key} className="msg-row"><AiAvatar /><PersonaPickerMsg onContinue={startCompositeFlow} /></div>
                );
              }
              if (m.type === "passengerForm") {
                return (
                  <div key={key} className="msg-row"><AiAvatar /><PassengerFormMsg roster={m.roster} onSave={(summary) => sendMessage(summary)} /></div>
                );
              }
              if (m.type === "flightDetailsForm") {
                return (
                  <div key={key} className="msg-row"><AiAvatar /><FlightDetailsFormMsg onSave={(encoded) => sendMessage(encoded)} /></div>
                );
              }
              if (m.type === "datepicker") {
                return (
                  <div key={key} className="msg-row"><AiAvatar /><DatePickerMsg onPick={(label) => sendMessage(label)} /></div>
                );
              }
              if (m.type === "travelers") {
                return (
                  <div key={key} className="msg-row"><AiAvatar /><TravelersMsg onConfirm={(label) => sendMessage(label)} /></div>
                );
              }
              if (m.type === "suggestions") {
                return (
                  <div key={key} className="msg-row">
                    <AiAvatar />
                    <div className="conv-suggest-list" style={{ padding: 0 }}>
                      {m.items.map((s) => (
                        <SuggestionCard
                          key={s.id}
                          suggestion={s}
                          onSelect={() => setToast(`${s.title} selected`)}
                          onAddToItinerary={handleSuggestionAdd}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              if (m.type === "flightLeg") {
                return (
                  <div key={key} className="msg-row">
                    <AiAvatar />
                    <div className="flight-leg-card">
                      <div className="flight-leg-head"><NavIcon.plane /> {m.title}</div>
                      <div className="flight-leg-summary">
                        <div><span>Flight</span><strong>{m.flightName}</strong></div>
                        <div><span>Onboard location</span><strong>{m.onboardLocation}</strong></div>
                        <div><span>Local departure</span><strong>{m.departureTime}</strong></div>
                      </div>
                      <div className="flight-leg-passengers">
                        {m.passengers.map((p) => (
                          <div key={p.name} className="flight-leg-passenger-row">
                            <span className="flight-leg-passenger-name"><NavIcon.userCircle /> {p.name}</span>
                            <span className="flight-leg-pill">{p.cls}</span>
                            <span className="flight-leg-pill seat">Seat {p.seat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (m.type === "info") {
                return (
                  <div key={key} className="msg-row">
                    <AiAvatar />
                    <div className="msg-info">
                      <div className="msg-info-head"><NavIcon.info /> {m.title}</div>
                      {m.rows.map((r) => (
                        <div key={r.label} className="msg-info-row"><span>{r.label}</span><strong>{r.value}</strong></div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="msg-row">
                  <AiAvatar />
                  <div className="msg-cards">
                    {m.options.map((opt, oi) => {
                      const isSelected = selected[key] === oi;
                      const imgSrc = opt.image ?? (opt.from ? `/images/dest-${opt.from}.png` : null);
                      return (
                        <button
                          key={opt.title}
                          className={isSelected ? "msg-card-v selected" : "msg-card-v"}
                          onClick={() => handleCardSelect(key, oi, opt, m.variant)}
                        >
                          {imgSrc ? (
                            <div className="msg-card-v-media">
                              <img src={imgSrc} alt="" />
                              {opt.badge && <span className="msg-card-v-badge"><NavIcon.sparkle /> {opt.badge}</span>}
                              <span className={isSelected ? "msg-card-v-check on" : "msg-card-v-check"}>{isSelected && <NavIcon.check />}</span>
                              {opt.rating && <span className="msg-card-v-rating"><NavIcon.star /> {opt.rating}</span>}
                            </div>
                          ) : (
                            <div className="msg-card-v-iconwrap">
                              <div className="msg-card-v-icon"><CardIcon variant={m.variant} /></div>
                              {isSelected && <span className="msg-card-v-check on"><NavIcon.check /></span>}
                            </div>
                          )}
                          <div className="msg-card-v-body">
                            <strong>{opt.title}</strong>
                            {opt.subtitle && <span className="msg-card-v-subtitle">{opt.subtitle}</span>}
                            {opt.tags && opt.tags.length > 0 && (
                              <div className="msg-card-v-tags">{opt.tags.map((t) => <em key={t}>{t}</em>)}</div>
                            )}
                            {opt.price && <div className="msg-card-v-price">{opt.price}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="msg-row"><AiAvatar /><div className="msg-bubble msg-typing"><span /><span /><span /></div></div>
            )}
          </div>

          <form className="concierge-input-bar" onSubmit={handleSend}>
            <div className="concierge-input-wrap">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your trip…" disabled={sending} />
              <div className="concierge-input-icons">
                <button type="button" aria-label="Add image" onClick={() => setToast("Image upload coming soon")}><NavIcon.image /></button>
                <button type="button" aria-label="Attach file" onClick={() => setToast("Attachments coming soon")}><NavIcon.paperclip /></button>
                <button type="button" aria-label="Voice input" onClick={() => setToast("Voice input coming soon")}><NavIcon.mic /></button>
              </div>
            </div>
            <button type="submit" className="concierge-send" disabled={sending || !input.trim()}><NavIcon.send /></button>
          </form>
        </main>

        <aside className="concierge-summary">
          <div className="summary-tabs">
            <button className={rightTab === "itinerary" ? "active" : ""} onClick={() => setRightTab("itinerary")}><NavIcon.list /> Itinerary</button>
            <button className={rightTab === "calendar" ? "active" : ""} onClick={() => setRightTab("calendar")}><NavIcon.calendar /> Calendar</button>
            <button className={rightTab === "cost" ? "active" : ""} onClick={() => setRightTab("cost")}><NavIcon.dollar /> Cost</button>
            <button className={rightTab === "readiness" ? "active" : ""} onClick={() => setRightTab("readiness")}><NavIcon.check /> Readiness</button>
          </div>

          {(() => {
            const { origin, destination } = parseRoute(tripRouteText ?? "");
            const { depart, ret } = parseTripDates(tripDatesText ?? "");
            const routeLabel = tripRouteText ? `${origin} → ${destination}` : "Plan your trip";
            const datesLabel = tripDatesText ? `${depart} – ${ret}` : "Dates not set yet";
            const partyLabel = partyRoster ? `${partyRoster.length} traveler${partyRoster.length === 1 ? "" : "s"}` : "Travelers TBD";
            return (
              <div className="trip-card clickable" role="button" tabIndex={0} onClick={() => navigate("/itinerary")} onKeyDown={(e) => { if (e.key === "Enter") navigate("/itinerary"); }}>
                <span className="trip-flag"><NavIcon.location /></span>
                <div>
                  <strong>{routeLabel}</strong>
                  <span>{datesLabel} · {partyLabel}</span>
                  <div className="trip-flight">
                    <NavIcon.plane /> <em>{activeFlow ? "Building…" : personaTag ? "Ready" : "Building…"}</em>
                    {personaTag && <i className="persona-tag">{personaTag}</i>}
                  </div>
                </div>
              </div>
            );
          })()}

          {rightTab === "calendar" && (() => {
            const now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth();
            let rangeStart: number | null = null;
            let rangeEnd: number | null = null;
            if (tripDatesText) {
              const { depart, ret } = parseTripDates(tripDatesText);
              const d1 = new Date(depart);
              const d2 = new Date(ret);
              if (!isNaN(d1.getTime())) {
                year = d1.getFullYear();
                month = d1.getMonth();
                rangeStart = d1.getDate();
              }
              if (!isNaN(d2.getTime()) && d2.getFullYear() === year && d2.getMonth() === month) rangeEnd = d2.getDate();
            }
            const cells = buildCalendar(year, month);
            const inRange = (day: number) => rangeStart !== null && day >= rangeStart && day <= (rangeEnd ?? rangeStart);
            return (
            <div className="calendar-widget">
              <div className="calendar-head"><NavIcon.calendar /> {MONTH_NAMES[month]} {year}</div>
              <div className="calendar-grid calendar-dow">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="calendar-grid">
                {cells.map((d, i) => (
                  <span key={i} className={d && inRange(d) ? "cal-day active" : "cal-day"}>{d ?? ""}</span>
                ))}
              </div>
              {!tripDatesText && <p className="itinerary-empty">No dates selected yet — pick your travel dates in the chat to see them here.</p>}

              <p className="side-heading">Sync to Calendar</p>
              <button className="sync-row" onClick={() => setToast("Connected to Google Calendar")}>
                <span className="sync-icon"><NavIcon.calendar /></span>
                <span><strong>Google Calendar</strong><em>Add all trip events automatically</em></span>
                <NavIcon.chevronRight />
              </button>
              <button className="sync-row" onClick={() => setToast("Trip exported as .ics file")}>
                <span className="sync-icon"><NavIcon.download /></span>
                <span><strong>Apple Calendar</strong><em>Export as .ics file</em></span>
                <NavIcon.chevronRight />
              </button>
            </div>
            );
          })()}

          {rightTab === "itinerary" && (
            <div className="itinerary-widget">
              {!customItinerary ? (
                <>
                  <p className="side-heading">Itinerary</p>
                  <p className="itinerary-empty">Nothing booked yet — ask the concierge for flights, hotels, or activities and they'll appear here.</p>
                  <button className="itin-load-sample-btn" onClick={loadSampleItinerary}><NavIcon.sparkle /> Load sample 3-day itinerary</button>
                </>
              ) : (
                <div className="editable-itin">
                  <div className="editable-itin-head">
                    <p className="side-heading">{customItinerary.title}</p>
                    <button className="editable-itin-reset" onClick={() => setCustomItinerary(null)} aria-label="Clear itinerary"><NavIcon.close /></button>
                  </div>
                  <p className="editable-itin-dest"><NavIcon.location /> {customItinerary.destination}</p>
                  {customItinerary.note && <p className="editable-itin-note"><NavIcon.info /> {customItinerary.note}</p>}

                  {customItinerary.days.map((day, dayIdx) => {
                    const [dayNum, ...labelRest] = day.label.split(" — ");
                    const dayLabelRest = labelRest.join(" — ");
                    const bookedItems = day.activities.filter((a) => a.confirmed);
                    const plainItems = day.activities.filter((a) => !a.confirmed);
                    return (
                      <div key={day.label} className="itin-day-card">
                        <div className="itin-day-card-head">
                          <span className="itin-day-badge">{dayNum.replace(/[^\d]/g, "") ? <><em>DAY</em>{dayNum.replace(/[^\d]/g, "")}</> : dayNum}</span>
                          <span className="itin-day-card-label">{dayLabelRest || day.label}</span>
                        </div>

                        {bookedItems.length > 0 && (
                          <div className="itin-day-timeline">
                            {bookedItems.map((act, actIdx) => {
                              const ActIcon = NavIcon[(act.icon as keyof typeof NavIcon) ?? "sparkle"];
                              const isEditing = editingActId === act.id;
                              if (isEditing) {
                                return (
                                  <div key={act.id} className="itin-timeline-row">
                                    <span className="itin-timeline-icon"><ActIcon /></span>
                                    <div className="itin-timeline-edit">
                                      <input value={act.text} onChange={(e) => updateActivityField(dayIdx, act.id, "text", e.target.value)} placeholder="Title" />
                                      <input value={act.subtitle ?? ""} onChange={(e) => updateActivityField(dayIdx, act.id, "subtitle", e.target.value)} placeholder="Subtitle (optional)" />
                                      <div className="itin-timeline-edit-grid">
                                        <input value={act.time ?? ""} onChange={(e) => updateActivityField(dayIdx, act.id, "time", e.target.value)} placeholder="Time" />
                                        <input value={act.price ?? ""} onChange={(e) => updateActivityField(dayIdx, act.id, "price", e.target.value)} placeholder="Price" />
                                      </div>
                                      <div className="itin-timeline-edit-actions">
                                        <button className="conv-btn-save" onClick={() => setEditingActId(null)}>Save</button>
                                        <button className="conv-btn-delete" onClick={() => { removeActivity(dayIdx, act.id); setEditingActId(null); }}>Delete</button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={act.id} className="itin-timeline-row">
                                  <span className="itin-timeline-icon"><ActIcon /></span>
                                  <div className="itin-timeline-body">
                                    <strong>{act.text}</strong>
                                    {act.subtitle && <span className="itin-timeline-subtitle">{act.subtitle}</span>}
                                    <div className="itin-timeline-meta">
                                      {act.time && <span className="itin-timeline-time">{act.time}</span>}
                                      {act.price && <span className="itin-timeline-price">{act.price}</span>}
                                      <span className="itin-timeline-confirmed"><NavIcon.check /> Confirmed</span>
                                    </div>
                                  </div>
                                  <div className="itin-timeline-actions">
                                    <button aria-label="Move up" disabled={actIdx === 0} onClick={() => moveActivity(dayIdx, act.id, -1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><NavIcon.chevronDown /></span></button>
                                    <button aria-label="Move down" disabled={actIdx === bookedItems.length - 1} onClick={() => moveActivity(dayIdx, act.id, 1)}><NavIcon.chevronDown /></button>
                                    <button aria-label="Edit" onClick={() => setEditingActId(act.id)}><NavIcon.edit /></button>
                                    <button aria-label="Delete" onClick={() => removeActivity(dayIdx, act.id)}><NavIcon.close /></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {plainItems.map((act, actIdx) => (
                          <div key={act.id} className={act.aiAdded ? "editable-activity ai-added" : "editable-activity"}>
                            {act.aiAdded && <span className="editable-activity-ai-tag"><NavIcon.sparkle /></span>}
                            <input value={act.text} onChange={(e) => updateActivityText(dayIdx, act.id, e.target.value)} placeholder="Describe this activity…" />
                            <div className="itin-timeline-actions editable-activity-actions">
                              <button aria-label="Move up" disabled={actIdx === 0} onClick={() => moveActivity(dayIdx, act.id, -1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><NavIcon.chevronDown /></span></button>
                              <button aria-label="Move down" disabled={actIdx === plainItems.length - 1} onClick={() => moveActivity(dayIdx, act.id, 1)}><NavIcon.chevronDown /></button>
                              <button aria-label="Remove activity" onClick={() => removeActivity(dayIdx, act.id)}><NavIcon.close /></button>
                            </div>
                          </div>
                        ))}
                        <button className="editable-add-activity" onClick={() => addActivity(dayIdx)}><NavIcon.plus /> Add activity</button>
                      </div>
                    );
                  })}

                  <button className="itin-optimize-btn" onClick={() => setToast("Optimizing your itinerary with AI…")}>
                    <NavIcon.sparkle /> Optimize with AI
                  </button>

                  <form className="editable-itin-ai-form" onSubmit={submitItinEdit}>
                    <label className="editable-itin-ai-label"><NavIcon.sparkle /> Edit with AI</label>
                    <div className="editable-itin-ai-row">
                      <input
                        value={itinEditInput}
                        onChange={(e) => setItinEditInput(e.target.value)}
                        placeholder='e.g. "Add a spa day to Day 2"'
                        disabled={itinBusy}
                      />
                      <button type="submit" disabled={itinBusy || !itinEditInput.trim()}>{itinBusy ? "…" : <NavIcon.send />}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {rightTab === "cost" && (() => {
            const confirmedItems = customItinerary?.days.flatMap((d) => d.activities).filter((a) => a.confirmed) ?? [];
            const parsePriceValue = (price?: string): number => {
              if (!price) return 0;
              const match = price.replace(/,/g, "").match(/[\d.]+/);
              return match ? parseFloat(match[0]) : 0;
            };
            const categoryLabels: Record<string, string> = {
              plane: "Flights", hotel: "Hotel", transport: "Cabs & Transfers", dining: "Restaurants",
              camera: "Activities", shield: "Insurance", dollar: "Forex", sim: "Connectivity", compass: "Guide",
            };
            const totals = new Map<string, number>();
            for (const item of confirmedItems) {
              const label = categoryLabels[item.icon ?? ""] ?? "Other";
              totals.set(label, (totals.get(label) ?? 0) + parsePriceValue(item.price));
            }
            const grandTotal = [...totals.values()].reduce((sum, v) => sum + v, 0);
            return (
              <div className="itinerary-widget">
                <p className="side-heading">Estimated Cost</p>
                {confirmedItems.length === 0 ? (
                  <p className="itinerary-empty">Nothing booked yet — costs will appear here as you confirm flights, hotels, and more.</p>
                ) : (
                  <>
                    <div className="summary-rows">
                      {[...totals.entries()].map(([label, amount]) => (
                        <div key={label}><span>{label}</span><strong>${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                      ))}
                    </div>
                    <div className="summary-total"><span>Total</span><strong>${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                  </>
                )}
              </div>
            );
          })()}

          {rightTab === "readiness" && (() => {
            const readiness = computeReadiness({ personaTag, activeFlow, customItinerary });
            const statusLabel: Record<TaskStatus, string> = { "not-started": "Not started", "in-progress": "In progress", "needs-attention": "Needs attention", confirmed: "Confirmed" };
            return (
              <div className="itinerary-widget">
                <p className="side-heading">Trip Readiness</p>
                {!personaTag ? (
                  <p className="itinerary-empty">Pick a trip type in the chat to start tracking readiness.</p>
                ) : (
                  <div className="readiness-list">
                    {READINESS_ROWS.map((row) => (
                      <div key={row.key} className="readiness-row">
                        <span>{row.label}</span>
                        <em className={`readiness-badge readiness-${readiness[row.key]}`}>{statusLabel[readiness[row.key]]}</em>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="summary-footer">
            <button
              className="book-trip-btn"
              onClick={() => {
                const confirmedItems = customItinerary?.days.flatMap((d) => d.activities).filter((a) => a.confirmed) ?? [];
                const categoryLabels: Record<string, string> = {
                  plane: "Flights", hotel: "Hotel", transport: "Cabs & Transfers", dining: "Restaurants",
                  camera: "Activities", shield: "Insurance", dollar: "Forex", sim: "Connectivity", compass: "Guide",
                };
                const parsePriceValue = (price?: string): number => {
                  if (!price) return 0;
                  const match = price.replace(/,/g, "").match(/[\d.]+/);
                  return match ? parseFloat(match[0]) : 0;
                };
                const totals = new Map<string, number>();
                for (const item of confirmedItems) {
                  const label = categoryLabels[item.icon ?? ""] ?? "Other";
                  totals.set(label, (totals.get(label) ?? 0) + parsePriceValue(item.price));
                }
                const items = [...totals.entries()].map(([label, amount]) => ({ label, amount }));
                const total = items.reduce((sum, i) => sum + i.amount, 0);
                navigate("/checkout", { state: { tripTitle: customItinerary?.title, items: items.length ? items : undefined, total: total || undefined } });
              }}
            >
              <NavIcon.lightning /> Book Entire Trip <span className="ai-badge">AI</span>
            </button>
            <div className="summary-footer-row">
              {customItinerary ? (
                <ShareButton
                  title={customItinerary.title}
                  text={`${customItinerary.title} — ${customItinerary.destination}`}
                  link={itineraryShareLink(customItinerary)}
                  label="Share"
                  wrapClassName="summary-footer-share"
                />
              ) : (
                <button onClick={() => setToast("Build an itinerary first, then share it")}><NavIcon.share /> Share</button>
              )}
              <button onClick={exportItinerary}><NavIcon.copy /> Export PDF</button>
            </div>
          </div>
        </aside>
      </div>

      {sidebarDetail && (
        <div className="task-modal-overlay" onClick={() => setSidebarDetail(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <button className="task-modal-close" aria-label="Close" onClick={() => setSidebarDetail(null)}><NavIcon.close /></button>

            {sidebarDetail.kind === "conversation" && (
              <>
                <div className="task-modal-head">
                  <span className="task-modal-icon" style={{ background: "var(--blue)" }}><NavIcon.chat /></span>
                  <div>
                    <div className="task-modal-title-row"><h3>{sidebarDetail.item.title}</h3></div>
                    <p className="task-modal-desc" style={{ margin: 0 }}>{sidebarDetail.item.meta}</p>
                  </div>
                </div>
                <div className="summary-rows">
                  <div><span>Status</span><strong>{sidebarDetail.item.status}</strong></div>
                  <div><span>Last updated</span><strong>{sidebarDetail.item.updated}</strong></div>
                </div>
                <button
                  className="dash-btn-primary"
                  style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    // "San Francisco → Dallas" is the live conversation already
                    // in progress — resume it as-is instead of overwriting it.
                    const mock = sidebarDetail.item.id !== "sf-dallas" ? MOCK_CONVERSATION_THREADS[sidebarDetail.item.id] : null;
                    if (mock) setThread(mock);
                    setSidebarDetail(null);
                  }}
                >
                  Continue conversation
                </button>
              </>
            )}

            {sidebarDetail.kind === "trip" && (
              <>
                <div className="task-modal-head">
                  <span className="task-modal-icon" style={{ background: "#4bb383" }}><NavIcon.location /></span>
                  <div>
                    <div className="task-modal-title-row"><h3>{sidebarDetail.item.title}</h3></div>
                    <p className="task-modal-desc" style={{ margin: 0 }}>{sidebarDetail.item.dates}</p>
                  </div>
                </div>
                <div className="summary-rows">
                  <div><span>Status</span><strong>{sidebarDetail.item.status}</strong></div>
                  <div><span>Travelers</span><strong>{sidebarDetail.item.travelers}</strong></div>
                  <div><span>Estimated budget</span><strong>{sidebarDetail.item.budget}</strong></div>
                </div>
                <button
                  className="dash-btn-primary"
                  style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    // "San Francisco → Dallas" reflects the live itinerary
                    // already being built — leave it alone instead of
                    // overwriting it with canned data.
                    const mock = sidebarDetail.item.title !== "San Francisco → Dallas" ? MOCK_TRIP_ITINERARIES[sidebarDetail.item.title] : null;
                    if (mock) setCustomItinerary(mock);
                    setRightTab("itinerary");
                    setSidebarDetail(null);
                  }}
                >
                  Open itinerary
                </button>
              </>
            )}

            {sidebarDetail.kind === "traveller" && (
              <>
                <div className="task-modal-head">
                  {sidebarDetail.item.photo ? (
                    <img src={sidebarDetail.item.photo} alt="" className="task-modal-avatar" />
                  ) : (
                    <span className="task-modal-avatar task-modal-avatar-initials">{sidebarDetail.item.initials}</span>
                  )}
                  <div>
                    <div className="task-modal-title-row"><h3>{sidebarDetail.item.name}</h3></div>
                    <p className="task-modal-desc" style={{ margin: 0 }}>{sidebarDetail.item.role}</p>
                  </div>
                </div>
                <div className="summary-rows">
                  <div><span>Passport</span><strong>{sidebarDetail.item.passport}</strong></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
