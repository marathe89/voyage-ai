import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DestImage, NavIcon } from "./icons";
import { useShell } from "./shell";

interface Dest {
  name: string;
  country: string;
  from: string;
  region: string;
  badges: string[];
  aiMatch: number;
  rating: number;
  desc: string;
  tags: string[];
  budget: number;
  budgetLabel: string;
  duration: string;
  durationBucket: string;
  bestIn: string[];
}

const allDestinations: Dest[] = [
  { name: "Santorini", country: "Greece", from: "santorini", region: "Europe", badges: ["Trending"], aiMatch: 97, rating: 4.9, desc: "Iconic whitewashed cliffs, volcanic sunsets, and world-class infinity-pool retreats above the caldera.", tags: ["Luxury", "Romance", "Wellness"], budget: 1200, budgetLabel: "$1,200+", duration: "5–10 days", durationBucket: "5-7", bestIn: ["sun", "snow"] },
  { name: "Maldives", country: "Maldives", from: "maldives", region: "Asia", badges: ["New", "Visa Free"], aiMatch: 96, rating: 5.0, desc: "Overwater villas, bioluminescent lagoons, house reefs, and barefoot luxury at its finest.", tags: ["Luxury", "Wellness", "Romance"], budget: 2800, budgetLabel: "$2,800+", duration: "5–10 days", durationBucket: "5-7", bestIn: ["snow", "sun"] },
  { name: "Kyoto", country: "Japan", from: "kyoto", region: "Asia", badges: [], aiMatch: 95, rating: 4.8, desc: "Ancient temples, bamboo forests, geisha districts, and world-renowned ryokan spas.", tags: ["Culture", "Wellness", "Family Friendly"], budget: 900, budgetLabel: "$900+", duration: "5–7 days", durationBucket: "5-7", bestIn: ["sun", "snow"] },
  { name: "Amalfi Coast", country: "Italy", from: "amalfi", region: "Europe", badges: [], aiMatch: 94, rating: 4.9, desc: "Cliffside villages tumbling into turquoise water, lemon groves, and coastal sailing.", tags: ["Luxury", "Romance"], budget: 1400, budgetLabel: "$1,400+", duration: "5–10 days", durationBucket: "5-7", bestIn: ["sun"] },
  { name: "Bali", country: "Indonesia", from: "bali", region: "Asia", badges: ["Trending", "Visa Free"], aiMatch: 93, rating: 4.7, desc: "Lush rice terraces, healing retreats, surf breaks, and spiritual temples at every turn.", tags: ["Wellness", "Adventure", "Family Friendly"], budget: 600, budgetLabel: "$600+", duration: "7–14 days", durationBucket: "7-14", bestIn: ["sun"] },
  { name: "Tuscany", country: "Italy", from: "tuscany", region: "Europe", badges: ["New"], aiMatch: 93, rating: 4.8, desc: "Rolling vineyards, Renaissance art, truffle hunts, and slow travel through hilltop villages.", tags: ["Luxury", "Wellness", "Romance"], budget: 1200, budgetLabel: "$1,200+", duration: "7–12 days", durationBucket: "7-14", bestIn: ["sun"] },
  { name: "Patagonia", country: "Argentina & Chile", from: "patagonia", region: "South America", badges: ["Visa Free"], aiMatch: 92, rating: 4.9, desc: "Glaciers, jagged granite towers, condors, and the world's most dramatic hiking circuit.", tags: ["Adventure", "Trekking"], budget: 1800, budgetLabel: "$1,800+", duration: "10–21 days", durationBucket: "14+", bestIn: ["sun"] },
  { name: "Iceland", country: "Iceland", from: "iceland", region: "Europe", badges: ["Trending"], aiMatch: 91, rating: 4.8, desc: "Northern lights, geothermal hot springs, lava fields, waterfalls, and midnight sun.", tags: ["Adventure", "Wellness"], budget: 1600, budgetLabel: "$1,600+", duration: "7–14 days", durationBucket: "7-14", bestIn: ["snow", "sun"] },
  { name: "Queenstown", country: "New Zealand", from: "queenstown", region: "Oceania", badges: [], aiMatch: 90, rating: 4.7, desc: "Bungee jumping birthplace, Milford Sound fjords, skiing, and the most dramatic skylines.", tags: ["Adventure", "Family Friendly"], budget: 1400, budgetLabel: "$1,400+", duration: "7–14 days", durationBucket: "7-14", bestIn: ["snow", "sun"] },
  { name: "Marrakech", country: "Morocco", from: "marrakech", region: "Africa", badges: ["Visa Free"], aiMatch: 89, rating: 4.6, desc: "Labyrinthine souks, hammam rituals, rooftop riads, and the vast Sahara at your doorstep.", tags: ["Culture", "Adventure", "Family Friendly"], budget: 500, budgetLabel: "$500+", duration: "4–8 days", durationBucket: "5-7", bestIn: ["sun"] },
  { name: "Costa Rica", country: "Costa Rica", from: "costarica", region: "Americas", badges: ["Visa Free"], aiMatch: 88, rating: 4.6, desc: "Cloud forests, zip-lining, volcano hikes, sea turtle nesting beaches, and pure vida energy.", tags: ["Adventure", "Family Friendly", "Wellness"], budget: 900, budgetLabel: "$900+", duration: "7–14 days", durationBucket: "7-14", bestIn: ["sun"] },
  { name: "Petra", country: "Jordan", from: "petra", region: "Middle East", badges: [], aiMatch: 87, rating: 4.7, desc: "The rose-red city carved into cliff faces, Bedouin camps, and Wadi Rum's Mars-like dunes.", tags: ["Culture", "Adventure"], budget: 800, budgetLabel: "$800+", duration: "3–7 days", durationBucket: "1-4", bestIn: ["sun"] },
];

