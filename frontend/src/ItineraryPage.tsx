import { useState } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { ShareButton } from "./ShareButton";
import { CurrencyConverter, useCurrency } from "./currency";

type Category = "flight" | "hotel" | "transport" | "food" | "activity" | "photo" | "spa" | "shopping";

interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  duration: string;
  price?: string;
  rating?: number;
  category: Category;
  desc: string;
  confirmed: boolean;
  aiSuggested?: boolean;
  avatars?: string[];
}

interface Period {
  key: "morning" | "afternoon" | "evening";
  label: string;
  window: string;
  activities: Activity[];
}

interface Day {
  day: number;
  title: string;
  date: string;
  periods: Period[];
}

const categoryMeta: Record<Category, { icon: keyof typeof NavIcon; color: string }> = {
  flight: { icon: "plane", color: "#3c7ef2" },
  hotel: { icon: "hotel", color: "#9c6fe0" },
  transport: { icon: "transport", color: "#2fa8a3" },
  food: { icon: "dining", color: "#e5a13c" },
  activity: { icon: "activity", color: "#4bb383" },
  photo: { icon: "camera", color: "#ef6f8e" },
  spa: { icon: "wellness", color: "#16b8b0" },
  shopping: { icon: "package", color: "#e0688f" },
};

const days: Day[] = [
  {
    day: 1, title: "Mumbai → Tokyo", date: "Oct 10, 2026",
    periods: [
      { key: "morning", label: "Morning", window: "6 AM – 12 PM", activities: [] },
      { key: "afternoon", label: "Afternoon", window: "12 PM – 6 PM", activities: [
        { id: "d1-1", time: "08:30", title: "Check-in at Narita, Immigration & Customs", location: "Narita Airport, Tokyo", duration: "2 h", price: "Free", category: "transport", desc: "AI 302 lands 08:30. Immigration queue ~45 min. JR Pass activation at airport counter.", confirmed: true },
        { id: "d1-2", time: "10:15", title: "Narita Express to Shinjuku", location: "Narita Station", duration: "1 h 15 m", price: "$1,800", category: "transport", desc: "Included in JR Pass combo. Platform 1, Track B.", confirmed: true },
      ]},
      { key: "evening", label: "Evening", window: "6 PM – 12 AM", activities: [
        { id: "d1-3", time: "15:00", title: "Check-in: Andaz Tokyo Toranomon Hills", location: "Minato, Tokyo", duration: "30 m", price: "$18,400/night", category: "hotel", desc: "Early check-in requested. Corner suite on 47F.", confirmed: true },
        { id: "d1-4", time: "19:00", title: "Dinner at Gonpachi Shibuya", location: "Shibuya, Tokyo", duration: "2 h", price: "$4,200/family", rating: 4.8, category: "food", desc: "The restaurant that inspired Kill Bill's fight scene. Book table 19:00.", confirmed: false, aiSuggested: true },
      ]},
    ],
  },
  {
    day: 2, title: "Tokyo", date: "Oct 11, 2026",
    periods: [
      { key: "morning", label: "Morning", window: "6 AM – 12 PM", activities: [
        { id: "d2-1", time: "06:30", title: "Tsukiji Fish Market Breakfast Tour", location: "Tsukiji, Tokyo", duration: "2 h", price: "$2,400/family", rating: 4.7, category: "food", desc: "Arrive before 7 AM for tuna auction view. Try tamagoyaki & sushi.", confirmed: true, avatars: ["avatar-sarah.png"] },
        { id: "d2-2", time: "09:30", title: "Shibuya Sky Observatory", location: "Scramble Square, Shibuya", duration: "1.5 h", price: "$1,800/adult", rating: 4.9, category: "activity", desc: "Pre-book 10:00 slot. Outdoor rooftop on 45F. Best for photos.", confirmed: true },
      ]},
      { key: "afternoon", label: "Afternoon", window: "12 PM – 6 PM", activities: [
        { id: "d2-3", time: "12:00", title: "Harajuku Takeshita Street Walk", location: "Harajuku, Tokyo", duration: "2 h", price: "$1,500/shopping", category: "shopping", desc: "Kids love the crepes & candy. Meiji Shrine just north — worth a 30-min detour.", confirmed: true },
        { id: "d2-4", time: "14:30", title: "TeamLab Borderless Digital Art Museum", location: "Odaiba, Tokyo", duration: "3 h", price: "$3,200/adult", rating: 4.9, category: "activity", desc: "Pre-book! Immersive art experience. Best for 2–3 hrs.", confirmed: false, aiSuggested: true, avatars: ["avatar-james.png"] },
      ]},
      { key: "evening", label: "Evening", window: "6 PM – 12 AM", activities: [
        { id: "d2-5", time: "19:30", title: "Shinjuku Golden Gai Evening Walk", location: "Shinjuku, Tokyo", duration: "2 h", price: "$2,000", category: "activity", desc: "6 narrow alleys with 200+ tiny bars. Each seats ~6 people. Amazing atmosphere.", confirmed: false, aiSuggested: true },
      ]},
    ],
  },
  {
    day: 3, title: "Tokyo → Hakone", date: "Oct 12, 2026",
    periods: [
      { key: "morning", label: "Morning", window: "6 AM – 12 PM", activities: [
        { id: "d3-1", time: "09:00", title: "Checkout & Shinkansen to Odawara", location: "Tokyo → Odawara (Hakone)", duration: "35 m", price: "$2,200 (JR Pass)", category: "transport", desc: "09:15 Kodama from Shinjuku. Connect to Hakone Tozan Railway.", confirmed: true },
      ]},
      { key: "afternoon", label: "Afternoon", window: "12 PM – 6 PM", activities: [
        { id: "d3-2", time: "13:00", title: "Mt. Fuji 5th Station Guided Hike", location: "Fuji Five Lakes, Hakone", duration: "6 h", price: "$4,200/person", rating: 4.8, category: "activity", desc: "Guide meets at Lake Kawaguchiko bus terminal. Bring layers — 14°C at summit.", confirmed: true, avatars: ["avatar-marcus.png"] },
      ]},
      { key: "evening", label: "Evening", window: "6 PM – 12 AM", activities: [
        { id: "d3-3", time: "17:00", title: "Check-in: Hakone Ginyu Ryokan", location: "Hakone, Kanagawa", duration: "30 m", price: "$22,000/night", category: "hotel", desc: "Traditional Japanese inn. Yukata provided. Mt. Fuji view from room.", confirmed: true },
        { id: "d3-4", time: "19:00", title: "Private Rotenburo Onsen (Outdoor Hot Spring)", location: "Hakone Ginyu, Hakone", duration: "1.5 h", price: "Included", rating: 5.0, category: "spa", desc: "Book private rotenburo at 19:00 — best slot for Mt. Fuji sunset view.", confirmed: true },
      ]},
    ],
  },
  {
    day: 4, title: "Hakone → Kyoto", date: "Oct 13, 2026",
    periods: [
      { key: "morning", label: "Morning", window: "6 AM – 12 PM", activities: [
        { id: "d4-1", time: "09:00", title: "Hakone Open Air Museum", location: "Ninotaira, Hakone", duration: "2 h", price: "$1,600/adult", category: "photo", desc: "Outdoor sculpture park. Incredible Mt. Fuji backdrop. Kids love the Picasso pavilion.", confirmed: true },
      ]},
      { key: "afternoon", label: "Afternoon", window: "12 PM – 6 PM", activities: [
        { id: "d4-2", time: "12:30", title: "Romancecar Express to Shinjuku", location: "Hakone-Yumoto → Shinjuku", duration: "1 h 30 m", price: "$2,400 (JR Pass)", category: "transport", desc: "12:30 departure. Scenic mountain views.", confirmed: true },
        { id: "d4-3", time: "14:30", title: "Shinkansen to Kyoto (Nozomi)", location: "Tokyo → Kyoto", duration: "2 h 15 m", price: "$4,200 (JR Pass)", category: "transport", desc: "14:30 Nozomi from Tokyo Station. Mt. Fuji visible on right side.", confirmed: true },
      ]},
      { key: "evening", label: "Evening", window: "6 PM – 12 AM", activities: [
        { id: "d4-4", time: "17:00", title: "Check-in: The Thousand Kyoto", location: "Shimogyo, Kyoto", duration: "30 m", price: "$15,600/night", category: "hotel", desc: "5-star contemporary hotel. 2-min walk from Kyoto Station.", confirmed: true },
      ]},
    ],
  },
  {
    day: 5, title: "Kyoto", date: "Oct 14, 2026",
    periods: [
      { key: "morning", label: "Morning", window: "6 AM – 12 PM", activities: [
        { id: "d5-1", time: "06:00", title: "Arashiyama Bamboo Grove (Sunrise Visit)", location: "Arashiyama, Kyoto", duration: "2 h", price: "Free", rating: 4.7, category: "photo", desc: "Go before 7 AM — crowd-free and magical in early mist.", confirmed: true },
        { id: "d5-2", time: "09:00", title: "Traditional Tea Ceremony – Urasenke", location: "Kamigyo, Kyoto", duration: "1.5 h", price: "$3,500/person", rating: 4.9, category: "activity", desc: "Private session for family. Kimono fitting included. Book in advance.", confirmed: true },
      ]},
      { key: "afternoon", label: "Afternoon", window: "12 PM – 6 PM", activities: [
        { id: "d5-3", time: "13:00", title: "Fushimi Inari Shrine Walk", location: "Fushimi, Kyoto", duration: "3 h", price: "Free", rating: 4.8, category: "activity", desc: "10,000 orange torii gates. Hike to Yotsutsuji viewpoint (~90 min up). Start at 13:00.", confirmed: true },
      ]},
      { key: "evening", label: "Evening", window: "6 PM – 12 AM", activities: [
        { id: "d5-4", time: "19:00", title: "Gion District Dinner – Kaiseki Cuisine", location: "Gion, Kyoto", duration: "2 h 30 m", price: "$8,000/person", rating: 4.8, category: "food", desc: "Multi-course traditional dinner. Reservation essential. Dress code: smart casual.", confirmed: false, aiSuggested: true },
      ]},
    ],
  },
];

