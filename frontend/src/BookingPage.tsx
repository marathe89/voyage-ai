import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { CurrencyConverter, useCurrency } from "./currency";
import { AirportInput } from "./AirportInput";
import { DatePicker } from "./DatePicker";

interface InfoLine {
  icon?: "location" | "clock";
  text: string;
}

export interface BookOption {
  id: string;
  title: string;
  meta?: string;
  infoLines?: InfoLine[];
  location?: string;
  durationLabel?: string;
  tags?: string[];
  price: number;
  priceLabel: string;
  perPerson?: string;
  rating?: number;
  reviews?: string;
  badge?: "recommended";
  saveAmount?: number;
  depart?: { time: string; city: string };
  arrive?: { time: string; city: string };
  duration?: string;
  stops?: string;
  policy?: { text: string; kind: "good" | "warn"; icon: "check" | "clock" | "info" };
  included: string[];
  image?: string;
  gradient?: string;
  fareTier?: string;
  returnLeg?: { airline: string; depart: { time: string; city: string }; arrive: { time: string; city: string }; duration: string; stops: string };
  starCategory?: number;
}

type StepKey = "flights" | "hotels" | "forex" | "insurance" | "transport" | "activities" | "packages" | "pretrip";

const steps: { key: StepKey; label: string; icon: keyof typeof NavIcon; unit?: string }[] = [
  { key: "flights", label: "Flights", icon: "plane", unit: "4 pax" },
  { key: "hotels", label: "Hotels", icon: "hotel", unit: "3 nights" },
  { key: "activities", label: "Activities", icon: "activity" },
  { key: "packages", label: "Packages", icon: "package" },
  { key: "forex", label: "Forex", icon: "dollar", unit: "$1L" },
  { key: "insurance", label: "Insurance", icon: "shield", unit: "4 pax" },
  { key: "transport", label: "Local Transport", icon: "transport" },
  { key: "pretrip", label: "Pre-Trip Tasks", icon: "list" },
];

const aiTips: Record<StepKey, string> = {
  flights: "Non-stop Air India recommended — best balance of price, comfort, and schedule for your family.",
  hotels: "Andaz Tokyo scores highest for family amenities and proximity to your Day 2–4 activities.",
  forex: "VoyageAI Forex offers the best exchange rate with zero fees. Lock in today's rate before departure.",
  insurance: "Adventure sports coverage is essential for your Mt. Fuji hike. Premium plan covers all 4 activities.",
  transport: "JR Pass covers all Shinkansen, Hakone Romancecar, and the Narita airport transfer — best value.",
  activities: "Tea ceremony + Fuji hike are the top-rated picks for a family of 4. Bamboo forest is free!",
  packages: "Bundling your flights, hotels, and activities together saves the most — the Complete Japan Bundle covers everything you've already picked.",
  pretrip: "Before you travel: AI has flagged 8 action items across health, finance, connectivity, and packing based on your trip profile.",
};

const airlineLogos: Record<string, { code: string; bg: string; fg: string }> = {
  "Air India": { code: "AI", bg: "#c0142f", fg: "#fff" },
  "Akasa Air": { code: "QP", bg: "#ff6b1a", fg: "#fff" },
  "IndiGo + JAL": { code: "6E", bg: "#0b1f6b", fg: "#fff" },
  "Vistara": { code: "UK", bg: "#5b2a86", fg: "#fff" },
  "Singapore Airlines": { code: "SQ", bg: "#0b2447", fg: "#f4b400" },
};

export function AirlineLogo({ name }: { name: string }) {
  const meta = airlineLogos[name] ?? { code: name.slice(0, 2).toUpperCase(), bg: "#3c7ef2", fg: "#fff" };
  return <span className="airline-logo" style={{ background: meta.bg, color: meta.fg }}>{meta.code}</span>;
}