const regions = ["All", "Asia", "Europe", "Americas", "Africa", "Oceania", "Middle East", "South America"];
const durationOptions = [
  { key: "any", label: "Any" },
  { key: "1-4", label: "1–4 days" },
  { key: "5-7", label: "5–7 days" },
  { key: "7-14", label: "7–14 days" },
  { key: "14+", label: "14+ days" },
];
const experienceOptions = [
  { key: "Adventure", icon: "adventure" },
  { key: "Wellness", icon: "wellness" },
  { key: "Luxury", icon: "crown" },
  { key: "Family Friendly", icon: "family" },
  { key: "Visa Free", icon: "shield" },
];
const moreOptions = [
  { key: "Romance", icon: "heart" },
  { key: "Culture", icon: "discover" },
  { key: "Trekking", icon: "activity" },
  { key: "Visa Free only", icon: "shield" },
];

const allTagKeys = ["Adventure", "Wellness", "Luxury", "Family Friendly", "Romance", "Culture", "Trekking", "Visa Free"];
const regionKeywords: Record<string, string> = {
  asia: "Asia", europe: "Europe", america: "Americas", americas: "Americas",
  "south america": "South America", africa: "Africa", oceania: "Oceania",
  "middle east": "Middle East", newzealand: "Oceania",
};

interface ParsedQuery {
  regions: string[];
  tags: string[];
  budgetMax?: number;
  durationBucket?: string;
  freeWords: string[];
}

function parseNaturalQuery(raw: string): ParsedQuery {
  const text = raw.toLowerCase().trim();
  const regionsFound: string[] = [];
  Object.entries(regionKeywords).forEach(([kw, region]) => {
    if (text.includes(kw) && !regionsFound.includes(region)) regionsFound.push(region);
  });

  const tagsFound: string[] = [];
  allTagKeys.forEach((tag) => {
    const tagLower = tag.toLowerCase();
    if (text.includes(tagLower) || (tag === "Family Friendly" && text.includes("family")) || (tag === "Visa Free" && text.includes("visa"))) {
      tagsFound.push(tag);
    }
  });

  let budgetMax: number | undefined;
  const underMatch = text.match(/(?:under|below|less than)\s*\$?(\d{3,6})/);
  const dollarMatch = text.match(/\$(\d{3,6})/);
  if (underMatch) budgetMax = parseInt(underMatch[1], 10);
  else if (dollarMatch) budgetMax = parseInt(dollarMatch[1], 10);
  else if (/\b(budget|cheap|affordable|inexpensive)\b/.test(text)) budgetMax = 1000;

  let durationBucket: string | undefined;
  if (/\bweekend\b/.test(text)) durationBucket = "1-4";
  else if (/\b(2|two)\s*-?\s*weeks?\b/.test(text) || /\bmonth\b/.test(text)) durationBucket = "14+";
  else if (/\bweek\b/.test(text)) durationBucket = "5-7";

  const consumedWords = new Set<string>();
  Object.keys(regionKeywords).forEach((kw) => kw.split(" ").forEach((w) => consumedWords.add(w)));
  allTagKeys.forEach((t) => t.toLowerCase().split(" ").forEach((w) => consumedWords.add(w)));
  ["budget", "cheap", "affordable", "inexpensive", "under", "below", "weekend", "week", "weeks", "month", "trip", "to", "in", "a", "for", "family", "visa", "free", "friendly"].forEach((w) => consumedWords.add(w));

  const freeWords = text.split(/\s+/).filter((w) => w && !consumedWords.has(w) && !/^\$?\d+$/.test(w));

  return { regions: regionsFound, tags: tagsFound, budgetMax, durationBucket, freeWords };
}