const budgetItems: { label: string; amount: number; color: string; icon: keyof typeof NavIcon }[] = [
  { label: "Flights", amount: 52400, color: "#3c7ef2", icon: "plane" },
  { label: "Hotels", amount: 276000, color: "#9c6fe0", icon: "hotel" },
  { label: "Activities", amount: 47600, color: "#4bb383", icon: "activity" },
  { label: "Food", amount: 18000, color: "#e5a13c", icon: "dining" },
];
const budgetTotal = budgetItems.reduce((s, b) => s + b.amount, 0);
const budgetCap = 400000;

const activityTypeFilters: { key: Category; label: string }[] = [
  { key: "flight", label: "Flight" },
  { key: "hotel", label: "Hotel" },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Food" },
  { key: "activity", label: "Activity" },
  { key: "photo", label: "Photo" },
  { key: "spa", label: "Spa" },
  { key: "shopping", label: "Shopping" },
];

export function ItineraryPage() {
  const { setToast, openWidget } = useShell();
  const { format, formatPriceString } = useCurrency();
  const [tripDays, setTripDays] = useState<Day[]>(() => structuredClone(days));
  const [expanded, setExpanded] = useState<Set<number>>(new Set(days.map((d) => d.day)));
  const [activeFilters, setActiveFilters] = useState<Set<Category>>(new Set());
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const allActivities = tripDays.flatMap((d) => d.periods.flatMap((p) => p.activities));
  const totalActivities = allActivities.length;
  const confirmedCount = allActivities.filter((a) => confirmedMap[a.id] ?? a.confirmed).length;

  function toggleDay(day: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
  }

  function toggleFilter(cat: Category) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function confirmActivity(a: Activity) {
    setConfirmedMap((prev) => ({ ...prev, [a.id]: true }));
    setToast(`Marked "${a.title}" as confirmed`);
  }

  function moveActivity(id: string, targetDay: number, targetPeriodKey: Period["key"], beforeId?: string) {
    setTripDays((prev) => {
      const next: Day[] = structuredClone(prev);
      let moved: Activity | undefined;
      for (const day of next) {
        for (const period of day.periods) {
          const idx = period.activities.findIndex((a) => a.id === id);
          if (idx !== -1) { moved = period.activities.splice(idx, 1)[0]; break; }
        }
        if (moved) break;
      }
      if (!moved) return prev;
      const targetDayObj = next.find((d) => d.day === targetDay);
      const targetPeriod = targetDayObj?.periods.find((p) => p.key === targetPeriodKey);
      if (!targetPeriod) return prev;
      const insertAt = beforeId ? targetPeriod.activities.findIndex((a) => a.id === beforeId) : -1;
      if (insertAt === -1) targetPeriod.activities.push(moved);
      else targetPeriod.activities.splice(insertAt, 0, moved);
      return next;
    });
  }

  function handleDrop(targetDay: number, targetPeriodKey: Period["key"], beforeId?: string) {
    if (!draggedId) return;
    moveActivity(draggedId, targetDay, targetPeriodKey, beforeId);
    setToast("Itinerary updated");
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="itin-page">
      <div className="itin-header">
        <div>
          <span className="itin-header-badge"><NavIcon.calendar /></span>
          <h1>Japan Family Trip</h1>
          <p>Oct 10–20, 2026 <span>·</span> <NavIcon.guests /> 4 travelers <span>·</span> <NavIcon.location /> 5 cities</p>
        </div>
        <div className="itin-header-actions">
          <button className="itin-btn-ai" onClick={() => { setToast("Optimizing itinerary with AI..."); openWidget("Optimize my Japan Family Trip itinerary"); }}><NavIcon.sparkle /> Optimize with AI</button>
          <ShareButton
            title="Japan Family Trip"
            text="Japan Family Trip — Oct 10–20, 2026 · 4 travelers · 5 cities"
            link="https://voyageai.app/itinerary/japan-family-trip"
            label="Share Trip"
            buttonClassName="dash-btn-ghost light"
          />
          <button className="dash-btn-ghost light" onClick={() => setToast("Exporting itinerary as PDF...")}><NavIcon.download /> Export PDF</button>
          <CurrencyConverter />
        </div>
      </div>

      <div className="itin-statbar">
        <div className="itin-stats-left">
          <span><NavIcon.calendar /> {days.length} Days</span>
          <span><NavIcon.list /> {totalActivities} activities</span>
          <span className="green"><NavIcon.check /> {confirmedCount} confirmed</span>
          <span><NavIcon.dollar /> {format(budgetTotal, { maximumFractionDigits: 0 })} est.</span>
        </div>
        <div className="itin-stats-right">
          <button onClick={() => setExpanded(new Set(days.map((d) => d.day)))}>Expand all</button>
          <span className="itin-divider" />
          <button onClick={() => setExpanded(new Set())}>Collapse all</button>
          <span className="itin-legend"><i className="dot confirmed" /> Confirmed</span>
          <span className="itin-legend"><i className="dot unconfirmed" /> Unconfirmed</span>
        </div>
      </div>

      <p className="itin-drag-hint"><NavIcon.sliders /> Drag activities to rearrange or move between time blocks</p>

      <div className="itin-layout">
        <main className="itin-main">
          {tripDays.map((day) => {
            const isOpen = expanded.has(day.day);
            const dayActivities = day.periods.flatMap((p) => p.activities);
            const unconfirmed = dayActivities.filter((a) => !(confirmedMap[a.id] ?? a.confirmed)).length;
            return (
              <section key={day.day} className="itin-day">
                <button className="itin-day-head" onClick={() => toggleDay(day.day)}>
                  <span className="itin-day-num">{day.day}</span>
                  <span className="itin-day-info">
                    <strong>{day.title}</strong>
                    <em><NavIcon.calendar /> {day.date} · {dayActivities.length} activities {unconfirmed > 0 && <span className="orange"> · {unconfirmed} unconfirmed</span>}</em>
                  </span>
                  <span className="itin-day-periods">
                    {day.periods.map((p) => (
                      <span key={p.key}>{p.label.slice(0, 3)} {p.activities.length}</span>
                    ))}
                  </span>
                  <span className={isOpen ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
                </button>

                {isOpen && (
                  <div className="itin-day-body">
                    {day.periods.map((period) => (
                      <div key={period.key} className="itin-period">
                        <div className="itin-period-head">
                          <span className={`itin-period-label itin-period-${period.key}`}>{period.label.toUpperCase()} · {period.window}</span>
                          <button onClick={() => openWidget(`Add an activity to Day ${day.day} (${period.label}) of Japan Family Trip`)}>+ Add</button>
                        </div>

                        {period.activities.map((a) => {
                          const meta = categoryMeta[a.category];
                          const Icon = NavIcon[meta.icon];
                          const isConfirmed = confirmedMap[a.id] ?? a.confirmed;
                          const dimmed = activeFilters.size > 0 && !activeFilters.has(a.category);
                          const isDragging = draggedId === a.id;
                          const isDragOver = dragOverId === a.id && draggedId !== a.id;
                          return (
                            <div
                              key={a.id}
                              className={[
                                "itin-activity",
                                a.aiSuggested ? "ai-suggested" : "",
                                isDragging ? "dragging" : "",
                                isDragOver ? "drag-over" : "",
                              ].filter(Boolean).join(" ")}
                              style={{ opacity: dimmed ? 0.35 : isDragging ? 0.4 : 1, borderLeftColor: meta.color }}
                              draggable
                              onDragStart={() => setDraggedId(a.id)}
                              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                              onDragOver={(e) => { e.preventDefault(); setDragOverId(a.id); }}
                              onDragLeave={() => setDragOverId((id) => (id === a.id ? null : id))}
                              onDrop={(e) => { e.preventDefault(); handleDrop(day.day, period.key, a.id); }}
                            >
                              <span className="itin-activity-drag" aria-hidden="true"><NavIcon.dragHandle /></span>
                              <span className="itin-activity-icon" style={{ background: `${meta.color}1a`, color: meta.color }}><Icon /></span>
                              <div className="itin-activity-body">
                                <div className="itin-activity-title-row">
                                  <span className="itin-activity-time">{a.time}</span>
                                  <strong>{a.title}</strong>
                                  {a.avatars && (
                                    <span className="itin-activity-avatars">
                                      {a.avatars.map((av) => <img key={av} src={`/images/${av}`} alt="" />)}
                                    </span>
                                  )}
                                </div>
                                <p className="itin-activity-meta">
                                  <NavIcon.location /> {a.location} <span>·</span> <NavIcon.clock /> {a.duration}
                                  {a.price && <><span>·</span> <NavIcon.dollar /> {formatPriceString(a.price)}</>}
                                  {a.rating && <><span>·</span> <NavIcon.star /> {a.rating}</>}
                                </p>
                                <p className="itin-activity-desc">{a.desc}</p>
                                {!isConfirmed && (
                                  <button className="itin-unconfirmed" onClick={() => confirmActivity(a)}><NavIcon.info /> Unconfirmed — tap to confirm</button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div
                          className={dragOverId === `${day.day}-${period.key}-end` ? "itin-drag-slot drag-over" : "itin-drag-slot"}
                          onDragOver={(e) => { e.preventDefault(); setDragOverId(`${day.day}-${period.key}-end`); }}
                          onDragLeave={() => setDragOverId((id) => (id === `${day.day}-${period.key}-end` ? null : id))}
                          onDrop={(e) => { e.preventDefault(); handleDrop(day.day, period.key); }}
                          onClick={() => openWidget(`Add an activity to Day ${day.day} (${period.label}) of Japan Family Trip`)}
                          role="button"
                          tabIndex={0}
                        >
                          + Drag activity here or click to add
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <button className="itin-add-day" onClick={() => setToast("Adding a new day to the itinerary")}><NavIcon.plus /> Add Day</button>
        </main>

        <aside className="itin-sidebar">
          <div className="dash-card">
            <h3 className="dash-card-title"><NavIcon.dollar /> Trip Budget Tracker</h3>
            <div className="itin-budget-bar">
              {budgetItems.map((b) => (
                <span key={b.label} style={{ width: `${(b.amount / budgetTotal) * 100}%`, background: b.color }} />
              ))}
            </div>
            {budgetItems.map((b) => {
              const Icon = NavIcon[b.icon];
              return (
                <div key={b.label} className="itin-budget-row">
                  <span>
                    <span className="itin-budget-icon" style={{ background: `${b.color}1f`, color: b.color }}><Icon /></span>
                    {b.label}
                  </span>
                  <strong>{format(b.amount, { maximumFractionDigits: 0 })}</strong>
                </div>
              );
            })}
            <div className="itin-budget-total">
              <span>Total</span>
              <strong>{format(budgetTotal, { maximumFractionDigits: 0 })}</strong>
            </div>
            <p className="itin-budget-note"><NavIcon.trendUp /> {format(budgetCap - budgetTotal, { maximumFractionDigits: 0 })} under {format(budgetCap, { maximumFractionDigits: 0 })} budget</p>
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title"><NavIcon.sliders /> Activity Types</h3>
            <div className="itin-type-list">
              {activityTypeFilters.map((t) => {
                const meta = categoryMeta[t.key];
                const Icon = NavIcon[meta.icon];
                const active = activeFilters.has(t.key);
                return (
                  <button key={t.key} className={active ? "itin-type-row active" : "itin-type-row"} onClick={() => toggleFilter(t.key)}>
                    <span className="itin-type-icon" style={{ background: `${meta.color}1f`, color: meta.color }}><Icon /></span>
                    {t.label}
                  </button>
                );
              })}
            </div>
            {activeFilters.size > 0 && <button className="itin-clear-filters" onClick={() => setActiveFilters(new Set())}>Clear filters</button>}
          </div>

          <div className="itin-ai-tip">
            <span className="itin-ai-tip-icon"><NavIcon.sparkle /></span>
            <div>
              <strong>AI Tip</strong>
              <p>Moving the Tsukiji visit to Day 3 morning would save ~45 min of backtracking. Consider pairing Harajuku with Meiji Shrine in the same block.</p>
              <button onClick={() => { setToast("Applying AI optimization..."); openWidget("Apply the suggested itinerary optimization"); }}>Apply optimization <NavIcon.chevronRight /></button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
