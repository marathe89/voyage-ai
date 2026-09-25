import { useState } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { ShareButton } from "./ShareButton";

interface Rec {
  name: string;
  country: string;
  image?: string;
  gradient?: string;
  price: string;
  duration: string;
  window: string;
  badges: ("Trending" | "Hot" | "New" | "Visa Free")[];
  match: number;
  tags: string[];
  why: string;
}

interface Section {
  key: string;
  icon: keyof typeof NavIcon;
  color: string;
  title: string;
  sub: string;
  recs: Rec[];
}

const sections: Section[] = [
  {
    key: "hiking", icon: "activity", color: "#4bb383",
    title: "Because you love hiking", sub: "Based on your Hakone onsen rating, and 3 mountain itineraries.",
    recs: [
      { name: "Torres del Paine", country: "Chile", image: "dest-patagonia.png", price: "$2,100", duration: "10–14 days", window: "Nov–Mar", badges: ["Trending"], match: 96, tags: ["Adventure", "Remote"], why: "You hiked Mt. Fuji's 5th Station — the El Circuit here is 3x the drama." },
      { name: "Dolomites", country: "Italy", image: "dest-dolomites.png", price: "$1,400", duration: "7–10 days", window: "Jun–Sep", badges: [], match: 94, tags: ["Alpine", "Scenic", "Family Friendly"], why: "Alta Via trails + your love of scenic mountain villages perfect fit." },
      { name: "Zhangjiajie", country: "China", image: "dest-kyoto.png", price: "$900", duration: "5–7 days", window: "Apr–Oct", badges: [], match: 93, tags: ["Scenic", "Trending"], why: "Pillar-like sandstone towers draped in mist, glass-bottomed bridges, and ancient forest trails floating above the clouds." },
      { name: "Faroe Islands", country: "Denmark", image: "dest-iceland.png", price: "$2,400", duration: "7–10 days", window: "May–Aug", badges: ["Hot"], match: 91, tags: ["Remote", "Off-beat"], why: "You gave 5 stars to off-the-beaten-path experiences — this is peak isolation." },
    ],
  },
  {
    key: "wellness", icon: "wellness", color: "#2fa8a3",
    title: "Wellness escapes", sub: "Matched to your Hakone onsen visit, spa search history, and meditation interests.",
    recs: [
      { name: "Ubud", country: "Bali, Indonesia", image: "dest-bali.png", price: "$800", duration: "7–10 days", window: "Apr–Oct", badges: ["Trending", "Visa Free"], match: 96, tags: ["Spa", "Yoga+Retreat"], why: "You rated your Hakone onsen 5 — Ubud's jungle retreats take it even deeper." },
      { name: "Tuscany", country: "Italy", image: "dest-tuscany.png", price: "$1,600", duration: "7–12 days", window: "Apr–Jun", badges: [], match: 95, tags: ["Thermal Baths", "Vineyards"], why: "Your 'slow travel' tag and wine interest make Montecatini Terme a natural fit." },
      { name: "Sedona", country: "Arizona, USA", image: "dest-sedona.png", price: "$1,200", duration: "4–7 days", window: "Oct–May", badges: ["Hot", "Visa Free"], match: 93, tags: ["Energy Vortex", "Desert Spa", "Healing"], why: "Your meditation app usage + searches for 'energy retreats' flagged the red rock sanctuary." },
      { name: "Auli", country: "Uttarakhand, India", image: "dest-auli.png", price: "$600", duration: "6–8 days", window: "Nov–Mar", badges: [], match: 89, tags: ["Ayurvedic", "Himalayan Yoga"], why: "Rishikesh is 3 hours away — combine skiing, yoga, and Himalayan spa culture." },
    ],
  },
  {
    key: "family", icon: "family", color: "#9c6fe0",
    title: "Family vacations", sub: "Tailored for 2 adults + 2 children (ages 6 & 9) based on your trip profile.",
    recs: [
      { name: "Kyoto & Osaka", country: "Japan", image: "dest-kyoto.png", price: "$3,200/family", duration: "10–12 days", window: "Mar–May", badges: ["Trending"], match: 97, tags: ["Kid-Friendly", "Culture", "Trains"], why: "Japan ranks #1 globally for family safety + your kids love cultural experiences." },
      { name: "Costa Rica", country: "Central America", image: "dest-costarica.png", price: "$2,800/family", duration: "10–14 days", window: "Dec–Apr", badges: ["Visa Free"], match: 94, tags: ["Wildlife", "Adventure"], why: "Your 8-year-old's interest in wildlife + jungle zip-lining sealed it." },
      { name: "Portugal", country: "Europe", image: "dest-amalfi.png", price: "$2,200/family", duration: "10–14 days", window: "May–Sep", badges: [], match: 91, tags: ["Beach", "History", "Family Friendly"], why: "Europe's best beaches, affordable luxury, and family-friendly Lisbon neighborhoods." },
      { name: "New Zealand", country: "Oceania", image: "dest-queenstown.png", price: "$4,400/family", duration: "14 days", window: "Nov–Mar", badges: ["Hot"], match: 88, tags: ["Nature", "Adventure", "Lord of the Rings"], why: "Your kids rated 'Hobbit' their favorite movie — this is where those films were made." },
    ],
  },
  {
    key: "trending", icon: "trendUp", color: "#e5a13c",
    title: "Trending now", sub: "Surging 45% in searches this week among travelers with your profile.",
    recs: [
      { name: "Georgia (Caucasus)", country: "Georgia", image: "dest-georgia.png", price: "$700", duration: "7–10 days", window: "Apr–Oct", badges: ["Hot", "Visa Free"], match: 94, tags: ["Emerging", "Wine", "Mountains"], why: "Fastest growing destination in 2026 — affordable, visa-free, and scenic mountain roads." },
      { name: "Saudi Arabia", country: "Middle East", image: "dest-petra.png", price: "$1,800", duration: "7–10 days", window: "Oct–Apr", badges: ["New", "Visa Free"], match: 92, tags: ["New Visa", "Desert", "Culture"], why: "Newly opened to tourism with jaw-dropping ancient sites and zero crowds so far." },
      { name: "Albania", country: "Eastern Europe", image: "dest-albania.png", price: "$600", duration: "5–8 days", window: "May–Sep", badges: ["Hot", "Visa Free"], match: 90, tags: ["Hidden Gem", "Beaches"], why: "Riviera comparable to Croatia at 1/3 the price. Searches up 68% this month." },
      { name: "Oman", country: "Middle East", image: "dest-marrakech.png", price: "$1,800", duration: "8–12 days", window: "Oct–Apr", badges: [], match: 87, tags: ["Desert", "Diving", "Fjords"], why: "Wahiba Sands dunes, Musandam fjords, easy visa-on-arrival, and Oman's laid-back pace." },
    ],
  },
];