const nlpPhraseSuggestions = [
  "Beach getaway in Asia",
  "Budget adventure trip",
  "Luxury wellness retreat",
  "Romantic honeymoon in Europe",
  "Family friendly trip to Asia",
  "Visa free adventure",
  "2 week trip to Europe",
  "Weekend trip under $1000",
  "Trekking in South America",
  "Culture trip to the Middle East",
];

function AiMatchRing({ value }: { value: number }) {
  return (
    <div className="ai-ring" style={{ ["--pct" as string]: value }}>
      <span>{value}</span>
    </div>
  );
}

export function DiscoverPage() {
  const { setToast, openWidget } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState((location.state as { initialQuery?: string } | null)?.initialQuery ?? "");
  const [region, setRegion] = useState("All");
  const [sort, setSort] = useState<"match" | "budget" | "rating">("match");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [budgetMax, setBudgetMax] = useState(10000);
  const [duration, setDuration] = useState("any");
  const [experiences, setExperiences] = useState<Set<string>>(new Set());
  const [more, setMore] = useState<Set<string>>(new Set());
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [planner, setPlanner] = useState<string | null>(null);
  const [searchFocus, setSearchFocus] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    function updateColumns() {
      const w = window.innerWidth;
      setColumnCount(w < 700 ? 1 : w < 1100 ? 2 : 4);
    }
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchWrapRef.current?.contains(e.target as HTMLElement)) setSearchFocus(false);
    }
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  useEffect(() => {
    const state = location.state as { initialQuery?: string } | null;
    if (state?.initialQuery) {
      setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSet(setFn: (v: Set<string>) => void, current: Set<string>, key: string) {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFn(next);
  }

  function toggleWishlist(name: string) {
    const isSaved = wishlist.has(name);
    setWishlist((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(name); else next.add(name);
      return next;
    });
    setToast(isSaved ? `Removed ${name} from wishlist` : `Saved ${name} to wishlist`);
  }

  function toggleAdd(d: Dest) {
    const isAdded = planner === d.name;
    setPlanner(isAdded ? null : d.name);
    setToast(isAdded ? `Removed ${d.name} from trip planner` : `Added ${d.name} to trip planner`);
  }

  function resetAll() {
    setBudgetMax(10000);
    setDuration("any");
    setExperiences(new Set());
    setMore(new Set());
    setToast("Filters reset");
  }

  const parsedQuery = useMemo(() => (query.trim() ? parseNaturalQuery(query) : null), [query]);
  const hasStructuredSignal = !!parsedQuery && (parsedQuery.regions.length > 0 || parsedQuery.tags.length > 0 || parsedQuery.budgetMax !== undefined || !!parsedQuery.durationBucket);

  const filtered = useMemo(() => {
    let list = allDestinations.filter((d) => {
      if (region !== "All" && d.region !== region) return false;

      if (parsedQuery) {
        if (hasStructuredSignal) {
          if (parsedQuery.regions.length > 0 && !parsedQuery.regions.includes(d.region)) return false;
          if (parsedQuery.tags.length > 0 && !parsedQuery.tags.every((t) => d.tags.includes(t) || d.badges.includes(t))) return false;
          if (parsedQuery.budgetMax !== undefined && d.budget > parsedQuery.budgetMax) return false;
          if (parsedQuery.durationBucket && d.durationBucket !== parsedQuery.durationBucket) return false;
        } else {
          const q = query.trim().toLowerCase();
          if (!d.name.toLowerCase().includes(q) && !d.country.toLowerCase().includes(q) && !d.desc.toLowerCase().includes(q) && !d.tags.some((t) => t.toLowerCase().includes(q))) return false;
        }
      }

      if (d.budget > budgetMax) return false;
      if (duration !== "any" && d.durationBucket !== duration) return false;
      if (experiences.size > 0 && ![...experiences].some((e) => d.tags.includes(e) || d.badges.includes(e))) return false;
      if (more.has("Visa Free only") && !d.badges.includes("Visa Free")) return false;
      const moreTags = [...more].filter((m) => m !== "Visa Free only");
      if (moreTags.length > 0 && !moreTags.some((m) => d.tags.includes(m))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "match") return b.aiMatch - a.aiMatch;
      if (sort === "budget") return a.budget - b.budget;
      return b.rating - a.rating;
    });
    return list;
  }, [region, query, parsedQuery, hasStructuredSignal, budgetMax, duration, experiences, more, sort]);

  const activeFilterCount = (budgetMax < 10000 ? 1 : 0) + (duration !== "any" ? 1 : 0) + experiences.size + more.size;

  return (
    <>
      <section className="discover-hero">
        <div className="discover-hero-content">
          <span className="hero-badge">✦ AI-powered destination matching</span>
          <h1>Discover Your Next <span>Adventure</span></h1>
          <p>{allDestinations.length} curated destinations · Matched to your travel style</p>
          <div className="discover-search-wrap" ref={searchWrapRef}>
            <form
              className="discover-search"
              onSubmit={(e) => {
                e.preventDefault();
                setSearchFocus(false);
                if (!query.trim()) return;
                if (filtered.length > 0) gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                else openWidget(`Find me a trip: ${query}`);
              }}
            >
              <NavIcon.search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onClick={() => setSearchFocus(true)}
                placeholder="Search destinations, countries, experiences… e.g. 'Beach Asia budget'"
                autoComplete="off"
              />
              {query && (
                <button type="button" className="discover-search-clear" aria-label="Clear search" onClick={() => setQuery("")}><NavIcon.close /></button>
              )}
              <button type="button" className="discover-ask-ai" onClick={() => openWidget(query.trim() ? `Find me a trip: ${query}` : undefined)}><NavIcon.sparkle /> Ask AI</button>
            </form>
            {searchFocus && (() => {
              const q = query.trim().toLowerCase();
              const destPool = Array.from(new Set(allDestinations.flatMap((d) => [d.name, d.country])));
              const destMatches = q ? destPool.filter((p) => p.toLowerCase().includes(q)).slice(0, 4) : [];
              const phrasePool = nlpPhraseSuggestions;
              const phraseMatches = q ? phrasePool.filter((p) => p.toLowerCase().includes(q)).slice(0, 4) : phrasePool.slice(0, 6);
              const items = [...destMatches, ...phraseMatches].slice(0, 7);
              if (items.length === 0) return null;
              return (
                <div className="discover-autocomplete">
                  <p className="discover-autocomplete-label">{q ? "Suggestions" : "Try asking naturally"}</p>
                  {items.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="discover-autocomplete-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setQuery(s); setSearchFocus(false); setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                    >
                      <NavIcon.sparkle /> {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
          {query.trim() && (
            <p className="discover-search-hint">
              {filtered.length > 0
                ? `${filtered.length} destination${filtered.length === 1 ? "" : "s"} match "${query}" — press Enter to jump down`
                : `No matches for "${query}" — try Ask AI for something the filters can't find`}
            </p>
          )}
        </div>
      </section>

      <div className="discover-toolbar">
        <div className="discover-regions">
          {regions.map((r) => (
            <button key={r} className={region === r ? "active" : ""} onClick={() => setRegion(r)}>{r}</button>
          ))}
          <span className="discover-divider" />
          <button className={filtersOpen ? "discover-filters-btn active" : "discover-filters-btn"} onClick={() => setFiltersOpen((v) => !v)}>
            <NavIcon.sliders /> Filters{activeFilterCount > 0 && <i>{activeFilterCount}</i>}
          </button>
        </div>
        <div className="discover-sort">
          <button className={sort === "match" ? "active" : ""} onClick={() => setSort("match")}>AI Match</button>
          <button className={sort === "budget" ? "active" : ""} onClick={() => setSort("budget")}>Budget</button>
          <button className={sort === "rating" ? "active" : ""} onClick={() => setSort("rating")}>Rating</button>
          <span className="discover-count">{filtered.length} of {allDestinations.length}</span>
        </div>
      </div>

      {filtersOpen && (
        <div className="discover-filters">
          <div className="discover-filters-head">
            <h3><NavIcon.sliders /> Filters</h3>
            <div>
              <button className="reset-all" onClick={resetAll}><NavIcon.reset /> Reset all</button>
              <button className="close-filters" onClick={() => setFiltersOpen(false)}><NavIcon.close /></button>
            </div>
          </div>
          <div className="discover-filters-grid">
            <div>
              <h4>Budget (per person)</h4>
              <div className="budget-range">
                <span>$0</span>
                <span>${budgetMax.toLocaleString()}{budgetMax === 10000 ? "+" : ""}</span>
              </div>
              <input type="range" min={0} max={10000} step={100} value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} />
            </div>
            <div>
              <h4>Duration</h4>
              <div className="filter-list">
                {durationOptions.map((o) => (
                  <button key={o.key} className={duration === o.key ? "active" : ""} onClick={() => setDuration(o.key)}>
                    {o.label} {duration === o.key && <NavIcon.check />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4>Experience</h4>
              <div className="filter-list">
                {experienceOptions.map((o) => {
                  const Icon = NavIcon[o.icon as keyof typeof NavIcon];
                  return (
                    <button key={o.key} className={experiences.has(o.key) ? "active" : ""} onClick={() => toggleSet(setExperiences, experiences, o.key)}>
                      <Icon /> {o.key}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h4>More Filters</h4>
              <div className="filter-list">
                {moreOptions.map((o) => {
                  const Icon = NavIcon[o.icon as keyof typeof NavIcon];
                  return (
                    <button key={o.key} className={more.has(o.key) ? "active" : ""} onClick={() => toggleSet(setMore, more, o.key)}>
                      <Icon /> {o.key}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="discover-grid-section" ref={gridRef}>
        {filtered.length === 0 ? (
          <p className="discover-empty">No destinations match your filters. Try widening your search.</p>
        ) : (() => {
          const effectiveColumns = Math.max(1, Math.min(columnCount, filtered.length));
          return (
          <div className="discover-grid">
            {Array.from({ length: effectiveColumns }, (_, colIdx) => (
              <div className="discover-col" key={colIdx}>
                {filtered.filter((_, i) => i % effectiveColumns === colIdx).map((d) => (
                  <article key={d.name} className="discover-card">
                    <div className="discover-card-media">
                      <DestImage from={d.from} />
                      <div className="discover-card-badges">
                        {d.badges.map((b) => <span key={b} className={`disc-badge disc-badge-${b.replace(/\s/g, "").toLowerCase()}`}>{b === "Visa Free" && <NavIcon.shield />} {b}</span>)}
                      </div>
                      <button className={wishlist.has(d.name) ? "discover-wish active" : "discover-wish"} aria-label="Save" onClick={() => toggleWishlist(d.name)}><NavIcon.heart /></button>
                      <div className="discover-card-foot">
                        <span className="disc-match"><NavIcon.sparkle /> AI Match {d.aiMatch}%</span>
                        <span className="disc-rating"><NavIcon.star /> {d.rating}</span>
                      </div>
                    </div>
                    <div className="discover-card-body">
                      <div className="discover-card-title">
                        <div>
                          <h3>{d.name}</h3>
                          <p className="disc-country"><NavIcon.location /> {d.country}</p>
                        </div>
                        <AiMatchRing value={d.aiMatch} />
                      </div>
                      <p className="disc-desc">{d.desc}</p>
                      <div className="disc-tags">
                        {d.tags.map((t) => <span key={t}>{t}</span>)}
                      </div>
                      <div className="disc-stats">
                        <div><span>Budget</span><strong>{d.budgetLabel}</strong></div>
                        <div><span>Duration</span><strong>{d.duration}</strong></div>
                        <div>
                          <span>Best In</span>
                          <strong className="disc-besticons">
                            {d.bestIn.map((b) => <span key={b}>{b === "snow" ? "❄" : "☀"}</span>)}
                          </strong>
                        </div>
                      </div>
                      <div className="disc-actions">
                        <button className="disc-explore" onClick={() => openWidget(`Plan a trip to ${d.name}, ${d.country}`)}><NavIcon.discover /> Explore</button>
                        <button className={planner === d.name ? "disc-add active" : "disc-add"} onClick={() => toggleAdd(d)}>{planner === d.name ? <><NavIcon.check /> Added</> : <>+ Add</>}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
          );
        })()}
      </section>
    </>
  );
}