export const optionsByStep: Record<Exclude<StepKey, "pretrip">, BookOption[]> = {
  flights: [
    {
      id: "air-india-saver", title: "Air India", meta: "AI 302 · Economy · Non-stop", fareTier: "Super Saver", price: 2560, priceLabel: "$2,560", perPerson: "$640/person",
      rating: 4.6, reviews: "8.2k", badge: "recommended", saveAmount: 205,
      depart: { time: "23:45", city: "Mumbai" }, arrive: { time: "08:30+1", city: "Tokyo" }, duration: "9h 45m", stops: "Non-stop",
      returnLeg: { airline: "Air India", depart: { time: "13:20", city: "Tokyo" }, arrive: { time: "19:05", city: "Mumbai" }, duration: "9h 45m", stops: "Non-stop" },
      policy: { text: "Partially refundable", kind: "good", icon: "check" },
      included: ["1 checked bag (23kg)", "Seat selection included", "In-flight meal", "Non-stop flight"],
      image: "book-flight1.jpg",
    },
    {
      id: "air-india-corp", title: "Air India", meta: "AI 302 · Economy · Non-stop", fareTier: "Corporate", price: 3040, priceLabel: "$3,040", perPerson: "$760/person",
      rating: 4.6, reviews: "8.2k",
      depart: { time: "23:45", city: "Mumbai" }, arrive: { time: "08:30+1", city: "Tokyo" }, duration: "9h 45m", stops: "Non-stop",
      returnLeg: { airline: "Air India", depart: { time: "13:20", city: "Tokyo" }, arrive: { time: "19:05", city: "Mumbai" }, duration: "9h 45m", stops: "Non-stop" },
      policy: { text: "Fully refundable", kind: "good", icon: "check" },
      included: ["1 checked bag (23kg)", "Seat selection included", "In-flight meal", "Free cancellation"],
      image: "book-flight1.jpg",
    },
    {
      id: "akasa-saver", title: "Akasa Air", meta: "QP 1318 · Economy · Non-stop", fareTier: "Saver", price: 2240, priceLabel: "$2,240", perPerson: "$560/person",
      rating: 4.3, reviews: "6.4k",
      depart: { time: "17:25", city: "Mumbai" }, arrive: { time: "19:10+1", city: "Tokyo" }, duration: "10h 45m", stops: "Non-stop",
      returnLeg: { airline: "Akasa Air", depart: { time: "05:10", city: "Tokyo" }, arrive: { time: "06:55", city: "Mumbai" }, duration: "10h 45m", stops: "Non-stop" },
      policy: { text: "Partially refundable", kind: "good", icon: "check" },
      included: ["Cabin bag only", "No meal included", "Non-stop flight"],
      image: "book-flight2.jpg",
    },
    {
      id: "akasa-corp", title: "Akasa Air", meta: "QP 1318 · Economy · Non-stop", fareTier: "Corporate", price: 2440, priceLabel: "$2,440", perPerson: "$610/person",
      rating: 4.3, reviews: "6.4k",
      depart: { time: "17:25", city: "Mumbai" }, arrive: { time: "19:10+1", city: "Tokyo" }, duration: "10h 45m", stops: "Non-stop",
      returnLeg: { airline: "Akasa Air", depart: { time: "05:10", city: "Tokyo" }, arrive: { time: "06:55", city: "Mumbai" }, duration: "10h 45m", stops: "Non-stop" },
      policy: { text: "Fully refundable", kind: "good", icon: "check" },
      included: ["1 checked bag (15kg)", "No meal included", "Free cancellation"],
      image: "book-flight2.jpg",
    },
    {
      id: "indigo-jal-saver", title: "IndiGo + JAL", meta: "6E 84 / JL 096 · Economy · 1 stop (Singapore)", fareTier: "Saver", price: 2040, priceLabel: "$2,040", perPerson: "$510/person",
      rating: 4.1, reviews: "14.3k",
      depart: { time: "08:15", city: "Mumbai" }, arrive: { time: "19:45", city: "Tokyo" }, duration: "16h 30m", stops: "1 stop",
      returnLeg: { airline: "IndiGo + JAL", depart: { time: "06:05", city: "Tokyo" }, arrive: { time: "07:45+1", city: "Mumbai" }, duration: "16h 40m", stops: "1 stop" },
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Cabin bag only", "No meal included", "1 stop via Singapore"],
      image: "book-flight2.jpg",
    },
    {
      id: "indigo-jal-std", title: "IndiGo + JAL", meta: "6E 84 / JL 096 · Economy · 1 stop (Singapore)", fareTier: "Standard", price: 2180, priceLabel: "$2,180", perPerson: "$545/person",
      rating: 4.1, reviews: "14.3k",
      depart: { time: "08:15", city: "Mumbai" }, arrive: { time: "19:45", city: "Tokyo" }, duration: "16h 30m", stops: "1 stop",
      returnLeg: { airline: "IndiGo + JAL", depart: { time: "06:05", city: "Tokyo" }, arrive: { time: "07:45+1", city: "Mumbai" }, duration: "16h 40m", stops: "1 stop" },
      policy: { text: "Partially refundable", kind: "good", icon: "check" },
      included: ["1 checked bag (20kg)", "No meal included", "1 stop via Singapore"],
      image: "book-flight2.jpg",
    },
    {
      id: "vistara-saver", title: "Vistara", meta: "UK 33 · Economy · 1 stop (Delhi)", fareTier: "Saver", price: 2360, priceLabel: "$2,360", perPerson: "$590/person",
      rating: 4.5, reviews: "9.7k",
      depart: { time: "06:25", city: "Mumbai" }, arrive: { time: "08:00+1", city: "Tokyo" }, duration: "17h 35m", stops: "1 stop",
      returnLeg: { airline: "Vistara", depart: { time: "02:00", city: "Tokyo" }, arrive: { time: "03:35+1", city: "Mumbai" }, duration: "17h 35m", stops: "1 stop" },
      policy: { text: "Partially refundable", kind: "good", icon: "check" },
      included: ["1 checked bag (23kg)", "In-flight meal", "1 stop via Delhi"],
      image: "book-flight3.jpg",
    },
    {
      id: "singapore-saver", title: "Singapore Airlines", meta: "SQ 423 · Business · 1 stop (SIN)", fareTier: "Saver", price: 11400, priceLabel: "$11,400", perPerson: "$2,850/person",
      rating: 4.9, reviews: "5.1k",
      depart: { time: "14:30", city: "Mumbai" }, arrive: { time: "09:15+1", city: "Tokyo" }, duration: "11h 45m", stops: "1 stop",
      returnLeg: { airline: "Singapore Airlines", depart: { time: "07:35", city: "Tokyo" }, arrive: { time: "09:20", city: "Mumbai" }, duration: "11h 45m", stops: "1 stop" },
      policy: { text: "Free cancellation anytime", kind: "good", icon: "check" },
      included: ["2 checked bags (32kg each)", "Lounge access", "Lie-flat seat", "Priority boarding"],
      image: "book-flight3.jpg",
    },
    {
      id: "singapore-corp", title: "Singapore Airlines", meta: "SQ 423 · Business · 1 stop (SIN)", fareTier: "Corporate", price: 12600, priceLabel: "$12,600", perPerson: "$3,150/person",
      rating: 4.9, reviews: "5.1k",
      depart: { time: "14:30", city: "Mumbai" }, arrive: { time: "09:15+1", city: "Tokyo" }, duration: "11h 45m", stops: "1 stop",
      returnLeg: { airline: "Singapore Airlines", depart: { time: "07:35", city: "Tokyo" }, arrive: { time: "09:20", city: "Mumbai" }, duration: "11h 45m", stops: "1 stop" },
      policy: { text: "Fully refundable", kind: "good", icon: "check" },
      included: ["2 checked bags (32kg each)", "Lounge access", "Lie-flat seat", "Free date change"],
      image: "book-flight3.jpg",
    },
  ],
  hotels: [
    {
      id: "andaz-tokyo", title: "Andaz Tokyo Toranomon Hills", price: 1260, priceLabel: "$1,260", perPerson: "$420/night",
      rating: 4.9, reviews: "3.2k", badge: "recommended", saveAmount: 140, starCategory: 5, image: "book-hotel1.jpg",
      infoLines: [{ icon: "location", text: "Minato, Tokyo · 8 min walk to subway" }, { text: "Deluxe Family Room · 48m² · 3 nights" }],
      tags: ["Breakfast Incl.", "Family Suite", "City View"],
      policy: { text: "Free cancellation until Oct 5", kind: "good", icon: "check" },
      included: ["Free breakfast for 4", "Family suite (48m²)", "Outdoor pool access", "Free cancellation until Oct 5"],
    },
    {
      id: "shinjuku-prince", title: "Shinjuku Prince Hotel", price: 450, priceLabel: "$450", perPerson: "$150/night",
      rating: 4.3, reviews: "7.8k", saveAmount: 60, starCategory: 4, image: "book-hotel2.jpg",
      infoLines: [{ icon: "location", text: "Shinjuku, Tokyo · Direct subway access" }, { text: "Standard Twin · 28m² · 3 nights" }],
      tags: ["Value Pick", "Central Location"],
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Standard twin room", "Direct subway access", "24hr front desk"],
    },
    {
      id: "peninsula-tokyo", title: "The Peninsula Tokyo", price: 4350, priceLabel: "$4,350", perPerson: "$1,450/night",
      rating: 5.0, reviews: "1.9k", saveAmount: 450, starCategory: 5, image: "book-hotel3.jpg",
      infoLines: [{ icon: "location", text: "Chiyoda, Tokyo · Hibiya Park views" }, { text: "Grand Deluxe Suite · 72m² · 3 nights" }],
      tags: ["Ultra Luxury", "Butler Service", "Iconic"],
      policy: { text: "Free cancellation until Oct 1", kind: "good", icon: "check" },
      included: ["Personal butler service", "Grand Deluxe Suite (72m²)", "Park views", "Free cancellation until Oct 1"],
    },
    {
      id: "park-hyatt-tokyo", title: "Park Hyatt Tokyo", price: 2670, priceLabel: "$2,670", perPerson: "$890/night",
      rating: 4.8, reviews: "4.1k", badge: "recommended", saveAmount: 300, starCategory: 5, image: "itin-tokyo.png",
      infoLines: [{ icon: "location", text: "Shinjuku, Tokyo · Skyline views" }, { text: "Park Deluxe Room · 45m² · 3 nights" }],
      tags: ["Iconic Views", "Spa Access", "Rooftop Bar"],
      policy: { text: "Free cancellation until Oct 3", kind: "good", icon: "check" },
      included: ["Skyline view room", "Indoor pool & spa access", "Rooftop bar credit", "Free cancellation until Oct 3"],
    },
    {
      id: "hoshinoya-tokyo", title: "Hoshinoya Tokyo", price: 3480, priceLabel: "$3,480", perPerson: "$1,160/night",
      rating: 4.7, reviews: "2.6k", saveAmount: 200, starCategory: 5, image: "dest-kyoto.png",
      infoLines: [{ icon: "location", text: "Otemachi, Tokyo · Ryokan-style stay" }, { text: "Japanese Suite · 50m² · 3 nights" }],
      tags: ["Traditional Ryokan", "Onsen", "Kaiseki Dinner"],
      policy: { text: "Free cancellation until Sep 30", kind: "good", icon: "check" },
      included: ["Natural hot-spring onsen", "Kaiseki dinner for 2", "Tatami suite", "Free cancellation until Sep 30"],
    },
    {
      id: "citadines-shinjuku", title: "Citadines Shinjuku Tokyo", price: 620, priceLabel: "$620", perPerson: "$207/night",
      rating: 4.1, reviews: "5.4k", saveAmount: 80, starCategory: 3, image: "hero-bg.jpg",
      infoLines: [{ icon: "location", text: "Shinjuku, Tokyo · 5 min walk to station" }, { text: "Studio Apartment · 24m² · 3 nights" }],
      tags: ["Budget Pick", "Kitchenette", "Free Wi-Fi"],
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Studio apartment", "Kitchenette", "Free high-speed Wi-Fi"],
    },
  ],
  forex: [
    {
      id: "voyageai-forex", title: "VoyageAI Forex", price: 100000, priceLabel: "$100,000",
      rating: 4.8, reviews: "12.4k", badge: "recommended", saveAmount: 2100, image: "book-forex1.jpg",
      infoLines: [{ text: "$100,000 → 172,000 JPY" }, { text: "Rate: 1.72 · Zero fees" }, { icon: "clock", text: "Instant (travel card)" }],
      tags: ["Best Rate", "Zero Fees", "Instant Card"],
      policy: { text: "Refund within 48 hrs", kind: "good", icon: "clock" },
      included: ["Zero markup exchange", "Instant travel card", "Reload anywhere", "Refund within 48 hrs"],
    },
    {
      id: "thomas-cook", title: "Thomas Cook", price: 100500, priceLabel: "$100,500",
      rating: 4.2, reviews: "5.6k", image: "book-forex2.jpg",
      infoLines: [{ text: "$100,000 → 168,000 JPY" }, { text: "Rate: 1.68 · $500 service charge" }, { icon: "clock", text: "2-3 business days" }],
      tags: ["Physical Currency", "Door Delivery"],
      policy: { text: "Non-refundable once processed", kind: "warn", icon: "clock" },
      included: ["Physical currency delivery", "Door-step delivery", "2-3 business day processing"],
    },
  ],
  insurance: [
    {
      id: "voyageai-protect", title: "VoyageAI Protect – Premium", price: 3800, priceLabel: "$3,800", perPerson: "$950/person",
      rating: 4.9, reviews: "8.8k", badge: "recommended", saveAmount: 1200, image: "book-insurance1.jpg",
      infoLines: [{ text: "Backed by HDFC Ergo" }],
      tags: ["Comprehensive", "Adventure Cover", "AI Claims"],
      policy: { text: "Cancel anytime before departure", kind: "good", icon: "clock" },
      included: ["Medical coverage $150k", "Adventure sports cover", "AI-assisted claims", "Trip cancellation"],
    },
    {
      id: "basic-travel-cover", title: "Basic Travel Cover", price: 1600, priceLabel: "$1,600", perPerson: "$400/person",
      rating: 4.1, reviews: "3.2k", image: "book-insurance2.jpg",
      infoLines: [{ text: "Bajaj Allianz" }],
      tags: ["Budget", "Basic Cover"],
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Medical coverage $50k", "Basic trip cancellation"],
    },
  ],
  transport: [
    {
      id: "jr-narita-combo", title: "JR Pass + Narita Express Combo", price: 14200, priceLabel: "$14,200", perPerson: "$3,550/person",
      rating: 4.9, reviews: "22.0k", badge: "recommended", saveAmount: 6400, image: "book-transport1.jpg",
      infoLines: [{ text: "Rail Pass · Unlimited Shinkansen + all JR lines for 14 days. Includes N'..." }],
      tags: ["Best Value", "Unlimited Travel", "Airport Incl."],
      policy: { text: "Free cancellation until Oct 1", kind: "good", icon: "check" },
      included: ["Unlimited JR trains (14 days)", "Shinkansen included", "Narita Express included", "Airport transfer"],
    },
    {
      id: "private-airport-transfer", title: "Private Airport Transfer Only", price: 6800, priceLabel: "$6,800", perPerson: "$1,700/person",
      rating: 4.7, reviews: "4.1k", image: "book-transport2.jpg",
      infoLines: [{ text: "Transfer · Toyota Alphard. Narita Airport → Tokyo hotel. 4 passengers, ..." }],
      tags: ["Private", "Meet & Greet", "4-seater"],
      policy: { text: "Free cancellation 24hrs before", kind: "good", icon: "check" },
      included: ["Private Toyota Alphard", "Meet & greet at arrivals", "Door-to-door"],
    },
  ],
  activities: [
    {
      id: "fuji-hike", title: "Mt. Fuji Guided Hike – 5th Station", price: 16800, priceLabel: "$16,800", perPerson: "$4,200/person",
      rating: 4.8, reviews: "2.8k", badge: "recommended", saveAmount: 3200, image: "book-act-fuji.jpg",
      location: "Hakone", durationLabel: "6 hours · Oct 13",
      tags: ["Kid-Friendly", "Guided", "Breakfast Incl."],
      policy: { text: "Free cancellation 48hrs before", kind: "good", icon: "check" },
      included: ["English-speaking guide", "Breakfast included", "Hotel pickup"],
    },
    {
      id: "tea-ceremony", title: "Private Tea Ceremony – Urasenke Kyoto", price: 14000, priceLabel: "$14,000", perPerson: "$3,500/person",
      rating: 4.9, reviews: "0.9k", badge: "recommended", image: "book-act-kyoto.jpg",
      location: "Kyoto", durationLabel: "2.5 hours · Oct 14",
      tags: ["Private", "Traditional", "Cultural"],
      policy: { text: "Free cancellation until Oct 8", kind: "good", icon: "check" },
      included: ["Private tea ceremony", "Traditional tea house", "Kimono rental available"],
    },
    {
      id: "bamboo-walk", title: "Arashiyama Bamboo Forest Morning Walk", price: 0, priceLabel: "$0", perPerson: "$0/person",
      rating: 4.7, reviews: "14.0k", image: "book-act-lantern.jpg",
      location: "Kyoto", durationLabel: "3 hours · Oct 15",
      tags: ["Free", "Self-Guided", "Iconic"],
      policy: { text: "Free, open entry", kind: "good", icon: "check" },
      included: ["Self-guided walk", "Free entry", "Photo spots map"],
    },
    {
      id: "onsen-spa", title: "Hakone Onsen Spa Day – Gora Kadan", price: 27200, priceLabel: "$27,200", perPerson: "$6,800/person",
      rating: 5.0, reviews: "0.3k", image: "book-act-onsen.jpg",
      location: "Hakone", durationLabel: "Full day · Oct 13",
      tags: ["Luxury", "Adults Only", "Onsen"],
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Private onsen access", "Kaiseki lunch", "Spa treatment"],
    },
  ],
  packages: [
    {
      id: "complete-japan-bundle", title: "Complete Japan Family Bundle", meta: "Flights + Hotels + Activities + Insurance", price: 145000, priceLabel: "$145,000", perPerson: "$36,250/person",
      rating: 4.9, reviews: "6.4k", badge: "recommended", saveAmount: 18400,
      tags: ["All-Inclusive", "Best Value", "Family Friendly"],
      policy: { text: "Free cancellation until Oct 1", kind: "good", icon: "check" },
      included: ["Round-trip flights for 4", "3 nights at Andaz Tokyo", "Mt. Fuji hike + tea ceremony", "Premium travel insurance"],
      image: "book-act-fuji.jpg",
      gradient: "linear-gradient(135deg,#3c7ef2,#7ee8c9)",
    },
    {
      id: "tokyo-essentials", title: "Tokyo Essentials Package", meta: "Flights + Hotels + Airport Transfer", price: 92000, priceLabel: "$92,000", perPerson: "$23,000/person",
      rating: 4.6, reviews: "3.1k", saveAmount: 6200,
      tags: ["Budget Friendly", "Core Essentials"],
      policy: { text: "Free cancellation until Oct 5", kind: "good", icon: "check" },
      included: ["Round-trip flights for 4", "3 nights at Shinjuku Prince Hotel", "Private airport transfer"],
      image: "itin-tokyo.png",
      gradient: "linear-gradient(135deg,#2fa8a3,#a8e0dc)",
    },
    {
      id: "luxury-kyoto-tokyo", title: "Luxury Kyoto & Tokyo Package", meta: "Flights + 5-Star Hotels + Private Guide", price: 268000, priceLabel: "$268,000", perPerson: "$67,000/person",
      rating: 5.0, reviews: "0.8k",
      tags: ["Ultra Luxury", "Private Guide", "5-Star"],
      policy: { text: "Non-refundable", kind: "warn", icon: "info" },
      included: ["Business class flights for 4", "The Peninsula Tokyo, 3 nights", "Private tea ceremony + guide", "Butler service"],
      image: "dest-kyoto.png",
      gradient: "linear-gradient(135deg,#9c6fe0,#e0a8d0)",
    },
  ],
};

