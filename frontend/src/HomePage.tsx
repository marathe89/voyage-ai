import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DestImage, NavIcon } from "./icons";
import { useShell } from "./shell";
import { goToSection } from "./SiteNav";
import { popularPlaces } from "./places";
import { loadCmsContent } from "./cms";

const destinations = [
  { name: "Santorini, Greece", desc: "Iconic sunsets & whitewashed cliffs", tag: "Romance", tagClass: "tag-rose", trend: "+34%", rating: "4.9", reviews: "8,420", price: "$1,240", from: "santorini" },
  { name: "Kyoto, Japan", desc: "Ancient temples & cherry blossoms", tag: "Culture", tagClass: "tag-amber", trend: "+28%", rating: "4.8", reviews: "12,300", price: "$980", from: "kyoto" },
  { name: "Bali, Indonesia", desc: "Jungle temples & rice terraces", tag: "Trending", tagClass: "tag-blue", trend: "+52%", rating: "4.7", reviews: "19,800", price: "$760", from: "bali" },
  { name: "Patagonia, Argentina", desc: "Glaciers, peaks & wild frontier", tag: "Adventure", tagClass: "tag-green", trend: "+19%", rating: "4.9", reviews: "5,240", price: "$2,100", from: "patagonia" },
];

const itineraries = [
  { title: "Tokyo to Kyoto: 10-Day Cultural Odyssey", meta: "10 days · 2-4 people · 4.9", note: "Mount Fuji view · Tea ceremony · Bamboo forest", price: "$2,450", from: "tokyo" },
  { title: "Mediterranean Gems: Greece & Italy", meta: "14 days · 2 people · 4.8", note: "Aegean sunsets · Colosseum tour · Pasta feast", price: "$3,800", from: "mediterranean" },
  { title: "Bali & Lombok: Island Soul Journey", meta: "8 days · 1-8 people · 4.7", note: "Beach club · Rice terraces · Snorkeling", price: "$1,190", from: "lombok" },
];

const features = [
  { icon: "◎", title: "Intelligent Trip Planning", desc: "Describe your dream trip in plain english. Our AI understands context, budget, travel style, and preferences to build a perfect itinerary.", accent: "accent-blue", workflow: ["Describe your trip in plain English — destination, budget, dates, and vibe.", "AI parses your intent and cross-references your travel history and preferences.", "A personalized day-by-day itinerary is drafted in seconds.", "Refine it with follow-up chat until it's exactly right."] },
  { icon: "✎", title: "Natural Conversation Booking", desc: "Book flights, hotels, and activities through chat — no forms, no filters. Just tell the AI what you want.", accent: "accent-green", workflow: ["Tell the AI what to book — a flight, hotel, or activity — in one sentence.", "AI matches your request against real-time flight, hotel, and activity inventory.", "It confirms the details back to you in the chat before charging anything.", "One tap and the booking is instantly confirmed."] },
  { icon: "◈", title: "Smart Route Optimization", desc: "AI analyzes thousands of route combinations to minimize travel time, layovers, and costs while maximizing your experience.", accent: "accent-purple", workflow: ["AI scans thousands of possible route and connection combinations.", "It balances total travel time, layover length, and fare cost.", "The best combination is surfaced automatically with a clear reason why.", "You can approve it instantly or ask the AI for alternatives."] },
  { icon: "⚑", title: "Proactive Travel Alerts", desc: "Real-time monitoring of flights, hotels, and activities — your AI acts before you even ask.", accent: "accent-amber", workflow: ["AI continuously monitors your flights, weather, and booked prices 24/7.", "It detects delays, gate changes, cancellations, or price drops the moment they happen.", "You get a live alert with plain-English next steps.", "For disruptions, the AI can automatically rebook or adjust your plan."] },
  { icon: "▤", title: "Unified Travel Wallet", desc: "All bookings, receipts, and travel points in one place. Categorized and expenses automatically reconciled.", accent: "accent-pink", workflow: ["Every booking you make syncs automatically into one travel wallet.", "Expenses are categorized by flights, hotels, food, and activities.", "Loyalty points across airlines and hotel programs are tracked in one view.", "Your full spend history is available anytime, exportable in one click."] },
  { icon: "◉", title: "AI Safety & Support", desc: "24/7 emergency assistance, real-time rebooking during disruptions, and local emergency contacts — always a message away.", accent: "accent-slate", workflow: ["24/7 emergency assistance is on standby throughout your trip.", "Local emergency contacts and embassy numbers are ready instantly by location.", "During disruptions, the AI proactively offers real-time rebooking options.", "One-tap SOS connects you to a live human agent if you ever need one."] },
  { icon: "❖", title: "Collect and Share Memories", desc: "Automatically gather photos, itinerary highlights, and trip moments into a shareable travel journal your friends and family will love.", accent: "accent-indigo", workflow: ["Photos and itinerary highlights are synced automatically during your trip.", "AI identifies your best moments and organizes them by day and location.", "A travel journal is assembled automatically with captions and a timeline.", "Share a beautiful recap with friends and family in one tap."] },
  { icon: "🌐", title: "Multilingual Travel Assistant", desc: "Chat in your language and the AI responds fluently in the local one — perfect for menus, directions, and negotiating a fair taxi fare.", accent: "accent-teal", workflow: ["Pick your destination's language, or let the AI auto-detect it from context.", "Type or speak in English — the AI translates naturally, not word-for-word.", "Get ready-to-show phrases for menus, taxis, and hotel check-in.", "Switch back to English anytime without losing the conversation."] },
];