const tasteProfile = [
  { label: "Hiking", pct: 92 },
  { label: "Wellness", pct: 78 },
  { label: "Photography", pct: 71 },
  { label: "Food Travel", pct: 65 },
  { label: "Luxury", pct: 58 },
  { label: "Nightlife", pct: 22 },
];

const travelStats = [
  { icon: "book" as const, label: "Trips Taken", value: "12", color: "#3c7ef2" },
  { icon: "globe" as const, label: "Countries", value: "8", color: "#2fa8a3" },
  { icon: "heart" as const, label: "Saved Places", value: "34", color: "#e0688f" },
  { icon: "chat" as const, label: "AI Chats", value: "47", color: "#e5a13c" },
];

const bucketList = [
  { name: "Patagonia Trek", match: 89, image: "dest-patagonia.png" },
  { name: "Faroe Islands", match: 87, image: "dest-iceland.png" },
  { name: "Georgia (Caucasus)", match: 85, image: "dest-georgia.png" },
];

const aiChips = ["Hiking", "Wellness Seeker", "Culture Explorer", "Solo Adventurer"];

function badgeClass(b: string) {
  if (b === "Visa Free") return "disc-badge disc-badge-visafree";
  if (b === "New") return "disc-badge disc-badge-new";
  if (b === "Hot") return "disc-badge fy-badge-hot";
  return "disc-badge disc-badge-trending";
}