const flightPriceBounds = {
  min: Math.min(...optionsByStep.flights.map((o) => o.price)),
  max: Math.max(...optionsByStep.flights.map((o) => o.price)),
};
const flightDurationBounds = {
  min: Math.min(...optionsByStep.flights.map((o) => durationMinutes(o.duration))),
  max: Math.max(...optionsByStep.flights.map((o) => durationMinutes(o.duration))),
};

interface PretripTask {
  id: string;
  title: string;
  category: string;
  desc: string;
  icon: string;
  color: string;
  aiTip: boolean;
  steps: string[];
}

const pretripTasks: PretripTask[] = [
  { id: "medical", title: "Medical Checkup", category: "Health", icon: "activity", color: "#ef6f8e", aiTip: true, desc: "Tokyo in October: 18°C, low risk. Recommended general checkup if travelling with children under 10.", steps: ["Book a general physician visit 1–2 weeks before departure", "Confirm routine vaccinations are up to date", "Ask your doctor about motion sickness or altitude concerns", "Carry a copy of any prescriptions in English"] },
  { id: "medicines", title: "Order OTC Medicines", category: "Medicines", icon: "package", color: "#9c6fe0", aiTip: false, desc: "Based on your travel history: antihistamines, sunscreen SPF50, kids' paracetamol, motion-sickness tablets.", steps: ["Antihistamines for seasonal allergies", "Sunscreen SPF50 (Japan sun can be strong in October)", "Children's paracetamol / fever reducer", "Motion-sickness tablets for the Shinkansen and transfers", "A basic first-aid kit with band-aids and antiseptic"] },
  { id: "cards", title: "Activate Credit Cards for International Travel", category: "Finance", icon: "wallet", color: "#3c7ef2", aiTip: false, desc: "Notify Chase Sapphire & HDFC Regalia of travel dates Oct 10–20. Enable international transactions.", steps: ["Log in to your bank app and add a travel notice for Oct 10–20", "Enable international/foreign transactions on each card", "Confirm daily withdrawal limits are sufficient for Japan", "Save your bank's international helpline number"] },
  { id: "roaming", title: "Activate International Roaming / SIM", category: "Connectivity", icon: "sim", color: "#4bb383", aiTip: true, desc: "Enable international roaming on AT&T or order a Japan eSIM for unlimited data at $799 for 10 days.", steps: ["Compare your carrier's roaming pack vs. a Japan eSIM", "Order the eSIM online — it activates on arrival", "Test data connectivity in airplane mode before you land", "Save an offline map of Tokyo as backup"] },
  { id: "subscriptions", title: "Holiday Mode for Subscriptions", category: "Subscriptions", icon: "dining", color: "#e5a13c", aiTip: false, desc: "Pause dairy delivery, newspaper, HelloFresh & Amazon Fresh for Oct 10–20. Resume automatically.", steps: ["Pause dairy and newspaper delivery for Oct 10–20", "Pause meal-kit and grocery subscriptions (HelloFresh, Amazon Fresh)", "Set a reminder so everything resumes automatically on return", "Forward important mail or ask a neighbor to collect it"] },
  { id: "pack", title: "Pack for Tokyo October Weather", category: "Clothing", icon: "package", color: "#2fa8a3", aiTip: true, desc: "Tokyo in October: 18–24°C with occasional rain. Pack light layers and comfortable walking shoes.", steps: ["Pack light layers — mornings are cooler than afternoons", "Bring a compact umbrella or light rain jacket", "Comfortable walking shoes (expect 15k+ steps/day)", "One smart-casual outfit for nicer dinners"] },
  { id: "documents", title: "Travel Document Checklist", category: "Documents", icon: "book", color: "#4a5568", aiTip: false, desc: "Verify all documents are ready. AI has pre-checked your booking confirmations.", steps: ["Check passport validity — needs 6+ months beyond return date", "Print or save digital copies of flight and hotel confirmations", "Confirm visa/entry requirements for all travelers", "Keep a photo of passports stored securely in the cloud"] },
  { id: "emergency", title: "Save Emergency Contacts", category: "Emergency", icon: "info", color: "#e0526a", aiTip: true, desc: "Pre-saved: Tokyo emergency (110/119), India Embassy Tokyo, VoyageAI 24/7 support, hotel front desk.", steps: ["Save Tokyo emergency numbers: Police 110, Ambulance/Fire 119", "Save the India Embassy Tokyo contact and address", "Save VoyageAI's 24/7 support line", "Share your itinerary with a family member back home"] },
  { id: "passport-validity", title: "Passport & Visa Validity Check", category: "Documents", icon: "shield", color: "#7c5ce0", aiTip: true, desc: "Japan requires your passport to be valid for the full length of stay. Double-check visa requirements for each traveler.", steps: ["Confirm passport expiry is well beyond Oct 20, 2026", "Check visa-free eligibility or apply for a visa if required", "Verify each family member's passport separately", "Keep a spare passport photo for emergencies"] },
  { id: "home-security", title: "Home Security Before You Leave", category: "Home", icon: "lock", color: "#4a5568", aiTip: false, desc: "Secure your home while you're away — hold mail, set light timers, and notify a trusted neighbor.", steps: ["Put a hold on mail and package deliveries", "Set lights on a timer to look lived-in", "Ask a neighbor or friend to check in periodically", "Double-check doors, windows, and any smart locks"] },
  { id: "offline-maps", title: "Download Offline Maps & Translation Apps", category: "Connectivity", icon: "globe", color: "#3c7ef2", aiTip: true, desc: "Download Tokyo offline maps and a translation app before you land — handy in low-signal areas like the subway.", steps: ["Download offline Google Maps for the Tokyo/Hakone/Kyoto region", "Install a translation app with camera/offline mode", "Save key phrases: directions, allergies, emergencies", "Screenshot your hotel address in Japanese for taxis"] },
];