const testimonials = [
  { name: "Sarah Chen", role: "Digital Nomad, San Francisco CA", trip: "Japan, 14 days", saved: "$840 saved", avatar: "avatar-sarah", quote: "VoyageAI completely transformed how I travel. I described my dream Japan trip in a chat and within minutes had a full 14-day itinerary with bookings. Saved me 8 hours of research and found deals I never would have discovered." },
  { name: "Marcus Rodriguez", role: "Manager @ Google", trip: "Italy, 9 days", saved: "$520 saved", avatar: "avatar-marcus", quote: "I told the concierge my budget and travel style once, and it handled flights, hotels, and even dinner reservations. It felt like having a personal travel agent on call 24/7." },
  { name: "Emma Thompson", role: "Bar & Kitchen, Chef", trip: "Greece, 7 days", saved: "$390 saved", avatar: "avatar-emma", quote: "Between shifts I barely have time to plan anything. VoyageAI built my entire Greece trip from a two-line message and rebooked a flight automatically when my schedule changed." },
  { name: "James Okafor", role: "5+ countries", trip: "Patagonia, 12 days", saved: "$610 saved", avatar: "avatar-james", quote: "The route optimization alone saved me a full day of layovers across three countries. This is the first planning tool that actually understands what I'm asking for." },
];

const partners = [
  { name: "Emirates", logo: "emirates" },
  { name: "Marriott", logo: "marriott" },
  { name: "Expedia", logo: "expedia" },
  { name: "Singapore Air", logo: "singaporeair" },
  { name: "Hilton", logo: "hilton" },
  { name: "Delta", logo: "delta" },
  { name: "Booking.com", logo: "booking" },
  { name: "Lufthansa", logo: "lufthansa" },
  { name: "Hyatt", logo: "hyatt" },
  { name: "AA Airlines", logo: "aa" },
];

