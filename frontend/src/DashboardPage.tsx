import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { findItineraryTemplate } from "./itineraryTemplates";
import { ShareButton } from "./ShareButton";

const stats = [
  { label: "Total Trips", value: "12", icon: "plane", color: "#3c7ef2", path: "/my-trips" },
  { label: "Countries", value: "8", icon: "globe", color: "#2fa8a3", path: "/discover" },
  { label: "Miles Flown", value: "84,200", icon: "trendUp", color: "#4bb383" },
  { label: "Total Spent", value: "$18,400", icon: "dollar", color: "#e5a13c", path: "/wallet" },
  { label: "Nights Stayed", value: "94", icon: "hotel", color: "#9c6fe0", path: "/my-trips" },
  { label: "AI Hours Saved", value: "62h", icon: "sparkle", color: "#e0688f" },
];

const insights = [
  { icon: "trendUp", color: "#4bb383", bg: "#e8f7ef", text: "Flights to Tokyo are 12% cheaper on Tuesdays — Oct 8 still available at $11,200.", action: "Check Now" },
  { icon: "bell", color: "#3c7ef2", bg: "#eaf0ff", text: "Online check-in for AI 302 opens in 3 days. Book window seats 12A–D now.", action: "Check In" },
  { icon: "star", color: "#e5a13c", bg: "#fdf3e2", text: "You have 48,200 Marriott points — enough for 2 free nights in Kyoto.", action: "Redeem" },
];

interface Trip {
  id: string;
  title: string;
  route: string;
  image: string;
  status: "upcoming" | "completed";
  badge: string;
  dates: string;
  travelers: number;
  price: string;
  tasksComplete?: number;
  tasksTotal?: number;
  next?: string;
  tags: string[];
}

const trips: Trip[] = [
  { id: "japan", title: "Japan Family Adventure", route: "Tokyo → Hakone → Kyoto", image: "itin-tokyo.png", status: "upcoming", badge: "in 26 days", dates: "Oct 10, 2026 – Oct 20, 2026", travelers: 4, price: "$394,000", tasksComplete: 9, tasksTotal: 12, next: "Complete online check-in", tags: ["Mt. Fuji hike", "Onsen spa", "Tea ceremony"] },
  { id: "bali", title: "Bali Wellness Retreat", route: "Ubud → Seminyak → Nusa Penida", image: "dest-bali.png", status: "completed", badge: "4.9", dates: "May 10, 2026 – May 18, 2026", travelers: 1, price: "$96,000", tags: ["Rice terrace sunrise", "Tanah Lot", "Surf lessons"] },
  { id: "med", title: "Mediterranean Dream", route: "Athens → Santorini → Rome", image: "dest-santorini.png", status: "upcoming", badge: "in 82 days", dates: "Sep 5, 2026 – Sep 19, 2026", travelers: 2, price: "$320,000", tasksComplete: 4, tasksTotal: 11, next: "Book Santorini hotel", tags: ["Acropolis", "Santorini caldera", "Vatican"] },
  { id: "paris", title: "Paris Weekend Escape", route: "Paris", image: "dest-paris.jpg", status: "completed", badge: "4.7", dates: "Mar 14, 2026 – Mar 17, 2026", travelers: 2, price: "$142,000", tags: ["Eiffel Tower", "Louvre", "Seine cruise"] },
  { id: "maldives", title: "Maldives Honeymoon", route: "North Male Atoll → Baa Atoll", image: "dest-maldives.png", status: "upcoming", badge: "in 157 days", dates: "Dec 20, 2026 – Dec 27, 2026", travelers: 2, price: "$520,000", tasksComplete: 2, tasksTotal: 13, next: "Add travel insurance", tags: [] },
];

const transactions = [
  { title: "Japan Trip – Flights", date: "Jun 2", amount: "$52,400", credit: false, icon: "plane" },
  { title: "Japan Trip – Hotels", date: "Jun 2", amount: "$55,200", credit: false, icon: "hotel" },
  { title: "Bali Refund (cancel)", date: "Jun 1", amount: "+$8,400", credit: true, icon: "reset" },
  { title: "Maldives – Deposit", date: "May 30", amount: "$52,000", credit: false, icon: "creditCard" },
];