export function stripNextDay(time?: string) {
  return time?.replace(/\+\d+$/, "") ?? time;
}

function timeBucket(time?: string): string | null {
  if (!time) return null;
  const hour = parseInt(time.slice(0, 2), 10);
  if (Number.isNaN(hour)) return null;
  if (hour < 8) return "Early morning";
  if (hour < 12) return "Morning";
  if (hour < 16) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Night";
}

function durationMinutes(d?: string) {
  const m = d?.match(/(\d+)h\s*(\d+)?/);
  return m ? parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0) : 9999;
}

const timeBucketOptions: { label: string; hint: string }[] = [
  { label: "Early morning", hint: "12 AM - 8 AM" },
  { label: "Morning", hint: "8 AM - 12 PM" },
  { label: "Afternoon", hint: "12 PM - 4 PM" },
  { label: "Evening", hint: "4 PM - 8 PM" },
  { label: "Night", hint: "8 PM - 12 AM" },
];

const layoverAirports = ["Hyderabad (HYD)", "New Delhi (DEL)", "Goa (GOI)", "Chennai (MAA)", "Jaipur (JAI)", "Bengaluru (BLR)", "Kolkata (CCU)", "Ahmedabad (AMD)", "Kochi (COK)"];

export function BookingPage() {
  const { setToast } = useShell();
  const { format, formatPriceString } = useCurrency();
  const formatINR = (n: number) => format(n, { maximumFractionDigits: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tripMenuOpen, setTripMenuOpen] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());
  const [searchWhere, setSearchWhere] = useState("Mumbai (BOM) → Tokyo (NRT)");
  const [searchDates, setSearchDates] = useState("Oct 10 – Oct 20");
  const [searchGuests, setSearchGuests] = useState("4 Travelers");
  const [editingSearch, setEditingSearch] = useState(false);
  const [tripType, setTripType] = useState<"one" | "round">("round");
  const [editOrigin, setEditOrigin] = useState("Mumbai (BOM)");
  const [editDest, setEditDest] = useState("Tokyo (NRT)");
  const [editTripType, setEditTripType] = useState<"one" | "round">("round");
  const [editDepartDate, setEditDepartDate] = useState("2026-10-10");
  const [editReturnDate, setEditReturnDate] = useState("2026-10-20");
  const [editPassengers, setEditPassengers] = useState(4);
  const [compareIds, setCompareIds] = useState<Record<string, Set<string>>>({});
  const [compareOpen, setCompareOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [nonStopOnly, setNonStopOnly] = useState(false);
  const [nonStopOnlyReturn, setNonStopOnlyReturn] = useState(false);
  const [airlineFilter, setAirlineFilter] = useState<Set<string>>(new Set());
  const [flightSort, setFlightSort] = useState<"cheapest" | "fastest">("cheapest");
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [shortlistedFlights, setShortlistedFlights] = useState<Set<string>>(new Set());
  function toggleFlightShortlist(id: string, title: string) {
    setShortlistedFlights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setToast(`Removed ${title} from shortlist`);
      } else {
        next.add(id);
        setToast(`Shortlisted ${title}`);
      }
      return next;
    });
  }
  const [hotelSearch, setHotelSearch] = useState("");
  const [hotelSort, setHotelSort] = useState<"recommended" | "priceLowHigh" | "rating">("recommended");
  const [hotelDeal, setHotelDeal] = useState<"all" | "topPicks" | "jackpot" | "luxury" | "steal">("all");
  const [hotelStar, setHotelStar] = useState<"all" | "5" | "4" | "3">("all");
  const [hotelMinRating, setHotelMinRating] = useState<"all" | "4" | "4.5">("all");
  const [hotelArea, setHotelArea] = useState("all");
  const [allHotelFiltersOpen, setAllHotelFiltersOpen] = useState(false);
  const [hotelPillOpen, setHotelPillOpen] = useState<"sort" | "deals" | "star" | "rating" | "location" | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(2);
  const [onwardDepartFilter, setOnwardDepartFilter] = useState<Set<string>>(new Set());
  const [onwardArriveFilter, setOnwardArriveFilter] = useState<Set<string>>(new Set());
  const [returnDepartFilter, setReturnDepartFilter] = useState<Set<string>>(new Set());
  const [returnArriveFilter, setReturnArriveFilter] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState(flightPriceBounds.max);
  const [maxDuration, setMaxDuration] = useState(flightDurationBounds.max);
  const [airlinesExpanded, setAirlinesExpanded] = useState(false);
  const [layoverExpandedOnward, setLayoverExpandedOnward] = useState(false);
  const [layoverExpandedReturn, setLayoverExpandedReturn] = useState(false);

  useEffect(() => {
    const state = location.state as { stepKey?: StepKey; searchWhere?: string; searchDates?: string; searchGuests?: string; nonStopOnly?: boolean; tripType?: "one" | "round" } | null;
    if (state?.searchWhere) setSearchWhere(state.searchWhere);
    if (state?.searchDates) setSearchDates(state.searchDates);
    if (state?.searchGuests) setSearchGuests(state.searchGuests);
    if (state?.nonStopOnly) setNonStopOnly(true);
    if (state?.tripType) setTripType(state.tripType);
    if (state?.stepKey) {
      const idx = steps.findIndex((s) => s.key === state.stepKey);
      if (idx >= 0) setCurrentStep(idx);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps[currentStep];
  const currentCompareSet = compareIds[step.key] ?? new Set<string>();
  const currentCompareOptions = step.key === "pretrip" ? [] : (optionsByStep[step.key as keyof typeof optionsByStep] ?? []).filter((o) => currentCompareSet.has(o.id));
  const [routeFrom, routeTo] = searchWhere.includes("→")
    ? searchWhere.split("→").map((s) => s.trim())
    : ["Mumbai (BOM)", searchWhere.split(",")[0].trim() || "Tokyo (NRT)"];
  const tripName = routeTo.split("(")[0].trim() || "Trip";
  const onwardRouteLabel = `${routeFrom} → ${routeTo}`;
  const returnRouteLabel = `${routeTo} → ${routeFrom}`;
  const routeFromCity = routeFrom.split("(")[0].trim();
  const routeToCity = routeTo.split("(")[0].trim();
  const guestsCount = parseInt(searchGuests.match(/\d+/)?.[0] ?? "4", 10) || 4;
  const nightsCount = (() => {
    const m = searchDates.match(/(\d+)\D+(\d+)/);
    if (m) return Math.max(1, parseInt(m[2], 10) - parseInt(m[1], 10));
    return 3;
  })();
  function getStepUnit(key: StepKey): string {
    if (key === "flights") return `${guestsCount} pax`;
    if (key === "hotels") return `${nightsCount} nights`;
    if (key === "forex") return "$1L";
    if (key === "insurance") return `${guestsCount} pax`;
    return "";
  }

  const completedCount = steps.filter((s) => {
    if (skipped.has(s.key)) return true;
    if (s.key === "pretrip") return doneTasks.size === pretripTasks.length;
    return !!selections[s.key];
  }).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const { total, saved } = useMemo(() => {
    let t = 0, s = 0;
    (Object.keys(optionsByStep) as (keyof typeof optionsByStep)[]).forEach((key) => {
      const chosenId = selections[key];
      if (!chosenId) return;
      const opt = optionsByStep[key].find((o) => o.id === chosenId);
      if (opt) {
        t += opt.price;
        if (opt.saveAmount) s += opt.saveAmount;
      }
    });
    return { total: t, saved: s };
  }, [selections]);

  const flightAirlines = useMemo(() => [...new Set(optionsByStep.flights.map((o) => o.title))], []);

  const filteredFlights = useMemo(() => {
    let list = optionsByStep.flights.filter((o) => {
      if ((nonStopOnly || nonStopOnlyReturn) && o.stops !== "Non-stop") return false;
      if (airlineFilter.size && !airlineFilter.has(o.title)) return false;
      if (o.price > maxPrice) return false;
      if (durationMinutes(o.duration) > maxDuration) return false;
      if (onwardDepartFilter.size && !onwardDepartFilter.has(timeBucket(o.depart?.time) ?? "")) return false;
      if (onwardArriveFilter.size && !onwardArriveFilter.has(timeBucket(o.arrive?.time) ?? "")) return false;
      if (returnDepartFilter.size && !returnDepartFilter.has(timeBucket(o.returnLeg?.depart.time) ?? "")) return false;
      if (returnArriveFilter.size && !returnArriveFilter.has(timeBucket(o.returnLeg?.arrive.time) ?? "")) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (flightSort === "cheapest") return a.price - b.price;
      return durationMinutes(a.duration) - durationMinutes(b.duration);
    });
    return list;
  }, [nonStopOnly, nonStopOnlyReturn, airlineFilter, flightSort, maxPrice, maxDuration, onwardDepartFilter, onwardArriveFilter, returnDepartFilter, returnArriveFilter]);

  const hotelAreas = useMemo(() => [...new Set(optionsByStep.hotels.map((o) => o.infoLines?.[0]?.text.split(",")[0].trim() ?? ""))], []);

  function hotelDiscountPct(o: BookOption) {
    if (!o.saveAmount) return 0;
    return Math.round((o.saveAmount / (o.price + o.saveAmount)) * 100);
  }

  const filteredHotels = useMemo(() => {
    let list = optionsByStep.hotels.filter((o) => {
      if (hotelSearch && !o.title.toLowerCase().includes(hotelSearch.toLowerCase())) return false;
      if (hotelStar !== "all" && String(o.starCategory) !== hotelStar) return false;
      if (hotelMinRating !== "all" && (o.rating ?? 0) < Number(hotelMinRating)) return false;
      if (hotelArea !== "all" && !o.infoLines?.[0]?.text.startsWith(hotelArea)) return false;
      const discount = hotelDiscountPct(o);
      if (hotelDeal === "topPicks" && o.badge !== "recommended") return false;
      if (hotelDeal === "jackpot" && discount < 25) return false;
      if (hotelDeal === "luxury" && !(discount >= 10 && o.starCategory === 5)) return false;
      if (hotelDeal === "steal" && !(discount >= 10 && discount <= 25)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (hotelSort === "priceLowHigh") return a.price - b.price;
      if (hotelSort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });
    return list;
  }, [hotelSearch, hotelSort, hotelDeal, hotelStar, hotelMinRating, hotelArea]);
  const hotelFiltersActive = hotelDeal !== "all" || hotelStar !== "all" || hotelMinRating !== "all" || hotelArea !== "all" || hotelSort !== "recommended";
  function clearAllHotelFilters() {
    setHotelSort("recommended");
    setHotelDeal("all");
    setHotelStar("all");
    setHotelMinRating("all");
    setHotelArea("all");
  }

  const dateStripDays = useMemo(() => {
    const base = new Date(2026, 9, 25);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const price = 5000 + ((i * 733) % 5300);
      return { label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), price };
    });
  }, []);

  function selectOption(stepKey: StepKey, optionId: string) {
    setSelections((prev) => ({ ...prev, [stepKey]: optionId }));
    setSkipped((prev) => { const next = new Set(prev); next.delete(stepKey); return next; });
    const opt = optionsByStep[stepKey as keyof typeof optionsByStep]?.find((o) => o.id === optionId);
    setToast(opt ? `${opt.title} selected` : "Selected");
  }

  function toggleCompare(stepKey: StepKey, optionId: string) {
    setCompareIds((prev) => {
      const current = new Set(prev[stepKey] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        if (current.size >= 4) {
          setToast("You can compare up to 4 options at a time");
          return prev;
        }
        current.add(optionId);
      }
      return { ...prev, [stepKey]: current };
    });
  }

  function toggleAirlineFilter(name: string) {
    setAirlineFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function toggleInSet(setter: Dispatch<SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function clearAllFlightFilters() {
    setNonStopOnly(false);
    setNonStopOnlyReturn(false);
    setAirlineFilter(new Set());
    setOnwardDepartFilter(new Set());
    setOnwardArriveFilter(new Set());
    setReturnDepartFilter(new Set());
    setReturnArriveFilter(new Set());
    setMaxPrice(flightPriceBounds.max);
    setMaxDuration(flightDurationBounds.max);
  }

  function openEditSearch() {
    setEditOrigin(routeFrom);
    setEditDest(routeTo);
    setEditTripType(tripType);
    setEditPassengers(guestsCount);
    setEditingSearch(true);
  }

  function formatDateLabel(iso: string) {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function updateSearch() {
    if (!editDepartDate) {
      setToast("Please select a departure date");
      return;
    }
    setSearchWhere(`${editOrigin} → ${editDest}`);
    setSearchDates(editTripType === "round" && editReturnDate ? `${formatDateLabel(editDepartDate)} – ${formatDateLabel(editReturnDate)}` : formatDateLabel(editDepartDate));
    setSearchGuests(`${editPassengers} Passenger${editPassengers === 1 ? "" : "s"}`);
    setTripType(editTripType);
    setEditingSearch(false);
    setToast(`Updated search: ${editOrigin} → ${editDest}`);
  }

  function toggleTask(id: string) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function goNext() {
    if (currentStep === steps.length - 1) {
      const items = (Object.keys(optionsByStep) as (keyof typeof optionsByStep)[])
        .map((key) => {
          const chosenId = selections[key];
          if (!chosenId) return null;
          const opt = optionsByStep[key].find((o) => o.id === chosenId);
          if (!opt) return null;
          const stepLabel = steps.find((s) => s.key === key)?.label ?? key;
          return { label: `${stepLabel} — ${opt.title}`, amount: opt.price };
        })
        .filter((i): i is { label: string; amount: number } => i !== null);
      if (items.length === 0) {
        setToast("Select at least one option before checking out");
        return;
      }
      navigate("/checkout", { state: { tripTitle: `${tripName} Trip`, items, total: total || undefined } });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }
  function skipStep() {
    setSkipped((prev) => new Set(prev).add(step.key));
    setToast(`${step.label} skipped — you can come back to it anytime`);
    if (currentStep === steps.length - 1) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }

  const stepHasSelection = skipped.has(step.key) || (step.key === "pretrip" ? doneTasks.size === pretripTasks.length : !!selections[step.key]);
  const nextLabel = currentStep === steps.length - 1 ? "Finish & Review Trip" : `Next: ${steps[currentStep + 1].label}`;
  const tasksDonePct = Math.round((doneTasks.size / pretripTasks.length) * 100);

  return (
    <div className="booking-page">
      <div className="booking-tracker">
        {steps.map((s, i) => {
          const Icon = NavIcon[s.icon];
          const isSkipped = skipped.has(s.key);
          const isDone = s.key === "pretrip" ? doneTasks.size === pretripTasks.length : !!selections[s.key];
          const status = i === currentStep ? "current" : isSkipped ? "skipped" : isDone ? "done" : "upcoming";
          return (
            <div key={s.key} className="tracker-item-wrap">
              <button className={`tracker-item ${status}`} onClick={() => setCurrentStep(i)}>
                <span className="tracker-icon">{status === "done" ? <NavIcon.check /> : status === "skipped" ? <NavIcon.chevronRight /> : <Icon />}</span>
                <span className="tracker-text">
                  <strong>{s.label}</strong>
                  <em>{status === "current" ? "In progress" : status === "done" ? "Done" : status === "skipped" ? "Skipped" : getStepUnit(s.key)}</em>
                </span>
              </button>
              {i < steps.length - 1 && <span className={`tracker-line ${status === "done" || status === "skipped" ? "filled" : ""}`} />}
            </div>
          );
        })}
      </div>

      <div className="booking-layout">
        <main className="booking-main">
          {editingSearch ? (
            <div className="booking-search-edit-panel">
              <div className="ct-search-toprow">
                <label className="ct-radio">
                  <input type="radio" checked={editTripType === "one"} onChange={() => setEditTripType("one")} /> One way
                </label>
                <label className="ct-radio">
                  <input type="radio" checked={editTripType === "round"} onChange={() => setEditTripType("round")} /> Round trip
                </label>
                <span className="ct-divider" />
                <div className="ct-pax-inline">
                  <NavIcon.guests />
                  <div className="plan-stepper">
                    <button type="button" aria-label="Decrease" onClick={() => setEditPassengers((p) => Math.max(1, p - 1))}><NavIcon.minus /></button>
                    <strong>{editPassengers}</strong>
                    <button type="button" aria-label="Increase" onClick={() => setEditPassengers((p) => p + 1)}><NavIcon.plus /></button>
                  </div>
                  <span>{editPassengers === 1 ? "Passenger" : "Passengers"}</span>
                </div>
                <button type="button" className="booking-search-cancel" onClick={() => setEditingSearch(false)} aria-label="Cancel edit"><NavIcon.close /></button>
              </div>

              <div className="ct-route-row">
                <div className="ct-route-box">
                  <NavIcon.plane />
                  <div>
                    <label>FROM</label>
                    <AirportInput value={editOrigin} onChange={setEditOrigin} />
                  </div>
                </div>
                <button type="button" className="ct-swap" aria-label="Swap" onClick={() => { const f = editOrigin; setEditOrigin(editDest); setEditDest(f); }}><NavIcon.swap /></button>
                <div className="ct-route-box">
                  <span className="ct-plane-land"><NavIcon.plane /></span>
                  <div>
                    <label>TO</label>
                    <AirportInput value={editDest} onChange={setEditDest} />
                  </div>
                </div>
              </div>

              <div className="ct-date-row">
                <div className="ct-date-box">
                  <NavIcon.calendar />
                  <div>
                    <label>DEPART</label>
                    <DatePicker value={editDepartDate} onChange={setEditDepartDate} />
                  </div>
                </div>
                <div className="ct-date-box">
                  <NavIcon.calendar />
                  <div>
                    <label>RETURN</label>
                    <DatePicker value={editReturnDate} onChange={setEditReturnDate} min={editDepartDate} disabled={editTripType === "one"} />
                  </div>
                </div>
              </div>

              <button type="button" className="booking-search-update" onClick={updateSearch}><NavIcon.search /> Update Search</button>
            </div>
          ) : (
            <div className="booking-search-bar">
              <span className="booking-search-summary booking-trip-type-badge">{tripType === "one" ? <><NavIcon.plane /> One Way</> : <><NavIcon.swap /> Round Trip</>}</span>
              <span className="booking-search-summary"><NavIcon.location /> {searchWhere}</span>
              <span className="booking-search-summary"><NavIcon.calendar /> {searchDates}</span>
              <span className="booking-search-summary"><NavIcon.guests /> {searchGuests}</span>
              <button className="booking-search-edit" onClick={openEditSearch}><NavIcon.edit /> Edit search</button>
            </div>
          )}

          {currentCompareOptions.length >= 2 && (
            <div className="booking-compare-bar">
              <span><NavIcon.barChart /> {currentCompareOptions.length} options selected to compare</span>
              <div className="booking-compare-bar-actions">
                <button className="booking-compare-view" onClick={() => setCompareOpen(true)}>View Comparison</button>
                <button className="booking-compare-clear" onClick={() => setCompareIds((prev) => ({ ...prev, [step.key]: new Set() }))}>Clear</button>
              </div>
            </div>
          )}

          <div className="booking-step-head">
            <span className="booking-step-icon">{(() => { const StepIcon = NavIcon[step.icon]; return <StepIcon />; })()}</span>
            <div>
              <span className="booking-step-count">Step {currentStep + 1} of {steps.length}</span>
              <h2>{step.label}</h2>
            </div>
            <CurrencyConverter className="booking-step-currency" />
          </div>

          <div className="ai-tip"><NavIcon.sparkle /> <strong>AI tip:</strong> {aiTips[step.key]}</div>

          {step.key === "pretrip" ? (
            <>
              <div className="pretrip-progress">
                <span>{doneTasks.size} of {pretripTasks.length} tasks complete</span>
                <strong>{tasksDonePct}%</strong>
              </div>
              <div className="booking-progress-bar pretrip-bar"><span style={{ width: `${tasksDonePct}%` }} /></div>
              <div className="pretrip-cards">
                {pretripTasks.map((task) => {
                  const isDone = doneTasks.has(task.id);
                  const TaskIcon = NavIcon[task.icon as keyof typeof NavIcon] ?? NavIcon.info;
                  return (
                    <div key={task.id} className={isDone ? "pretrip-card done" : "pretrip-card"}>
                      <button className="pretrip-checkbox" onClick={() => toggleTask(task.id)} aria-label={`Mark ${task.title} ${isDone ? "incomplete" : "complete"}`}>
                        {isDone && <NavIcon.check />}
                      </button>
                      <span className="pretrip-icon" style={{ background: task.color }}><TaskIcon /></span>
                      <div className="pretrip-card-body">
                        <div className="pretrip-card-title">
                          <strong>{task.title}</strong>
                          {task.aiTip && <span className="ai-tip-badge"><NavIcon.sparkle /> AI Tip</span>}
                          <span className="pretrip-category">{task.category}</span>
                        </div>
                        <p>{task.desc}</p>
                        <div className="pretrip-links">
                          <button onClick={() => setActiveTaskId(task.id)}>View details</button>
                          <button onClick={() => setToast(`${task.title} skipped`)}>Skip</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {step.key === "hotels" && (
                <>

                  {filteredHotels.length === 0 && (
                    <p className="ctr-empty">No hotels match these filters — try clearing one.</p>
                  )}
                </>
              )}

            <div className="book-grid">
              {(step.key === "hotels" ? filteredHotels : step.key === "flights" ? filteredFlights : optionsByStep[step.key as keyof typeof optionsByStep])
                .map((opt) => {
                const isSelected = selections[step.key] === opt.id;
                const isExpanded = expanded[opt.id];
                return (
                  <article key={opt.id} className={isSelected ? "book-card selected" : "book-card"}>
                    <div
                      className="book-card-media"
                      style={opt.image ? { backgroundImage: `url(/images/${opt.image})` } : { background: opt.gradient ?? "linear-gradient(135deg,#e6e9f0,#cfd6e6)" }}
                    >
                      {opt.badge === "recommended" && <span className="book-badge book-badge-ai"><NavIcon.sparkle /> AI Recommended</span>}
                      {!!opt.saveAmount && <span className="book-badge book-badge-save">Save {formatINR(opt.saveAmount)}</span>}
                      {!!opt.rating && <span className="book-rating"><NavIcon.star /> {opt.rating} <em>({opt.reviews})</em></span>}
                    </div>
                    <div className="book-card-body">
                      <div className="book-card-title-row">
                        <div>
                          <strong>{opt.title}</strong>
                          {opt.meta && <p>{opt.meta}</p>}
                          {opt.infoLines?.map((line) => (
                            <p key={line.text} className="book-info-line">
                              {line.icon === "location" && <NavIcon.location />}
                              {line.icon === "clock" && <NavIcon.clock />}
                              {line.text}
                            </p>
                          ))}
                          {opt.location && (
                            <p className="book-info-line"><NavIcon.location /> {opt.location}</p>
                          )}
                          {opt.durationLabel && (
                            <p className="book-info-line"><NavIcon.clock /> {opt.durationLabel}</p>
                          )}
                        </div>
                        <div className="book-price">
                          <strong>{formatPriceString(opt.priceLabel)}</strong>
                          {opt.perPerson && <span>{formatPriceString(opt.perPerson)}</span>}
                        </div>
                      </div>

                      {opt.tags && (
                        <div className="book-tags">
                          {opt.tags.map((t) => <span key={t}>{t}</span>)}
                        </div>
                      )}

                      {opt.depart && opt.arrive && (
                        <div className="book-times">
                          <div><strong>{stripNextDay(opt.depart.time)}</strong><span>{opt.depart.city}</span></div>
                          <div className="book-times-mid"><span>{opt.duration}</span><NavIcon.plane /><em>{opt.stops}</em></div>
                          <div><strong>{stripNextDay(opt.arrive.time)}</strong><span>{opt.arrive.city}</span></div>
                        </div>
                      )}

                      {opt.policy && (
                        <div className={`book-policy ${opt.policy.kind}`}>
                          {opt.policy.icon === "check" && <NavIcon.check />}
                          {opt.policy.icon === "clock" && <NavIcon.clock />}
                          {opt.policy.icon === "info" && <NavIcon.info />}
                          {opt.policy.text}
                        </div>
                      )}

                      <button className="book-included-toggle" onClick={() => setExpanded((p) => ({ ...p, [opt.id]: !p[opt.id] }))}>
                        What's included <span className={isExpanded ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
                      </button>
                      {isExpanded && (
                        <ul className="book-included-list">
                          {opt.included.map((li) => <li key={li}><NavIcon.check /> {li}</li>)}
                        </ul>
                      )}

                      <div className="book-card-actions">
                        <button className={isSelected ? "book-select selected" : "book-select"} onClick={() => selectOption(step.key, opt.id)}>
                          {isSelected ? <><NavIcon.check /> Shortlisted</> : "Shortlist"}
                        </button>
                        <button className={currentCompareSet.has(opt.id) ? "book-compare active" : "book-compare"} onClick={() => toggleCompare(step.key, opt.id)}>
                          <NavIcon.barChart /> {currentCompareSet.has(opt.id) ? "Added" : "Compare"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            </>
          )}

          <div className="booking-nav">
            <button className="booking-back" onClick={goBack} disabled={currentStep === 0}><span className="chev chev-left"><NavIcon.chevronDown /></span> Back</button>
            <div className="booking-dots">
              {steps.map((s, i) => (
                <button key={s.key} className={i === currentStep ? "dot active" : i < currentStep ? "dot filled" : "dot"} onClick={() => setCurrentStep(i)} aria-label={s.label} />
              ))}
            </div>
            <div className="booking-nav-right">
              {!stepHasSelection && (
                <button className="booking-skip" onClick={skipStep}>Skip this section</button>
              )}
              <button className="booking-next" onClick={goNext} disabled={!stepHasSelection}>
                {nextLabel} <span className="chev chev-right"><NavIcon.chevronDown /></span>
              </button>
            </div>
          </div>
        </main>

        <aside className="booking-summary">
          <div className="booking-trip-card">
            <button className="booking-trip-head" onClick={() => setTripMenuOpen((v) => !v)}>
              <span className="booking-trip-icon"><NavIcon.location /></span>
              <span className="booking-trip-info">
                <strong>{tripName} Trip</strong>
                <em>{searchDates} · {searchGuests}</em>
              </span>
              <span className={tripMenuOpen ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
            </button>
            {tripMenuOpen && (
              <div className="booking-trip-menu">
                {["Dubai Getaway", "London Business Visit", "New York City Trip"].map((t) => (
                  <button key={t} onClick={() => { setToast(`Switched to ${t}`); setTripMenuOpen(false); }}>{t}</button>
                ))}
              </div>
            )}
          </div>

          <div className="booking-progress">
            <span>{completedCount} of {steps.length} steps complete</span>
            <strong>{progressPct}%</strong>
          </div>
          <div className="booking-progress-bar"><span style={{ width: `${progressPct}%` }} /></div>

          <div className="booking-checklist">
            {steps.map((s, i) => {
              const Icon = NavIcon[s.icon];
              const isSkipped = skipped.has(s.key);
              const isDone = s.key === "pretrip" ? doneTasks.size === pretripTasks.length : !!selections[s.key];
              const chosen = s.key !== "pretrip" && selections[s.key]
                ? optionsByStep[s.key as keyof typeof optionsByStep].find((o) => o.id === selections[s.key])
                : null;
              return (
                <button key={s.key} className="checklist-row" onClick={() => setCurrentStep(i)}>
                  <span className={isDone ? "checklist-icon done" : isSkipped ? "checklist-icon skipped" : "checklist-icon"}><Icon /></span>
                  <span className="checklist-label">
                    <strong>{s.label} {getStepUnit(s.key) && <em>({getStepUnit(s.key)})</em>}</strong>
                    {chosen && <small>{chosen.title}</small>}
                    {isSkipped && !chosen && <small>Skipped</small>}
                    {s.key === "pretrip" && doneTasks.size > 0 && <small>{doneTasks.size}/{pretripTasks.length} done</small>}
                  </span>
                  <span className="checklist-value">{chosen ? formatINR(chosen.price) : "—"}</span>
                </button>
              );
            })}
          </div>

          <div className="booking-cost">
            {saved > 0 && (
              <div className="booking-cost-row">
                <span className="strike">{formatINR(total + saved)}</span>
                <span className="save-pill"><NavIcon.trendUp /> Save {formatINR(saved)}</span>
              </div>
            )}
            <div className="booking-total"><span>Total</span><strong>{formatINR(total)}</strong></div>
            {total > 0 && <p className="booking-per-person">≈ {formatINR(Math.round(total / 4))} per person</p>}
          </div>

          <button className="booking-continue" disabled={!stepHasSelection} onClick={goNext}>
            {currentStep === steps.length - 1 ? "Finish & Review Trip" : `Continue to ${steps[currentStep + 1].label}`} <span className="chev chev-right"><NavIcon.chevronDown /></span>
          </button>
          {!stepHasSelection && <button className="booking-skip-link" onClick={skipStep}>Skip this section for now</button>}
          <button className="booking-back-link" onClick={goBack} disabled={currentStep === 0}><span className="chev chev-left"><NavIcon.chevronDown /></span> Back</button>

          <div className="booking-trust">
            <span><NavIcon.lock /> Secure</span>
            <span><NavIcon.shield /> Protected</span>
            <span><NavIcon.reset /> Refundable</span>
          </div>
        </aside>
      </div>

      {activeTaskId && (() => {
        const task = pretripTasks.find((t) => t.id === activeTaskId);
        if (!task) return null;
        const isDone = doneTasks.has(task.id);
        const TaskIcon = NavIcon[task.icon as keyof typeof NavIcon] ?? NavIcon.info;
        return (
          <div className="task-modal-overlay" onClick={() => setActiveTaskId(null)}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>
              <button className="task-modal-close" aria-label="Close" onClick={() => setActiveTaskId(null)}><NavIcon.close /></button>
              <div className="task-modal-head">
                <span className="task-modal-icon" style={{ background: task.color }}><TaskIcon /></span>
                <div>
                  <div className="task-modal-title-row">
                    <h3>{task.title}</h3>
                    {task.aiTip && <span className="ai-tip-badge"><NavIcon.sparkle /> AI Tip</span>}
                  </div>
                  <span className="pretrip-category">{task.category}</span>
                </div>
              </div>
              <p className="task-modal-desc">{task.desc}</p>
              <p className="task-modal-label">Checklist</p>
              <ul className="task-modal-steps">
                {task.steps.map((s) => <li key={s}><NavIcon.check /> {s}</li>)}
              </ul>
              <div className="task-modal-actions">
                <button
                  className={isDone ? "task-modal-done active" : "task-modal-done"}
                  onClick={() => { toggleTask(task.id); setActiveTaskId(null); }}
                >
                  <NavIcon.check /> {isDone ? "Marked complete" : "Mark as complete"}
                </button>
                <button className="task-modal-skip" onClick={() => { setToast(`${task.title} skipped`); setActiveTaskId(null); }}>Skip for now</button>
              </div>
            </div>
          </div>
        );
      })()}

      {compareOpen && (
        <div className="compare-modal-overlay" onClick={() => setCompareOpen(false)}>
          <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-head">
              <h3><NavIcon.barChart /> Comparing {step.label}</h3>
              <button aria-label="Close" onClick={() => setCompareOpen(false)}><NavIcon.close /></button>
            </div>
            <div className="compare-table" style={{ gridTemplateColumns: `140px repeat(${currentCompareOptions.length}, 1fr)` }}>
              <div className="compare-row compare-row-head">
                <span></span>
                {currentCompareOptions.map((opt) => (
                  <div key={opt.id} className="compare-col-head">
                    <div className="compare-col-media" style={opt.image ? { backgroundImage: `url(/images/${opt.image})` } : { background: opt.gradient ?? "linear-gradient(135deg,#e6e9f0,#cfd6e6)" }} />
                    <strong>{opt.title}</strong>
                  </div>
                ))}
              </div>
              <div className="compare-row">
                <span>Price</span>
                {currentCompareOptions.map((opt) => <strong key={opt.id}>{formatPriceString(opt.priceLabel)}</strong>)}
              </div>
              <div className="compare-row">
                <span>Rating</span>
                {currentCompareOptions.map((opt) => <span key={opt.id}>{opt.rating ? <><NavIcon.star /> {opt.rating} ({opt.reviews})</> : "—"}</span>)}
              </div>
              <div className="compare-row">
                <span>Policy</span>
                {currentCompareOptions.map((opt) => <span key={opt.id} className={opt.policy?.kind === "good" ? "compare-good" : "compare-warn"}>{opt.policy?.text ?? "—"}</span>)}
              </div>
              <div className="compare-row compare-row-included">
                <span>Included</span>
                {currentCompareOptions.map((opt) => (
                  <ul key={opt.id}>
                    {opt.included.map((li) => <li key={li}><NavIcon.check /> {li}</li>)}
                  </ul>
                ))}
              </div>
              <div className="compare-row">
                <span></span>
                {currentCompareOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={selections[step.key] === opt.id ? "compare-select-btn selected" : "compare-select-btn"}
                    onClick={() => { selectOption(step.key, opt.id); setCompareOpen(false); }}
                  >
                    {selections[step.key] === opt.id ? <><NavIcon.check /> Selected</> : "Select this"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