interface StepItem { icon?: keyof typeof NavIcon; text: string; }
const steps: { icon: keyof typeof NavIcon; label: string; accent: string; desc: string; mock: string; items?: StepItem[] }[] = [
  { icon: "chat", label: "Describe your trip", accent: "blue", desc: "Type anything — destination, budget, travel style. AI understands plain English.", mock: "chat" },
  { icon: "sparkle", label: "AI builds your plan", accent: "purple", desc: "In seconds, AI searches 500+ airlines, 1,200 hotels, and local experiences for you.", mock: "searching", items: [{ icon: "plane", text: "Searching flights…" }, { icon: "hotel", text: "Finding hotels…" }, { icon: "dining", text: "Curating restaurants…" }, { icon: "transport", text: "Booking transfers…" }] },
  { icon: "list", label: "Review & personalise", accent: "green", desc: "See your full itinerary. Drag, edit, swap — every detail is yours to adjust.", mock: "itinerary", items: [{ icon: "plane", text: "Air India KO22 · Mumbai → Tokyo" }, { icon: "hotel", text: "Andaz Tokyo · 3 nights" }, { icon: "adventure", text: "Mt. Fuji Hike · Hakone Onsen Spa" }] },
  { icon: "check", label: "Book everything in one click", accent: "amber", desc: "Flights, hotels, cabs, restaurants — all confirmed instantly with one tap.", mock: "confirmed", items: [{ icon: "plane", text: "Flights" }, { icon: "hotel", text: "Hotels" }, { icon: "transport", text: "Cabs" }, { icon: "activity", text: "Activities" }] },
  { icon: "bell", label: "Get Live Assistance in trip", accent: "teal", desc: "Connect instantly with your AI concierge mid-journey for rebookings, delays, and local help.", mock: "live", items: [{ icon: "plane", text: "Flight delayed 45 min — rebooking connection…" }, { icon: "gate", text: "New gate: B12" }, { icon: "star", text: "Lounge access added to your ticket" }] },
  { icon: "camera", label: "Collect and Share Memories", accent: "indigo", desc: "Photos and highlights are gathered automatically into a shareable trip journal.", mock: "memories", items: [{ icon: "pin", text: "Shibuya Crossing" }, { icon: "activity", text: "Maruyama Park" }, { icon: "dining", text: "Ichiran Ramen" }] },
];

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: startDow }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtShort(d: Date) {
  return `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function HomePage() {
  const { conciergeReply, setToast, openWidget } = useShell();
  const navigate = useNavigate();
  const location = useLocation();
  const [cms] = useState(loadCmsContent);
  const [tab, setTab] = useState("Flights");
  const [where, setWhere] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("");
  const whereRef = useRef<HTMLInputElement>(null);
  const [whereOpen, setWhereOpen] = useState(false);
  const whereFieldRef = useRef<HTMLDivElement>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const datesFieldRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestsFieldRef = useRef<HTMLDivElement>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [stepIndex, setStepIndex] = useState(0);
  const [stepPaused, setStepPaused] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const destScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepPaused) return;
    const t = setInterval(() => setStepIndex((i) => (i + 1) % steps.length), 2000);
    return () => clearInterval(t);
  }, [stepPaused]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    return () => clearTimeout(t);
  }, [location.hash]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!whereFieldRef.current?.contains(target)) setWhereOpen(false);
      if (!datesFieldRef.current?.contains(target)) setDatesOpen(false);
      if (!guestsFieldRef.current?.contains(target)) setGuestsOpen(false);
    }
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  const filteredPlaces = popularPlaces.filter((p) => p.toLowerCase().includes(where.trim().toLowerCase())).slice(0, 6);

  function pickPlace(p: string) {
    setWhere(p);
    setWhereOpen(false);
  }

  function pickDay(day: number) {
    const clicked = new Date(calYear, calMonth, day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clicked);
      setRangeEnd(null);
      return;
    }
    if (clicked < rangeStart) {
      setRangeStart(clicked);
      setRangeEnd(null);
      return;
    }
    setRangeEnd(clicked);
    setDates(`${fmtShort(rangeStart)} – ${fmtShort(clicked)}`);
    setTimeout(() => setDatesOpen(false), 250);
  }

  function shiftMonth(dir: 1 | -1) {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m);
    setCalYear(y);
  }

  useEffect(() => {
    const parts = [`${adults} Adult${adults !== 1 ? "s" : ""}`];
    if (children > 0) parts.push(`${children} Child${children !== 1 ? "ren" : ""}`);
    if (tab === "Hotels") parts.push(`${rooms} Room${rooms !== 1 ? "s" : ""}`);
    setGuests(parts.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, children, rooms, tab]);

  function toggleWishlist(name: string) {
    const isSaved = wishlist.has(name);
    setWishlist((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(name); else next.add(name);
      return next;
    });
    setToast(isSaved ? `Removed ${name} from wishlist` : `Saved ${name} to wishlist`);
  }

  function goTo(id: string) {
    goToSection(navigate, location.pathname, id);
  }

  function scrollDest(dir: 1 | -1) {
    destScrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  function submitSearch() {
    if (!where.trim()) {
      setToast("Please enter a destination to search");
      whereRef.current?.focus();
      return;
    }
    const stepKey = tab === "Flights" ? "flights" : tab === "Hotels" ? "hotels" : tab === "Activities" ? "activities" : "packages";
    navigate("/book", { state: { stepKey, searchWhere: where.trim(), searchDates: dates.trim(), searchGuests: guests.trim() } });
  }

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-bg" style={cms.homeImage ? { backgroundImage: `url('${cms.homeImage}')` } : undefined} />
        <div className="hero-scrim" />
        <div className="hero-content">
          <div className="hero-badge">✦ Powered by advanced AI — 50M+ trips planned</div>
          {cms.homeTitle ? <h1>{cms.homeTitle}</h1> : <h1>Your AI Travel Concierge<br /><span>for Every Journey</span></h1>}
          <p className="hero-sub">{cms.homeSubtitle ?? "Plan, book, and manage your entire trip through intelligent conversations. From flights to hidden gems — your AI handles everything."}</p>

          <div className="search-card">
            <div className="search-tabs">
              {[
                { label: "Flights", icon: "plane" },
                { label: "Hotels", icon: "hotel" },
                { label: "Activities", icon: "activity" },
                { label: "Packages", icon: "package" },
              ].map(({ label: t, icon }) => {
                const Icon = NavIcon[icon as keyof typeof NavIcon];
                return (
                  <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
                    <Icon /> {t}
                  </button>
                );
              })}
            </div>
            <form
              className="search-fields"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
            >
              <div className="field field-popover-anchor" ref={whereFieldRef}>
                <label className="field-label">
                  <NavIcon.location />
                  <input
                    ref={whereRef}
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                    onFocus={() => setWhereOpen(true)}
                    autoComplete="off"
                    placeholder={tab === "Hotels" ? "Which city?" : tab === "Activities" ? "Where to explore?" : "Where to?"}
                  />
                </label>
                {whereOpen && (
                  <div className="field-popover autocomplete-popover">
                    {filteredPlaces.length === 0 ? (
                      <p className="autocomplete-empty">No matches — try another city</p>
                    ) : (
                      <>
                        <p className="autocomplete-label">{where.trim() ? "Suggestions" : "Popular destinations"}</p>
                        {filteredPlaces.map((p) => (
                          <button type="button" key={p} className="autocomplete-item" onClick={() => pickPlace(p)}>
                            <NavIcon.location /> {p}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="field field-popover-anchor" ref={datesFieldRef}>
                <label className="field-label">
                  <NavIcon.calendar />
                  <input
                    value={dates}
                    readOnly
                    onClick={() => setDatesOpen((v) => !v)}
                    placeholder={tab === "Flights" ? "Depart – Return" : "Dates"}
                  />
                </label>
                {datesOpen && (
                  <div className="field-popover calendar-popover">
                    <div className="calendar-popover-head">
                      <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
                      <strong>{monthNames[calMonth]} {calYear}</strong>
                      <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
                    </div>
                    <div className="calendar-popover-grid">
                      {dayLabels.map((d, i) => <span key={`d${i}`} className="calendar-dow">{d}</span>)}
                      {buildMonthGrid(calYear, calMonth).map((day, i) => {
                        if (day === null) return <span key={`b${i}`} />;
                        const cellDate = new Date(calYear, calMonth, day);
                        const isStart = sameDay(cellDate, rangeStart);
                        const isEnd = sameDay(cellDate, rangeEnd);
                        const inRange = rangeStart && rangeEnd && cellDate > rangeStart && cellDate < rangeEnd;
                        return (
                          <button
                            type="button"
                            key={day}
                            className={isStart || isEnd ? "calendar-day edge" : inRange ? "calendar-day in-range" : "calendar-day"}
                            onClick={() => pickDay(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <p className="calendar-popover-hint">{rangeStart && !rangeEnd ? "Pick a return date" : "Pick your departure date"}</p>
                  </div>
                )}
              </div>

              <div className="field field-popover-anchor" ref={guestsFieldRef}>
                <label className="field-label">
                  <NavIcon.guests />
                  <input
                    value={guests}
                    readOnly
                    onClick={() => setGuestsOpen((v) => !v)}
                    placeholder={tab === "Flights" ? "Passengers" : "Guests"}
                  />
                </label>
                {guestsOpen && (
                  <div className="field-popover guests-popover">
                    <div className="guests-popover-row">
                      <div><strong>Adults</strong><span>Age 13+</span></div>
                      <div className="guests-stepper">
                        <button type="button" aria-label="Decrease adults" onClick={() => setAdults((a) => Math.max(1, a - 1))}><NavIcon.minus /></button>
                        <strong>{adults}</strong>
                        <button type="button" aria-label="Increase adults" onClick={() => setAdults((a) => Math.min(9, a + 1))}><NavIcon.plus /></button>
                      </div>
                    </div>
                    <div className="guests-popover-row">
                      <div><strong>Children</strong><span>Age 0–12</span></div>
                      <div className="guests-stepper">
                        <button type="button" aria-label="Decrease children" onClick={() => setChildren((c) => Math.max(0, c - 1))}><NavIcon.minus /></button>
                        <strong>{children}</strong>
                        <button type="button" aria-label="Increase children" onClick={() => setChildren((c) => Math.min(6, c + 1))}><NavIcon.plus /></button>
                      </div>
                    </div>
                    {tab === "Hotels" && (
                      <div className="guests-popover-row">
                        <div><strong>Rooms</strong><span>How many rooms</span></div>
                        <div className="guests-stepper">
                          <button type="button" aria-label="Decrease rooms" onClick={() => setRooms((r) => Math.max(1, r - 1))}><NavIcon.minus /></button>
                          <strong>{rooms}</strong>
                          <button type="button" aria-label="Increase rooms" onClick={() => setRooms((r) => Math.min(5, r + 1))}><NavIcon.plus /></button>
                        </div>
                      </div>
                    )}
                    <button type="button" className="guests-popover-done" onClick={() => setGuestsOpen(false)}>Done</button>
                  </div>
                )}
              </div>

              <button type="submit" className="search-btn"><NavIcon.search /> Search</button>
            </form>
          </div>

          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => goTo("concierge")}>
              <NavIcon.lightning /> Let AI Plan your Trip →
            </button>
            <button className="btn-ghost" onClick={() => goTo("discover")}><NavIcon.play /> Explore Destinations</button>
          </div>

          <div className="hero-pills">
            <span className="hero-pill-static"><i className="pill-dot pill-blue"><NavIcon.plane /></i> Smart Flights</span>
            <span className="hero-pill-static"><i className="pill-dot pill-green"><NavIcon.hotel /></i> Curated Hotels</span>
            <span className="hero-pill-static"><i className="pill-dot pill-amber"><NavIcon.pin /></i> Local Activities</span>
            <span className="hero-pill-static"><i className="pill-dot pill-purple"><NavIcon.transport /></i> Ground Transport</span>
          </div>

          <div className="hero-stats">
            <div className="stat">195+<em>Destinations</em></div>
            <div className="stat">50M+<em>Trips Planned</em></div>
            <div className="stat">8.2M<em>Happy Travelers</em></div>
            <div className="stat">98.7%<em>AI Accuracy</em></div>
          </div>
        </div>
      </section>

      {!!cms.blocks?.home?.length && (
        <section className="home-blocks">
          <div className="home-blocks-grid">
            {cms.blocks.home.map((b) => (
              <div key={b.id} className="home-block-card">
                {b.image && <div className="home-block-image" style={{ backgroundImage: `url('${b.image}')` }} />}
                <h3>{b.title}</h3>
                {b.subtitle && <p>{b.subtitle}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="how-it-works" id="concierge">
        <p className="eyebrow center">✦ How it works</p>
        <h2 className="center">Redefine Entire trip experience with AI</h2>
        <p className="section-sub center">From dream to boarding pass in minutes — no forms, no tabs, no stress.</p>

        <div className="steps-row">
          {steps.map((s, i) => {
            const StepIcon = NavIcon[s.icon as keyof typeof NavIcon];
            return (
              <button key={s.label} className={stepIndex === i ? `step active accent-${s.accent}` : "step"} onClick={() => setStepIndex(i)}>
                <StepIcon /> {s.label}
              </button>
            );
          })}
        </div>

        <div className="chat-demo" onMouseEnter={() => setStepPaused(true)} onMouseLeave={() => setStepPaused(false)}>
          <div className={`chat-icon accent-${steps[stepIndex].accent}`}>
            {(() => { const StepIcon = NavIcon[steps[stepIndex].icon as keyof typeof NavIcon]; return <StepIcon />; })()}
          </div>
          <div className="chat-copy">
            <span className="chat-step">Step {stepIndex + 1} of {steps.length}</span>
            <h3>{steps[stepIndex].label}</h3>
            <p>{steps[stepIndex].desc}</p>
            <div className="progress-bar"><span className={`accent-${steps[stepIndex].accent}`} style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
          </div>

          {steps[stepIndex].mock === "chat" && (
            <div className="chat-bubble">
              <div className="chat-avatar"><NavIcon.bot /></div>
              <p>Hello! I'm your AI travel concierge. Where would you like to go?</p>
              <button className="chat-reply" onClick={() => openWidget("Family trip to Japan, 10 days, hiking + spa")}>Family trip to Japan, 10 days, hiking + spa</button>
            </div>
          )}
          {steps[stepIndex].mock === "searching" && (
            <div className="mock-card">
              <div className="mock-dots"><span /><span /><span /></div>
              {steps[stepIndex].items?.map((it) => {
                const ItemIcon = it.icon ? NavIcon[it.icon] : null;
                return (
                  <div key={it.text} className="mock-row mock-row-loading">
                    <span className="mock-spinner" />
                    {ItemIcon && <span className="mock-row-icon"><ItemIcon /></span>}
                    {it.text}
                  </div>
                );
              })}
            </div>
          )}
          {steps[stepIndex].mock === "itinerary" && (
            <div className="mock-card">
              <div className="mock-dots"><span /><span /><span /></div>
              {steps[stepIndex].items?.map((it) => {
                const ItemIcon = it.icon ? NavIcon[it.icon] : null;
                return (
                  <div key={it.text} className="mock-row mock-row-plain">
                    {ItemIcon && <span className="mock-row-icon"><ItemIcon /></span>}
                    {it.text}
                  </div>
                );
              })}
            </div>
          )}
          {steps[stepIndex].mock === "confirmed" && (
            <div className="mock-card mock-confirmed">
              <div className="mock-dots"><span /><span /><span /></div>
              <div className="mock-check"><NavIcon.check /></div>
              <h4>Trip Confirmed!</h4>
              <p className="mock-sub">Japan, 10 days · 2 travelers</p>
              <div className="mock-icons">
                {steps[stepIndex].items?.map((it) => {
                  const ItemIcon = it.icon ? NavIcon[it.icon] : null;
                  return <span key={it.text}>{ItemIcon && <ItemIcon />} {it.text}</span>;
                })}
              </div>
            </div>
          )}
          {steps[stepIndex].mock === "live" && (
            <div className="mock-card">
              <div className="mock-dots"><span /><span /><span /></div>
              <div className="mock-live-badge"><i /> Live</div>
              {steps[stepIndex].items?.map((it, i) => {
                const ItemIcon = it.icon ? NavIcon[it.icon] : null;
                return (
                  <div key={it.text} className={i === 0 ? "mock-row mock-row-loading" : "mock-row mock-row-plain"}>
                    {i === 0 && <span className="mock-spinner" />}
                    {ItemIcon && <span className="mock-row-icon"><ItemIcon /></span>}
                    {it.text}
                  </div>
                );
              })}
            </div>
          )}
          {steps[stepIndex].mock === "memories" && (
            <div className="mock-card mock-memories">
              <div className="mock-dots"><span /><span /><span /></div>
              <div className="mock-photo-grid">
                <div className="mock-photo mock-photo-a" />
                <div className="mock-photo mock-photo-b" />
                <div className="mock-photo mock-photo-c" />
              </div>
              {steps[stepIndex].items?.map((it) => {
                const ItemIcon = it.icon ? NavIcon[it.icon] : null;
                return (
                  <div key={it.text} className="mock-row mock-row-plain">
                    {ItemIcon && <span className="mock-row-icon"><ItemIcon /></span>}
                    {it.text}
                  </div>
                );
              })}
              <button className="mock-share"><NavIcon.send /> Share journal</button>
            </div>
          )}
        </div>

        <div className="try-concierge">
          <button onClick={() => navigate("/concierge")}>✦ Try AI Concierge Now</button>
        </div>
        {conciergeReply && <p className="concierge-reply">{conciergeReply}</p>}
      </section>

      <section className="destinations" id="discover-teaser">
        <div className="section-head">
          <div>
            <p className="eyebrow">↗ Trending Now</p>
            <h2>Where Everyone's Going</h2>
            <p className="section-sub">AI-curated picks based on millions of traveler journeys this season</p>
          </div>
          <div className="carousel-nav"><button aria-label="Scroll left" onClick={() => scrollDest(-1)}>‹</button><button aria-label="Scroll right" onClick={() => scrollDest(1)}>›</button></div>
        </div>
        <div className="dest-grid" ref={destScrollRef}>
          {destinations.map((d) => (
            <article key={d.name} className="dest-card">
              <div className="dest-media">
                <DestImage from={d.from} />
                <span className={`dest-tag ${d.tagClass}`}>{d.tag}</span>
                <button
                  className={wishlist.has(d.name) ? "dest-wish active" : "dest-wish"}
                  aria-label="Save to wishlist"
                  onClick={() => toggleWishlist(d.name)}
                ><NavIcon.heart /></button>
                <span className="dest-trend"><NavIcon.trendUp /> {d.trend}</span>
              </div>
              <div className="dest-body">
                <h3>{d.name}</h3>
                <p className="dest-desc">{d.desc}</p>
                <p className="dest-rating">★ {d.rating} <span>({d.reviews} reviews)</span></p>
                <div className="dest-foot">
                  <div>
                    <span className="dest-from-label">From</span>
                    <span className="dest-price"><strong>{d.price}</strong> /person</span>
                  </div>
                  <button className="dest-explore" onClick={() => openWidget(`Plan a trip to ${d.name}`, d.from)}>Explore</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="itineraries" id="itineraries">
        <div className="section-head">
          <div>
            <p className="eyebrow">✦ AI Crafted</p>
            <h2>Popular Itineraries</h2>
            <p className="section-sub">Ready-to-book routes designed by our AI and loved by travelers</p>
          </div>
          <button className="view-all" onClick={() => goTo("discover")}>View all itineraries →</button>
        </div>
        <div className="itin-grid">
          {itineraries.map((it) => (
            <article key={it.title} className="itin-card">
              <div className="itin-media"><DestImage from={it.from} prefix="itin" /><span className="itin-badge">✦ AI Crafted</span></div>
              <div className="itin-body">
                <h3>{it.title}</h3>
                <p className="itin-meta">{it.meta}</p>
                <p className="itin-note">{it.note}</p>
                <div className="itin-foot">
                  <span>From <strong>{it.price}</strong>/person</span>
                  <button onClick={() => openWidget(`Show me the itinerary for "${it.title}"`, it.from === "tokyo" ? "tokyo-kyoto" : it.from)}>Book Now <span>→</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilities" id="capabilities">
        <p className="eyebrow center">✦ What VoyageAI Can Do</p>
        <h2 className="center">AI That Works While You Dream</h2>
        <p className="section-sub center">From the first spark of wanderlust to the moment you return home — VoyageAI handles every detail intelligently.</p>

        <div className="cap-pills">
          {[
            { label: "Flights", icon: "plane" },
            { label: "Hotels", icon: "hotel" },
            { label: "Transfers", icon: "transport" },
            { label: "Dining", icon: "dining" },
            { label: "Experiences", icon: "camera" },
            { label: "Insurance", icon: "shield" },
          ].map(({ label: p, icon }) => {
            const Icon = NavIcon[icon as keyof typeof NavIcon];
            return (
              <span key={p} className="cap-pill-static">
                <span className="cap-pill-icon"><Icon /></span>
                {p}
              </span>
            );
          })}
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className={`feature-icon ${f.accent}`}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <button className="feature-link" onClick={() => setActiveFeature(f.title)}>Learn more <i>→</i></button>
            </div>
          ))}
        </div>

        <div className="cta-box">
          <h3>Ready to travel smarter?</h3>
          <p>Join 8.2 million travelers who trust VoyageAI for every journey.</p>
          <button className="btn-primary" onClick={() => navigate("/concierge", { state: { initialPrompt: "I'd like to start planning my first trip — I understand VoyageAI has zero platform fees." } })}>✦ Start Your First Trip Free</button>
        </div>
      </section>

      {activeFeature && (() => {
        const f = features.find((x) => x.title === activeFeature);
        if (!f) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setActiveFeature(null)}>
            <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
              <button className="feature-modal-close" aria-label="Close" onClick={() => setActiveFeature(null)}><NavIcon.close /></button>
              <span className={`feature-icon ${f.accent}`}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="feature-modal-desc">{f.desc}</p>
              <p className="feature-modal-label">How it works</p>
              <ol className="feature-modal-steps">
                {f.workflow.map((step, i) => (
                  <li key={i}><span>{i + 1}</span><p>{step}</p></li>
                ))}
              </ol>
              <button className="btn-primary feature-modal-cta" onClick={() => { setActiveFeature(null); navigate("/concierge", { state: { initialPrompt: `Tell me more about ${f.title.toLowerCase()}` } }); }}><NavIcon.sparkle /> Try it in the Concierge</button>
            </div>
          </div>
        );
      })()}

      <section className="testimonials" id="testimonials">
        <p className="stars center">★★★★★</p>
        <h2 className="center">Trusted by 8.2M Travelers</h2>
        <p className="section-sub center">Real stories from real adventurers.</p>

        <blockquote className="testimonial-card">
          <p>&ldquo;{testimonials[activeTestimonial].quote}&rdquo;</p>
          <footer>
            <img className="avatar" src={`/images/${testimonials[activeTestimonial].avatar}.png`} alt={testimonials[activeTestimonial].name} />
            <div>
              <strong>{testimonials[activeTestimonial].name}</strong>
              <span>{testimonials[activeTestimonial].role}</span>
            </div>
            <span className="pill">{testimonials[activeTestimonial].trip}</span>
            <span className="pill pill-green">{testimonials[activeTestimonial].saved}</span>
          </footer>
        </blockquote>

        <div className="testimonial-strip">
          {testimonials.map((t, i) => (
            <button key={t.name} className={i === activeTestimonial ? "mini-avatar active" : "mini-avatar"} onClick={() => setActiveTestimonial(i)}>
              <img className="avatar" src={`/images/${t.avatar}.png`} alt={t.name} />
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        <p className="partners-label">Connected to 500+ travel partners</p>
        <div className="partners-row">
          {partners.map((p) => (
            <button key={p.name} className="partner-logo" onClick={() => { setToast(`Searching ${p.name}`); openWidget(`Show me options with ${p.name}`); }}>
              <img src={`/images/partner-${p.logo}.png`} alt={p.name} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <h4>Get travel inspiration weekly</h4>
            <p>AI-curated deals and destination ideas delivered to your inbox.</p>
          </div>
          {subscribed ? (
            <p className="subscribe-success">✓ You're subscribed — check your inbox soon.</p>
          ) : (
            <form className="subscribe" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}>
              <input type="email" required placeholder="you@email.com" aria-label="Email address" />
              <button type="submit">Subscribe</button>
            </form>
          )}
        </div>
        <div className="footer-cols">
          <div className="footer-brand">
            <span>✦ VoyageAI</span>
            <p>Your intelligent travel concierge, powered by AI</p>
          </div>
          <div><h5>Product</h5>{["Features", "AI Concierge", "Mobile App", "Integrations"].map((l) => <button key={l} onClick={() => setToast(`${l} — coming soon`)}>{l}</button>)}</div>
          <div><h5>Company</h5>{["About Us", "Careers", "Blog", "Press"].map((l) => <button key={l} onClick={() => setToast(`${l} — coming soon`)}>{l}</button>)}</div>
          <div><h5>Support</h5>{["Help Center", "Contact Us", "Safety", "API Docs"].map((l) => <button key={l} onClick={() => setToast(`${l} — coming soon`)}>{l}</button>)}</div>
          <div><h5>Legal</h5>{["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map((l) => <button key={l} onClick={() => setToast(`${l} — coming soon`)}>{l}</button>)}</div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VoyageAI. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
