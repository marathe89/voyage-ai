export interface ItineraryDayTemplate {
  label: string;
  activities: string[];
}

export interface ItineraryTemplate {
  key: string;
  title: string;
  destination: string;
  days: ItineraryDayTemplate[];
  note?: string;
}

export const itineraryTemplates: Record<string, ItineraryTemplate> = {
  santorini: {
    key: "santorini", title: "Santorini Highlights", destination: "Santorini, Greece",
    days: [
      { label: "Day 1 — Arrival & Oia", activities: ["Check in to a caldera-view suite in Oia", "Sunset walk along the Oia castle path", "Dinner with caldera views at a cliffside taverna"] },
      { label: "Day 2 — History & Wine", activities: ["Explore the Akrotiri archaeological site", "Wine tasting at a Santo Wines vineyard", "Stroll through Fira's whitewashed lanes"] },
      { label: "Day 3 — Sea & Sand", activities: ["Catamaran cruise around the caldera", "Swim stop at the volcanic hot springs", "Relax at Red Beach in the afternoon"] },
    ],
  },
  kyoto: {
    key: "kyoto", title: "Kyoto Highlights", destination: "Kyoto, Japan",
    days: [
      { label: "Day 1 — Arrival & Gion", activities: ["Check in near Gion district", "Sunset walk through Fushimi Inari's torii gates", "Evening stroll through the Gion geisha district"] },
      { label: "Day 2 — Temples & Bamboo", activities: ["Arashiyama Bamboo Grove at sunrise", "Visit Kinkaku-ji (Golden Pavilion)", "Traditional kaiseki dinner"] },
      { label: "Day 3 — Culture & Market", activities: ["Traditional tea ceremony experience", "Browse Nishiki Market for local snacks", "Nijo Castle and its gardens"] },
    ],
  },
  bali: {
    key: "bali", title: "Bali Highlights", destination: "Bali, Indonesia",
    days: [
      { label: "Day 1 — Ubud", activities: ["Check in to a jungle villa in Ubud", "Walk the Tegallalang rice terraces", "Visit the Sacred Monkey Forest"] },
      { label: "Day 2 — Temples & Sunset", activities: ["Uluwatu Temple clifftop visit", "Traditional Kecak fire dance at sunset", "Seafood dinner at Jimbaran Bay"] },
      { label: "Day 3 — Island Hopping", activities: ["Boat to Nusa Penida", "Snorkeling at Crystal Bay", "Sunset at Kelingking Beach viewpoint"] },
    ],
  },
  patagonia: {
    key: "patagonia", title: "Patagonia Highlights", destination: "Patagonia, Argentina",
    days: [
      { label: "Day 1 — Torres del Paine", activities: ["Arrive in Puerto Natales", "Guided trek to the Torres del Paine base", "Wildlife spotting — guanacos and condors"] },
      { label: "Day 2 — Glaciers", activities: ["Drive to Perito Moreno Glacier", "Glacier trekking with crampons", "Boat approach to the glacier face"] },
      { label: "Day 3 — El Chaltén", activities: ["Transfer to El Chaltén, Argentina's trekking capital", "Hike to the Laguna de los Tres viewpoint", "Craft beer and asado dinner"] },
    ],
  },
  "tokyo-kyoto": {
    key: "tokyo-kyoto", title: "Tokyo to Kyoto: 10-Day Cultural Odyssey", destination: "Tokyo & Kyoto, Japan",
    note: "Showing the first 3 of 10 days — the AI can generate the remaining 7 on request.",
    days: [
      { label: "Day 1 — Tokyo Arrival", activities: ["Check in near Shinjuku", "Explore Shibuya Crossing and Shibuya Sky", "Ramen dinner in Omoide Yokocho"] },
      { label: "Day 2 — Mount Fuji Day Trip", activities: ["Bullet train to Kawaguchiko", "Mt. Fuji 5th Station viewpoint", "Evening onsen soak with a Fuji view"] },
      { label: "Day 3 — Kyoto Temples", activities: ["Shinkansen to Kyoto", "Fushimi Inari torii gate hike", "Tea ceremony in Gion"] },
    ],
  },
  mediterranean: {
    key: "mediterranean", title: "Mediterranean Gems: Greece & Italy", destination: "Greece & Italy",
    note: "Showing the first 3 of 14 days — the AI can generate the remaining days on request.",
    days: [
      { label: "Day 1 — Athens", activities: ["Sunrise visit to the Acropolis", "Explore the Plaka neighborhood", "Rooftop dinner with Parthenon views"] },
      { label: "Day 2 — Santorini", activities: ["Ferry to Santorini", "Caldera sunset in Oia", "Wine tasting at a local vineyard"] },
      { label: "Day 3 — Rome", activities: ["Flight to Rome", "Colosseum and Roman Forum tour", "Pasta-making class in Trastevere"] },
    ],
  },
  lombok: {
    key: "lombok", title: "Bali & Lombok: Island Soul Journey", destination: "Bali & Lombok, Indonesia",
    note: "Showing the first 3 of 8 days — the AI can generate the remaining days on request.",
    days: [
      { label: "Day 1 — Bali Beach Club", activities: ["Check in near Seminyak", "Afternoon at a beach club", "Sunset cocktails on the sand"] },
      { label: "Day 2 — Rice Terraces", activities: ["Sunrise at Tegallalang rice terraces", "Traditional Balinese cooking class", "Sacred Monkey Forest visit"] },
      { label: "Day 3 — Lombok Snorkeling", activities: ["Fast boat to Lombok's Gili Islands", "Snorkeling with sea turtles", "Beachside seafood dinner"] },
    ],
  },
};

export function findItineraryTemplate(nameOrTitle: string): ItineraryTemplate | null {
  const lower = nameOrTitle.toLowerCase();
  return Object.values(itineraryTemplates).find((t) => lower.includes(t.key) || t.destination.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase())) ?? null;
}