export function ForYouPage() {
  const { setToast, openWidget } = useShell();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);

  function toggleWishlist(name: string) {
    const isSaved = wishlist.has(name);
    setWishlist((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(name); else next.add(name);
      return next;
    });
    setToast(isSaved ? `Removed ${name} from wishlist` : `Saved ${name} to wishlist`);
  }

  function downloadRec(r: Rec) {
    const lines = [
      `${r.name}, ${r.country}`,
      `From ${r.price} · ${r.duration} · Best ${r.window}`,
      `${r.match}% match`,
      r.tags.length ? `Tags: ${r.tags.join(", ")}` : "",
      "",
      "Why we picked this:",
      r.why,
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.name.replace(/[^a-z0-9]+/gi, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Downloaded ${r.name} details`);
  }

  return (
    <div className="fy-page">
      <div className="fy-header">
        <div>
          <span className="fy-updated"><i /> Updated just now</span>
          <h1>Just For You</h1>
          <p>AI-personalized recommendations based on your travel history and preferences.</p>
        </div>
        <div className="fy-header-actions">
          <button className="dash-btn-ghost" onClick={() => { setToast("Recommendations refreshed"); }}><NavIcon.reset /> Refresh</button>
          <button className="dash-btn-primary" onClick={() => openWidget()}><NavIcon.sparkle /> Ask AI</button>
        </div>
      </div>

      <div className="fy-ai-banner">
        <span className="fy-ai-icon"><NavIcon.sparkle /></span>
        <div className="fy-ai-body">
          <p><strong>Your AI has been busy</strong> <span className="fy-live">Live</span></p>
          <p className="fy-ai-text">Based on your Japan trip, Hakone onsen rating, saved Patagonia map, and browsing patterns —<br />I've curated <strong>48 personalized destinations</strong> ranked by how well they match your travel DNA.</p>
          <div className="fy-ai-chips">
            {aiChips.map((c) => <span key={c}>{c}</span>)}
          </div>
        </div>
        <button className="fy-ai-alerts" onClick={() => setToast("Alerts enabled for new matches")}><NavIcon.bell /> Get Alerts</button>
      </div>

      <div className="fy-layout">
        <main className="fy-main">
          {sections.map((sec) => {
            const Icon = NavIcon[sec.icon];
            const shown = visibleCount[sec.key] ?? 4;
            const list = sec.recs.slice(0, shown);
            return (
              <section key={sec.key} className="fy-section">
                <div className="fy-section-head">
                  <div className="fy-section-title">
                    <span className="fy-section-icon" style={{ background: `${sec.color}22`, color: sec.color }}><Icon /></span>
                    <div>
                      <h2>{sec.title}</h2>
                      <p>{sec.sub}</p>
                    </div>
                  </div>
                  <button className="fy-see-all" onClick={() => setToast(`Showing all ${sec.title.toLowerCase()}`)}>See all 12 <NavIcon.chevronRight /></button>
                </div>
                <div className="fy-grid">
                  {list.map((r) => (
                    <article
                      key={r.name}
                      className="fy-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => openWidget(`Tell me more about ${r.name}, ${r.country}`)}
                      onKeyDown={(e) => { if (e.key === "Enter") openWidget(`Tell me more about ${r.name}, ${r.country}`); }}
                    >
                      <div className="fy-card-media" style={r.image ? { backgroundImage: `url(/images/${r.image})` } : { background: r.gradient }}>
                        <div className="discover-card-badges">
                          {r.badges.map((b) => <span key={b} className={badgeClass(b)}>{b === "Visa Free" && <NavIcon.shield />} {b}</span>)}
                        </div>
                        <button className={wishlist.has(r.name) ? "discover-wish active" : "discover-wish"} aria-label="Save" onClick={(e) => { e.stopPropagation(); toggleWishlist(r.name); }}><NavIcon.heart /></button>
                        <span className="fy-match"><NavIcon.sparkle /> {r.match}% match</span>
                      </div>
                      <div className="fy-card-body">
                        <div className="fy-card-title">
                          <div>
                            <strong>{r.name}</strong>
                            <p className="disc-country"><NavIcon.location /> {r.country}</p>
                          </div>
                          <strong className="fy-price">{r.price}</strong>
                        </div>
                        <div className="disc-tags">
                          {r.tags.map((t) => <span key={t}>{t}</span>)}
                        </div>
                        <p className="fy-meta"><NavIcon.calendar /> {r.duration} <span>·</span> Best {r.window}</p>
                        <div className="fy-why">
                          <span className="fy-why-icon"><NavIcon.sparkle /></span>
                          <div><em>Why we picked this</em><p>{r.why}</p></div>
                        </div>
                        <div className="fy-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="dash-btn-primary" onClick={() => openWidget(`Plan a trip to ${r.name}, ${r.country}`)}><NavIcon.sparkle /> Plan This Trip</button>
                        </div>
                        <div className="fy-quick-actions" onClick={(e) => e.stopPropagation()}>
                          <ShareButton
                            title={r.name}
                            text={`${r.name}, ${r.country} — ${r.match}% match on VoyageAI`}
                            link={`https://voyageai.app/discover/${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            label="Share"
                            buttonClassName="fy-quick-btn"
                          />
                          <button className="fy-quick-btn" onClick={() => downloadRec(r)}><NavIcon.download /> Download</button>
                          <button className="fy-quick-btn" onClick={() => openWidget(`Tell me more about ${r.name}, ${r.country}`)}><NavIcon.chat /> Contact</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {shown < sec.recs.length ? null : (
                  <button className="fy-show-more" onClick={() => setToast(`Loading more ${sec.title.toLowerCase()}`)}>+ Show more {sec.title.toLowerCase()}</button>
                )}
              </section>
            );
          })}
        </main>

        <aside className="fy-sidebar">
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Your Taste Profile</h3>
              <button className="dash-redeem-link" onClick={() => setToast("Update your preferences")}>Update</button>
            </div>
            {tasteProfile.map((t) => (
              <div key={t.label} className="fy-taste-row">
                <div className="fy-taste-top"><span>{t.label}</span><strong>{t.pct}%</strong></div>
                <div className="booking-progress-bar fy-taste-bar"><span style={{ width: `${t.pct}%` }} /></div>
              </div>
            ))}
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title"><NavIcon.trendUp /> Your Travel Stats</h3>
            <div className="fy-stats-grid">
              {travelStats.map((s) => {
                const Icon = NavIcon[s.icon];
                return (
                  <div key={s.label} className="fy-stat-tile">
                    <span style={{ background: `${s.color}22`, color: s.color }}><Icon /></span>
                    <div className="fy-stat-text">
                      <strong>{s.value}</strong>
                      <em>{s.label}</em>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fy-feedback-card">
            <h3 className="dash-card-title"><NavIcon.sparkle /> Help AI Improve</h3>
            <p className="fy-saved-sub">Rate these suggestions to make future recommendations even more accurate.</p>
            <div className="fy-feedback-row">
              <button className={feedback === "good" ? "fy-feedback-btn good active" : "fy-feedback-btn good"} onClick={() => { setFeedback("good"); setToast("Thanks for the feedback!"); }}><NavIcon.thumbsUp /> Good</button>
              <button className={feedback === "bad" ? "fy-feedback-btn bad active" : "fy-feedback-btn bad"} onClick={() => { setFeedback("bad"); setToast("Got it — tuning your recommendations"); }}><NavIcon.thumbsDown /> Bad</button>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3><NavIcon.bookmark /> Bucket List ({bucketList.length})</h3>
            </div>
            {bucketList.map((b) => (
              <div key={b.name} className="dash-saved-row" role="button" tabIndex={0} onClick={() => openWidget(`Plan a trip to ${b.name}`)} onKeyDown={(e) => { if (e.key === "Enter") openWidget(`Plan a trip to ${b.name}`); }}>
                <span className="dash-saved-thumb" style={{ backgroundImage: `url(/images/${b.image})` }} />
                <span className="dash-saved-info">
                  <strong>{b.name}</strong>
                  <span className="dash-saved-match"><NavIcon.sparkle /> {b.match}% match</span>
                </span>
                <span className="dash-saved-actions">
                  <button className="dash-saved-download" aria-label={`Download guide for ${b.name}`} onClick={(e) => { e.stopPropagation(); setToast(`Downloading travel guide for "${b.name}"`); }}><NavIcon.download /></button>
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