const loyaltyPrograms = [
  { name: "Air India", tier: "Gold", pts: "24,600 pts", pct: 58, icon: "plane" as const, color: "#3c7ef2" },
  { name: "Marriott", tier: "Platinum", pts: "48,200 pts", pct: 84, icon: "hotel" as const, color: "#9c6fe0" },
  { name: "Hilton", tier: "Diamond", pts: "82,000 pts", pct: 96, icon: "hotel" as const, color: "#2fa8a3" },
  { name: "SQ Miles", tier: "Silver", pts: "12,400 pts", pct: 28, icon: "plane" as const, color: "#8892a6" },
];

const savedItineraries = [
  { title: "Tokyo to Kyoto: 10-Day Cultural", days: "10 days", price: "$2,450/person", match: 97, saved: "Jun 10", image: "itin-tokyo.png" },
  { title: "Bali & Lombok: Island Soul", days: "8 days", price: "$1,190/person", match: 93, saved: "May 28", image: "itin-lombok.png" },
  { title: "Patagonia Trekking Circuit", days: "14 days", price: "$2,100/person", match: 91, saved: "May 20", image: "dest-patagonia.png" },
];

export function DashboardPage() {
  const { setToast, openWidget } = useShell();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const upcomingCount = trips.filter((t) => t.status === "upcoming").length;
  const completedCount = trips.filter((t) => t.status === "completed").length;
  const filteredTrips = filter === "all" ? trips : trips.filter((t) => t.status === filter);

  function rebookTrip(trip: Trip) {
    const legs = trip.route.split("→").map((s) => s.trim()).filter(Boolean);
    const days = legs.map((leg, i) => ({
      label: `Day ${i + 1} — ${leg}`,
      activities: i === legs.length - 1 && trip.tags.length
        ? trip.tags.map((tag, ti) => ({ id: `${trip.id}-tag-${ti}`, text: tag }))
        : [],
    }));
    navigate("/concierge", {
      state: {
        initialPrompt: `Rebook my trip "${trip.title}" (${trip.route}), ${trip.dates}, ${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}, budget ${trip.price}. What are the best alternatives?`,
        customItinerary: { title: trip.title, destination: trip.route, days },
      },
    });
  }

  function tripShareLink(trip: Trip) {
    return `https://voyageai.app/trip/${trip.id}`;
  }

  function openSavedItinerary(title: string) {
    const tpl = findItineraryTemplate(title);
    if (!tpl) {
      openWidget(`Show me the "${title}" itinerary`);
      return;
    }
    navigate("/concierge", {
      state: {
        initialPrompt: `Show me the itinerary for "${title}"`,
        customItinerary: {
          title: tpl.title,
          destination: tpl.destination,
          note: tpl.note,
          days: tpl.days.map((d, di) => ({ label: d.label, activities: d.activities.map((a, ai) => ({ id: `${di}-${ai}`, text: a })) })),
        },
      },
    });
  }

  function downloadTrip(trip: Trip) {
    const lines = [
      trip.title,
      trip.route,
      `Dates: ${trip.dates}`,
      `Travelers: ${trip.travelers}`,
      `Total: ${trip.price}`,
      trip.tags.length ? `Highlights: ${trip.tags.join(", ")}` : "",
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.title.replace(/[^a-z0-9]+/gi, "-")}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Downloaded ${trip.title} itinerary`);
  }

  return (
    <div className="dash-page">
      <section className="dash-hero">
        <div className="dash-hero-top">
          <div>
            <p className="dash-greeting"><NavIcon.sun /> Good morning</p>
            <h1>Trip Dashboard</h1>
            <p className="dash-sub">{upcomingCount} upcoming · {completedCount} completed · Next trip in <strong>26 days</strong></p>
          </div>
          <div className="dash-hero-actions">
            <button className="dash-btn-ghost" onClick={() => openWidget()}><span>+</span> Plan New Trip</button>
          </div>
        </div>
        <div className="dash-stats">
          {stats.map((s) => {
            const Icon = NavIcon[s.icon as keyof typeof NavIcon];
            return (
              <button
                key={s.label}
                className="dash-stat-card"
                onClick={() => (s.path ? navigate(s.path) : setToast(`${s.value} ${s.label.toLowerCase()} — keep it up!`))}
              >
                <span className="dash-stat-icon" style={{ background: `${s.color}22`, color: s.color }}><Icon /></span>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="dash-layout">
        <main className="dash-main">
          <div className="dash-insights">
            <div className="dash-card-head">
              <h3><NavIcon.sparkle /> AI Insights for You</h3>
              <span className="dash-new-badge">3 new</span>
            </div>
            {insights.map((ins) => {
              const Icon = NavIcon[ins.icon as keyof typeof NavIcon];
              return (
                <div key={ins.text} className="dash-insight-row">
                  <span className="dash-insight-icon" style={{ background: ins.bg, color: ins.color }}><Icon /></span>
                  <p>{ins.text}</p>
                  <button onClick={() => { setToast(ins.action); openWidget(ins.text); }}>{ins.action}</button>
                </div>
              );
            })}
          </div>

          <div className="dash-trips-head">
            <h2>My Trips</h2>
            <div className="dash-filters">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({trips.length})</button>
              <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>Upcoming ({upcomingCount})</button>
              <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed ({completedCount})</button>
            </div>
          </div>

          <div className="dash-trip-grid">
            {filteredTrips.map((trip) => (
              <article
                key={trip.id}
                className="dash-trip-card clickable"
                onClick={() => (trip.id === "japan" ? navigate("/itinerary") : openWidget(`Show me the itinerary for "${trip.title}"`))}
              >
                <div className="dash-trip-media" style={{ backgroundImage: `url(/images/${trip.image})` }}>
                  <span className={trip.status === "upcoming" ? "dash-trip-status upcoming" : "dash-trip-status completed"}><i /> {trip.status === "upcoming" ? "Upcoming" : "Completed"}</span>
                  {trip.status === "upcoming" ? (
                    <span className="dash-trip-when">{trip.badge}</span>
                  ) : (
                    <span className="dash-trip-rating"><NavIcon.star /> {trip.badge}</span>
                  )}
                </div>
                <div className="dash-trip-body">
                  <div className="dash-trip-title">
                    <strong>{trip.title}</strong>
                  </div>
                  <p className="dash-trip-route"><NavIcon.location /> {trip.route}</p>
                  <div className="dash-trip-meta">
                    <span><NavIcon.calendar /> {trip.dates}</span>
                    <span><NavIcon.guests /> {trip.travelers}</span>
                    <strong>{trip.price}</strong>
                  </div>
                  {trip.tasksTotal !== undefined && (
                    <>
                      <div className="dash-trip-progress-row">
                        <span>{trip.tasksComplete}/{trip.tasksTotal} tasks complete</span>
                        <strong>{Math.round(((trip.tasksComplete ?? 0) / trip.tasksTotal) * 100)}%</strong>
                      </div>
                      <div className="booking-progress-bar dash-trip-bar"><span style={{ width: `${Math.round(((trip.tasksComplete ?? 0) / trip.tasksTotal) * 100)}%` }} /></div>
                    </>
                  )}
                  {trip.next && <p className="dash-trip-next"><NavIcon.bell /> Next: {trip.next}</p>}
                  {trip.tags.length > 0 && (
                    <div className="dash-trip-tags">
                      {trip.tags.map((t) => <span key={t}>{t}</span>)}
                    </div>
                  )}
                  <div className="dash-trip-actions">
                    <button onClick={(e) => { e.stopPropagation(); rebookTrip(trip); }}><NavIcon.reset /> Rebook</button>
                    <ShareButton
                      title={trip.title}
                      text={`${trip.title} — ${trip.route} · ${trip.dates}`}
                      link={tripShareLink(trip)}
                      label="Share"
                      wrapClassName="dash-trip-share-wrap"
                    />
                    <button onClick={(e) => { e.stopPropagation(); downloadTrip(trip); }}><NavIcon.download /> Download</button>
                    <button onClick={(e) => { e.stopPropagation(); openWidget(`Help with my trip: ${trip.title}`); }}><NavIcon.chat /> Contact</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button className="dash-plan-new" onClick={() => openWidget()}><NavIcon.sparkle /> Plan a new trip with AI</button>
        </main>

        <aside className="dash-sidebar">
          <div className="dash-wallet">
            <div className="dash-wallet-hero">
              <div className="dash-wallet-head">
                <span><NavIcon.creditCard /> VoyageAI Wallet</span>
                <span className="dash-wallet-coins"><i /><i /></span>
              </div>
              <strong className="dash-wallet-balance">$284,000</strong>
              <span className="dash-wallet-label">Available balance</span>
              <div className="dash-wallet-split">
                <div><span>Spent this year</span><strong>$394,600</strong></div>
                <div><span>AI savings</span><strong className="green">+$17,900</strong></div>
              </div>
            </div>
            <div className="dash-wallet-body">
              <p className="dash-txn-head">Recent Transactions</p>
              <div className="dash-wallet-txns">
                {transactions.map((t) => {
                  const Icon = NavIcon[t.icon as keyof typeof NavIcon];
                  return (
                    <div key={t.title} className="dash-txn-row">
                      <span className="dash-txn-icon"><Icon /></span>
                      <span className="dash-txn-info"><strong>{t.title}</strong><em>{t.date}</em></span>
                      <span className={t.credit ? "dash-txn-amount green" : "dash-txn-amount"}>{t.credit ? "" : "-"}{t.amount}</span>
                    </div>
                  );
                })}
              </div>
              <button className="dash-wallet-link" onClick={() => navigate("/wallet")}>View full wallet <span className="chev chev-right"><NavIcon.chevronDown /></span></button>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3><NavIcon.award /> Loyalty Rewards</h3>
              <button className="dash-redeem-link" onClick={() => setToast("Opening rewards redemption")}>Redeem</button>
            </div>
            <p className="dash-loyalty-total">Total value: ≈$2,006</p>
            {loyaltyPrograms.map((p) => {
              const Icon = NavIcon[p.icon];
              return (
                <button key={p.name} className="dash-loyalty-row" onClick={() => navigate("/wallet")}>
                  <span className="dash-loyalty-icon" style={{ background: `${p.color}1a`, color: p.color }}><Icon /></span>
                  <div className="dash-loyalty-info">
                    <div className="dash-loyalty-top"><strong>{p.name}</strong><span className="dash-loyalty-tier">{p.tier}</span><em>{p.pts}</em></div>
                    <div className="booking-progress-bar dash-loyalty-bar"><span style={{ width: `${p.pct}%` }} /></div>
                  </div>
                </button>
              );
            })}
            <div className="dash-loyalty-highlight a11y-decorative">
              <span className="dash-loyalty-gift"><NavIcon.package /></span>
              <div><strong>Marriott: 1,800 pts to Titanium</strong><em>1 more stay unlocks the next tier</em></div>
              <button onClick={() => { setToast("Booking a qualifying stay"); openWidget("Find a Marriott stay to reach Titanium status"); }}>Book</button>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3><NavIcon.bookmark /> Saved Itineraries</h3>
              <button className="dash-redeem-link" onClick={() => setToast("New itinerary builder coming soon")}>New +</button>
            </div>
            <p className="dash-saved-sub">3 AI-crafted plans</p>
            {savedItineraries.map((it) => (
              <div key={it.title} className="dash-saved-row" role="button" tabIndex={0} onClick={() => openSavedItinerary(it.title)} onKeyDown={(e) => { if (e.key === "Enter") openSavedItinerary(it.title); }}>
                <span className="dash-saved-thumb" style={{ backgroundImage: `url(/images/${it.image})` }} />
                <span className="dash-saved-info">
                  <strong>{it.title}</strong>
                  <em>{it.days} · {it.price}</em>
                  <span className="dash-saved-match"><NavIcon.sparkle /> {it.match}% match · Saved {it.saved}</span>
                </span>
                <span className="dash-saved-actions">
                  <button
                    className="dash-saved-download"
                    aria-label={`Download ${it.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const tpl = findItineraryTemplate(it.title);
                      const lines = [it.title, tpl?.destination ?? "", `${it.days} · ${it.price}`, ...(tpl?.days.flatMap((d) => [d.label, ...d.activities.map((a) => `  - ${a}`)]) ?? [])].filter(Boolean);
                      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${it.title.replace(/[^a-z0-9]+/gi, "-")}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setToast(`Downloaded "${it.title}" itinerary`);
                    }}
                  ><NavIcon.download /></button>
                  <span className="dash-saved-go"><NavIcon.chevronRight /></span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
