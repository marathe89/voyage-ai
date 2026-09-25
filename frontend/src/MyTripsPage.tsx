import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";

type Status = "upcoming" | "completed" | "planning";

interface Trip {
  id: string;
  title: string;
  status: Status;
  image: string;
  price: string;
  dates: string;
  days: string;
  travelers: number;
  locations: string[];
  tasksDone: number;
  tasksTotal: number;
  highlights: string[];
}

const trips: Trip[] = [
  {
    id: "tokyo", title: "Tokyo Adventure", status: "upcoming", image: "dest-kyoto.png", price: "$4,820",
    dates: "Jul 15, 2026 – Jul 25, 2026", days: "10 days", travelers: 2,
    locations: ["Tokyo", "Nikko", "Kyoto"], tasksDone: 6, tasksTotal: 9,
    highlights: ["Shibuya crossing", "Mount Fuji day trip", "Nikko shrines"],
  },
  {
    id: "bali", title: "Bali Retreat", status: "completed", image: "dest-bali.png", price: "$1,920",
    dates: "May 10, 2026 – May 18, 2026", days: "8 days", travelers: 1,
    locations: ["Ubud", "Seminyak", "Nusa Penida"], tasksDone: 8, tasksTotal: 8,
    highlights: ["Rice terrace sunrise", "Tanah Lot temple", "Surf lessons"],
  },
  {
    id: "med", title: "Mediterranean Dream", status: "planning", image: "dest-santorini.png", price: "$6,400",
    dates: "Sep 5, 2026 – Sep 19, 2026", days: "14 days", travelers: 2,
    locations: ["Athens", "Santorini", "Rome"], tasksDone: 2, tasksTotal: 12,
    highlights: ["Acropolis sunset", "Santorini caldera", "Vatican tour"],
  },
];

const statusMeta: Record<Status, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "mytrips-badge-upcoming" },
  completed: { label: "Completed", className: "mytrips-badge-completed" },
  planning: { label: "Planning", className: "mytrips-badge-planning" },
};

export function MyTripsPage() {
  const { openWidget } = useShell();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | Status>("all");

  function viewTrip(trip: Trip) {
    const days = trip.locations.map((loc, i) => ({
      label: `Day ${i + 1} — ${loc}`,
      activities: i === trip.locations.length - 1 ? trip.highlights.map((h, hi) => ({ id: `${trip.id}-h-${hi}`, text: h })) : [],
    }));
    navigate("/concierge", {
      state: {
        initialPrompt: `Show me the itinerary for my "${trip.title}" trip (${trip.locations.join(" → ")}), ${trip.dates}, ${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}.`,
        customItinerary: { title: trip.title, destination: trip.locations.join(" → "), days },
      },
    });
  }

  const counts = {
    upcoming: trips.filter((t) => t.status === "upcoming").length,
    completed: trips.filter((t) => t.status === "completed").length,
    planning: trips.filter((t) => t.status === "planning").length,
  };
  const filtered = filter === "all" ? trips : trips.filter((t) => t.status === filter);

  return (
    <div className="mytrips-page">
      <div className="mytrips-header">
        <div>
          <h1>My Trips</h1>
          <p>Manage all your journeys in one place.</p>
        </div>
        <button className="dash-btn-primary" onClick={() => openWidget()}><span>+</span> New Trip</button>
      </div>

      <div className="mytrips-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({trips.length})</button>
        <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>Upcoming</button>
        <button className={filter === "planning" ? "active" : ""} onClick={() => setFilter("planning")}>Planning</button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>
      </div>

      <div className="mytrips-grid">
        {filtered.map((trip) => {
          const pct = Math.round((trip.tasksDone / trip.tasksTotal) * 100);
          const meta = statusMeta[trip.status];
          return (
            <article key={trip.id} className="mytrips-card">
              <div className="mytrips-card-img" style={{ backgroundImage: `url(/images/${trip.image})` }}>
                <span className={meta.className}>{meta.label}</span>
                <strong className="mytrips-card-price">{trip.price}</strong>
              </div>
              <div className="mytrips-card-body">
                <strong className="mytrips-card-title">{trip.title}</strong>
                <div className="mytrips-card-meta">
                  <span><NavIcon.calendar /> {trip.dates}</span>
                  <span><NavIcon.clock /> {trip.days}</span>
                  <span><NavIcon.guests /> {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</span>
                </div>
                <div className="mytrips-card-locations">
                  {trip.locations.map((l) => <span key={l}><NavIcon.location /> {l}</span>)}
                </div>
                <div className="mytrips-card-progress">
                  <span>Planning progress</span>
                  <span>{trip.tasksDone}/{trip.tasksTotal} tasks</span>
                </div>
                <div className="booking-progress-bar mytrips-progress-bar"><span style={{ width: `${pct}%` }} /></div>
                <div className="mytrips-card-highlights">
                  {trip.highlights.slice(0, 2).map((h) => <span key={h}>{h}</span>)}
                  {trip.highlights.length > 2 && <em>+{trip.highlights.length - 2}</em>}
                </div>
                <button className="mytrips-view-link" onClick={() => viewTrip(trip)}>View Trip <NavIcon.chevronRight /></button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <p className="discover-empty">No trips in this category yet.</p>}
      </div>

      <div className="mytrips-ai-banner">
        <h3><NavIcon.sparkle /> AI Travel Suggestion</h3>
        <p>Based on your travel history, you'd love <strong>Patagonia, Argentina</strong> next — combining the adventure of your Bali trip with the cultural richness you loved in Tokyo.</p>
        <button className="dash-btn-primary" onClick={() => openWidget("Plan a trip to Patagonia, Argentina")}><NavIcon.sparkle /> Plan Patagonia Trip</button>
      </div>
    </div>
  );
}
