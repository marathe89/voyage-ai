import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { AirportInput } from "./AirportInput";
import { DatePicker } from "./DatePicker";
import { optionsByStep, AirlineLogo, stripNextDay } from "./BookingPage";
import { useCurrency } from "./currency";

const tryAsking = [
  "Plan a 10-day Japan family trip in October under $4,000",
  "Romantic 7-day Europe itinerary for 2 under $3,000",
  "Solo backpacking Southeast Asia for 21 days, budget traveler",
  "Best beaches in Southeast Asia for December",
  "Luxury Maldives honeymoon 5 nights all-inclusive",
  "Adventure Peru & Machu Picchu 12 days",
];

const aiFeatures = [
  { icon: "sparkle" as const, color: "#3c7ef2", title: "Natural language planning", desc: "Just type your dream trip — AI handles flights, hotels, activities, visa, weather, and budget automatically." },
  { icon: "lightning" as const, color: "#9c6fe0", title: "One-prompt itinerary", desc: "\"Plan 10 days Japan under $4,000 with hiking & spa\" → complete trip in seconds, no forms needed." },
  { icon: "trendUp" as const, color: "#4bb383", title: "AI price optimization", desc: "AI tracks 200+ signals to lock in the best fares before they rise. Average savings: $8,400/trip." },
  { icon: "shield" as const, color: "#e5a13c", title: "Proactive monitoring", desc: "Delays, weather, price drops, advisories — AI acts before you ask. Fully managed concierge experience." },
];

const manualTabs = [
  { key: "flight", icon: "plane" as const, label: "Flight Search" },
  { key: "hotel", icon: "hotel" as const, label: "Hotel Search" },
  { key: "multi", icon: "globe" as const, label: "Multi-City" },
  { key: "compare", icon: "barChart" as const, label: "Price Comparison" },
];

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

const compareRows = [
  { platform: "VoyageAI", dot: "#3c7ef2", badge: "Best Overall", badgeKind: "blue", flight: "$13,100", hotel: "$18,400", total: "$31,500", extraTotal: "+$18,600 more", extras: "Free cancellation" },
  { platform: "MakeMyTrip", dot: "#e5a13c", badge: "", badgeKind: "", flight: "$14,200", hotel: "$19,800", total: "$34,000", extraTotal: "+$21,100 more", extras: "$500 convenience fee" },
  { platform: "Booking.com", dot: "#3c7ef2", badge: "Cheapest Hotel", badgeKind: "green", flight: "—", hotel: "$17,200", total: "$17,200", extraTotal: "+$4,300 more", extras: "Free cancellation" },
  { platform: "Expedia", dot: "#f2c33c", badge: "", badgeKind: "", flight: "$13,800", hotel: "$20,100", total: "$33,900", extraTotal: "+$21,000 more", extras: "Bundle discount -5%" },
  { platform: "Skyscanner", dot: "#4bb383", badge: "Cheapest", badgeKind: "green-inline", flight: "$12,900", hotel: "—", total: "$12,900", extraTotal: "✓ Cheapest", extras: "Price alert available" },
];

export function PlanTripPage() {
  const { setToast, openWidget, tripInput, setTripInput } = useShell();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [manualTab, setManualTab] = useState("flight");
  const [tripType, setTripType] = useState<"round" | "one">("round");
  const [from, setFrom] = useState("Mumbai (BOM)");
  const [to, setTo] = useState("Tokyo (NRT)");
  const [departDate, setDepartDate] = useState("2026-10-10");
  const [returnDate, setReturnDate] = useState("2026-10-20");
  const [cabin, setCabin] = useState("Economy/Premium Economy");
  const [passengers, setPassengers] = useState(4);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [nonStopOnly, setNonStopOnly] = useState(false);
  const [nonStopOnlyReturn, setNonStopOnlyReturn] = useState(false);
  const [flightSort, setFlightSort] = useState<"cheapest" | "fastest">("cheapest");
  const [flightAirlineFilter, setFlightAirlineFilter] = useState<Set<string>>(new Set());
  const [onwardDepartFilter, setOnwardDepartFilter] = useState<Set<string>>(new Set());
  const [onwardArriveFilter, setOnwardArriveFilter] = useState<Set<string>>(new Set());
  const [returnDepartFilter, setReturnDepartFilter] = useState<Set<string>>(new Set());
  const [returnArriveFilter, setReturnArriveFilter] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState(Math.max(...optionsByStep.flights.map((o) => o.price)));
  const [maxDuration, setMaxDuration] = useState(Math.max(...optionsByStep.flights.map((o) => durationMinutes(o.duration))));
  const [airlinesExpanded, setAirlinesExpanded] = useState(false);
  const [layoverExpandedOnward, setLayoverExpandedOnward] = useState(false);
  const [layoverExpandedReturn, setLayoverExpandedReturn] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedReturnFlightId, setSelectedReturnFlightId] = useState<string | null>(null);
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
  const [activeDateIdx, setActiveDateIdx] = useState(2);
  const flightResultsRef = useRef<HTMLDivElement>(null);
  const hotelResultsRef = useRef<HTMLDivElement>(null);
  const [rooms, setRooms] = useState(2);
  const [guests, setGuests] = useState(4);
  const [hotelAdults, setHotelAdults] = useState(4);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [hotelDest, setHotelDest] = useState("Tokyo, Japan");
  const [hotelGuestsOpen, setHotelGuestsOpen] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("2026-10-11");
  const [hotelCheckOut, setHotelCheckOut] = useState("2026-10-14");
  const [hotelSearchQuery, setHotelSearchQuery] = useState("Tokyo, Japan");
  const [hotelSearch, setHotelSearch] = useState("");
  const [hotelSort, setHotelSort] = useState<"recommended" | "priceLowHigh" | "rating">("recommended");
  const [hotelDeal, setHotelDeal] = useState<"all" | "topPicks" | "jackpot" | "luxury" | "steal">("all");
  const [hotelStar, setHotelStar] = useState<"all" | "5" | "4" | "3">("all");
  const [hotelMinRating, setHotelMinRating] = useState<"all" | "4" | "4.5">("all");
  const [hotelArea, setHotelArea] = useState("all");
  const [allHotelFiltersOpen, setAllHotelFiltersOpen] = useState(false);
  const [hotelPillOpen, setHotelPillOpen] = useState<"sort" | "deals" | "star" | "rating" | "location" | null>(null);
  const [hotelExpanded, setHotelExpanded] = useState<Record<string, boolean>>({});
  const [shortlistedHotels, setShortlistedHotels] = useState<Set<string>>(new Set());
  function toggleHotelShortlist(id: string, title: string) {
    setShortlistedHotels((prev) => {
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
  const [selectedPlatform, setSelectedPlatform] = useState("VoyageAI");
  const [multiCity, setMultiCity] = useState([
    { from: "Mumbai (BOM)", to: "Tokyo (NRT)" },
    { from: "Tokyo (NRT)", to: "Osaka (KIX)" },
    { from: "Osaka (KIX)", to: "Mumbai (BOM)" },
  ]);

  const cities = ["Mumbai", ...multiCity.map((s) => s.to.split(" (")[0])];

  const { formatPriceString } = useCurrency();
  const hotelAreas = useMemo(() => [...new Set(optionsByStep.hotels.map((o) => o.infoLines?.[0]?.text.split(" · ")[0] ?? "").filter(Boolean))], []);
  function hotelDiscountPct(o: (typeof optionsByStep.hotels)[number]) {
    return o.saveAmount ? Math.round((o.saveAmount / (o.price + o.saveAmount)) * 100) : 0;
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

  const flightAirlines = [...new Set(optionsByStep.flights.map((o) => o.title))];
  function toggleFlightAirline(a: string) {
    toggleInSet(setFlightAirlineFilter, a);
  }
  function toggleInSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }
  const flightPriceBounds = {
    min: Math.min(...optionsByStep.flights.map((o) => o.price)),
    max: Math.max(...optionsByStep.flights.map((o) => o.price)),
  };
  const flightDurationBounds = {
    min: Math.min(...optionsByStep.flights.map((o) => durationMinutes(o.duration))),
    max: Math.max(...optionsByStep.flights.map((o) => durationMinutes(o.duration))),
  };
  const routeFromCity = from.split(" (")[0];
  const routeToCity = to.split(" (")[0];
  const onwardRouteLabel = `${from} → ${to}`;
  const returnRouteLabel = `${to} → ${from}`;
  function clearAllFlightFilters() {
    setNonStopOnly(false);
    setNonStopOnlyReturn(false);
    setFlightAirlineFilter(new Set());
    setOnwardDepartFilter(new Set());
    setOnwardArriveFilter(new Set());
    setReturnDepartFilter(new Set());
    setReturnArriveFilter(new Set());
    setMaxPrice(flightPriceBounds.max);
    setMaxDuration(flightDurationBounds.max);
  }
  const filteredFlights = optionsByStep.flights
    .filter((o) => {
      if ((nonStopOnly || nonStopOnlyReturn) && o.stops !== "Non-stop") return false;
      if (flightAirlineFilter.size && !flightAirlineFilter.has(o.title)) return false;
      if (o.price > maxPrice) return false;
      if (durationMinutes(o.duration) > maxDuration) return false;
      if (onwardDepartFilter.size && !onwardDepartFilter.has(timeBucket(o.depart?.time) ?? "")) return false;
      if (onwardArriveFilter.size && !onwardArriveFilter.has(timeBucket(o.arrive?.time) ?? "")) return false;
      if (returnDepartFilter.size && !returnDepartFilter.has(timeBucket(o.returnLeg?.depart.time) ?? "")) return false;
      if (returnArriveFilter.size && !returnArriveFilter.has(timeBucket(o.returnLeg?.arrive.time) ?? "")) return false;
      return true;
    })
    .sort((a, b) => (flightSort === "cheapest" ? a.price - b.price : 0));
  const dateStripDays = [
    { label: "Sun, Oct 25", price: 5000 },
    { label: "Mon, Oct 26", price: 5733 },
    { label: "Tue, Oct 27", price: 6466 },
    { label: "Wed, Oct 28", price: 7199 },
    { label: "Thu, Oct 29", price: 7932 },
    { label: "Fri, Oct 30", price: 8665 },
  ];

  function addFlight() {
    const lastTo = multiCity[multiCity.length - 1]?.to ?? "";
    setMultiCity([...multiCity, { from: lastTo, to: "" }]);
  }
  function removeFlight(i: number) {
    setMultiCity(multiCity.filter((_, idx) => idx !== i));
  }

  const flightResultsPanel = (
              <div className="ctr" ref={flightResultsRef}>
                <div className="ctr-datestrip">
                  {dateStripDays.map((d, i) => (
                    <button key={d.label} className={i === activeDateIdx ? "active" : ""} onClick={() => setActiveDateIdx(i)}>
                      <span>{d.label}</span>
                      <strong>${d.price.toLocaleString()}</strong>
                    </button>
                  ))}
                </div>

                <div className="ctr-toolbar">
                  <span className="ctr-count">{filteredFlights.length} of {optionsByStep.flights.length} flights</span>
                  {(nonStopOnly || nonStopOnlyReturn) && <span className="ctr-chip-filter">Non-stop <button onClick={() => { setNonStopOnly(false); setNonStopOnlyReturn(false); }} aria-label="Remove non-stop filter"><NavIcon.close /></button></span>}
                  {[...flightAirlineFilter].map((a) => (
                    <span key={a} className="ctr-chip-filter">{a} <button onClick={() => toggleFlightAirline(a)} aria-label={`Remove ${a} filter`}><NavIcon.close /></button></span>
                  ))}
                  {(nonStopOnly || nonStopOnlyReturn || flightAirlineFilter.size > 0 || onwardDepartFilter.size > 0 || onwardArriveFilter.size > 0 || returnDepartFilter.size > 0 || returnArriveFilter.size > 0 || maxPrice < flightPriceBounds.max || maxDuration < flightDurationBounds.max) && (
                    <button className="ctr-clear-all" onClick={clearAllFlightFilters}>Clear all filters</button>
                  )}
                  <div className="ctr-sort">
                    <button className={flightSort === "cheapest" ? "active" : ""} onClick={() => setFlightSort("cheapest")}><NavIcon.dollar /> Cheapest</button>
                    <button className={flightSort === "fastest" ? "active" : ""} onClick={() => setFlightSort("fastest")}><NavIcon.clock /> Fastest</button>
                  </div>
                </div>

                <div className="ctr-body">
                  <aside className="ctr-filters">
                    <div className="ctr-filter-group">
                      <div className="ctr-filter-head-row"><p className="ctr-filter-head">Stops</p><button className="ctr-filter-clear" onClick={() => { setNonStopOnly(false); setNonStopOnlyReturn(false); }}>Clear</button></div>
                      {([
                        { label: `Stops from ${from.split(" (")[0]}`, active: nonStopOnly, setActive: setNonStopOnly },
                        { label: `Stops from ${to.split(" (")[0]}`, active: nonStopOnlyReturn, setActive: setNonStopOnlyReturn },
                      ]).map(({ label, active, setActive }) => (
                        <div key={label} className="ctr-filter-sub">
                          <p className="ctr-filter-sub-head">{label}</p>
                          <div className="ctr-chip-row">
                            {["Non Stop", "1 Stop"].map((s) => {
                              const cheapest = Math.min(...optionsByStep.flights.filter((o) => (s === "Non Stop" ? o.stops === "Non-stop" : o.stops === "1 stop")).map((o) => o.price));
                              return (
                                <button key={s} type="button" className={active && s === "Non Stop" ? "ctr-chip active" : "ctr-chip"} onClick={() => setActive(s === "Non Stop" ? !active : false)}>
                                  <strong>{s}</strong>
                                  <em>{Number.isFinite(cheapest) ? `$${cheapest.toLocaleString()}` : "—"}</em>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ctr-filter-group">
                      <p className="ctr-filter-head">Baggage</p>
                      {[`${from} → ${to}`, `${to} → ${from}`].map((label) => (
                        <div key={label} className="ctr-filter-sub">
                          <p className="ctr-filter-sub-head">{label}</p>
                          <label className="ctr-check">
                            <input type="checkbox" onChange={() => setToast("Showing fares with check-in baggage included")} /> Include check-in baggage
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="ctr-filter-group">
                      <div className="ctr-filter-head-row"><p className="ctr-filter-head">Airlines</p><button className="ctr-filter-clear" onClick={() => setFlightAirlineFilter(new Set())}>Clear</button></div>
                      {[`${from} → ${to}`, `${to} → ${from}`].map((label) => (
                        <div key={label} className="ctr-filter-sub">
                          <p className="ctr-filter-sub-head">{label}</p>
                          {(airlinesExpanded ? flightAirlines : flightAirlines.slice(0, 3)).map((a) => {
                            const cheapest = Math.min(...optionsByStep.flights.filter((o) => o.title === a).map((o) => o.price));
                            return (
                              <label key={a} className="ctr-check">
                                <input type="checkbox" checked={flightAirlineFilter.has(a)} onChange={() => toggleFlightAirline(a)} />
                                {a}
                                <em>${cheapest.toLocaleString()}</em>
                              </label>
                            );
                          })}
                          {flightAirlines.length > 3 && (
                            <button type="button" className="ctr-show-more" onClick={() => setAirlinesExpanded((v) => !v)}>
                              {airlinesExpanded ? "Show less" : `Show ${flightAirlines.length - 3} more airlines`}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="ctr-filter-group">
                      <div className="ctr-filter-head-row"><p className="ctr-filter-head">Timings</p><button className="ctr-filter-clear" onClick={() => { setOnwardDepartFilter(new Set()); setOnwardArriveFilter(new Set()); setReturnDepartFilter(new Set()); setReturnArriveFilter(new Set()); }}>Clear</button></div>
                      <div className="ctr-filter-sub">
                        <p className="ctr-filter-sub-head">{onwardRouteLabel}</p>
                        <p className="ctr-filter-mini-head">Taking off from {routeFromCity}</p>
                        {timeBucketOptions.map((t) => (
                          <label key={t.label} className="ctr-check ctr-check-timing">
                            <input type="checkbox" checked={onwardDepartFilter.has(t.label)} onChange={() => toggleInSet(setOnwardDepartFilter, t.label)} /> {t.label} <span>{t.hint}</span>
                          </label>
                        ))}
                        <p className="ctr-filter-mini-head">Landing in {routeToCity}</p>
                        {timeBucketOptions.map((t) => (
                          <label key={t.label} className="ctr-check ctr-check-timing">
                            <input type="checkbox" checked={onwardArriveFilter.has(t.label)} onChange={() => toggleInSet(setOnwardArriveFilter, t.label)} /> {t.label} <span>{t.hint}</span>
                          </label>
                        ))}
                      </div>
                      <div className="ctr-filter-sub">
                        <p className="ctr-filter-sub-head">{returnRouteLabel}</p>
                        <p className="ctr-filter-mini-head">Taking off from {routeToCity}</p>
                        {timeBucketOptions.map((t) => (
                          <label key={t.label} className="ctr-check ctr-check-timing">
                            <input type="checkbox" checked={returnDepartFilter.has(t.label)} onChange={() => toggleInSet(setReturnDepartFilter, t.label)} /> {t.label} <span>{t.hint}</span>
                          </label>
                        ))}
                        <p className="ctr-filter-mini-head">Landing in {routeFromCity}</p>
                        {timeBucketOptions.map((t) => (
                          <label key={t.label} className="ctr-check ctr-check-timing">
                            <input type="checkbox" checked={returnArriveFilter.has(t.label)} onChange={() => toggleInSet(setReturnArriveFilter, t.label)} /> {t.label} <span>{t.hint}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="ctr-filter-group">
                      <div className="ctr-filter-head-row"><p className="ctr-filter-head">Flight Prices</p><button className="ctr-filter-clear" onClick={() => setMaxPrice(flightPriceBounds.max)}>Clear</button></div>
                      <div className="ctr-filter-sub">
                        <p className="ctr-filter-sub-head">{onwardRouteLabel}</p>
                        <p className="ctr-range-label">${flightPriceBounds.min.toLocaleString()} - ${maxPrice.toLocaleString()}</p>
                        <input type="range" min={flightPriceBounds.min} max={flightPriceBounds.max} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="ctr-filter-group">
                      <div className="ctr-filter-head-row"><p className="ctr-filter-head">Duration</p><button className="ctr-filter-clear" onClick={() => setMaxDuration(flightDurationBounds.max)}>Clear</button></div>
                      <div className="ctr-filter-sub">
                        <p className="ctr-filter-sub-head">{onwardRouteLabel}</p>
                        <p className="ctr-range-label">Travel Time: Under {Math.round(maxDuration / 60)} hrs</p>
                        <input type="range" min={flightDurationBounds.min} max={flightDurationBounds.max} value={maxDuration} onChange={(e) => setMaxDuration(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="ctr-filter-group">
                      <p className="ctr-filter-head">Layover Airport</p>
                      {([
                        { label: onwardRouteLabel, expanded: layoverExpandedOnward, setExpanded: setLayoverExpandedOnward },
                        { label: returnRouteLabel, expanded: layoverExpandedReturn, setExpanded: setLayoverExpandedReturn },
                      ]).map(({ label, expanded, setExpanded }) => (
                        <div key={label} className="ctr-filter-sub">
                          <p className="ctr-filter-sub-head">{label}</p>
                          <p className="ctr-filter-mini-head">India</p>
                          {(expanded ? layoverAirports : layoverAirports.slice(0, 5)).map((a) => (
                            <label key={a} className="ctr-check">
                              <input type="checkbox" onChange={() => setToast(`Filtering layovers via ${a}`)} /> {a}
                            </label>
                          ))}
                          <button type="button" className="ctr-show-more" onClick={() => setExpanded(!expanded)}>
                            {expanded ? "Show less" : `+ ${layoverAirports.length - 5} more layover airports`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="ctr-results">
                    {filteredFlights.length === 0 && (
                      <p className="ctr-empty">No flights match these filters — try clearing one.</p>
                    )}
                    {filteredFlights.map((opt) => {
                      const isOutboundSelected = selectedFlightId === opt.id;
                      const isReturnSelected = selectedReturnFlightId === opt.id;
                      const pairSelected = isOutboundSelected || isReturnSelected;
                      const outboundKey = `${opt.id}-out`;
                      const returnKey = `${opt.id}-return`;
                      const isOutboundShortlisted = shortlistedFlights.has(outboundKey);
                      const isReturnShortlisted = shortlistedFlights.has(returnKey);
                      return (
                        <div key={opt.id} className={pairSelected ? "ctr-pair selected" : "ctr-pair"}>
                          <div className="ctr-leg-wrap">
                            <button
                              className={isOutboundSelected ? "ctr-leg selected" : "ctr-leg"}
                              onClick={() => {
                                if (isOutboundSelected) {
                                  setSelectedFlightId(null);
                                  setSelectedReturnFlightId(null);
                                } else {
                                  setSelectedFlightId(opt.id);
                                  setSelectedReturnFlightId(opt.returnLeg ? opt.id : null);
                                }
                              }}
                            >
                              <span className="ctr-leg-head">
                                <AirlineLogo name={opt.title} />
                                <strong>{opt.title}</strong>
                                {opt.badge === "recommended" && <em className="ctr-ai-pick"><NavIcon.sparkle /> AI Pick</em>}
                              </span>
                              <span className="ctr-leg-times">
                                <strong>{stripNextDay(opt.depart?.time)}</strong>
                                <span className="ctr-leg-dur">{opt.duration}<em>{opt.stops}</em></span>
                                <strong>{stripNextDay(opt.arrive?.time)}</strong>
                              </span>
                              <span className="ctr-fare-row">
                                <span>{opt.fareTier} fare</span>
                                <strong>{opt.priceLabel}</strong>
                              </span>
                              {opt.policy && <span className={`ctr-refund ${opt.policy.kind}`}>{opt.policy.text}</span>}
                              {isOutboundSelected && <span className="ctr-selected-badge"><NavIcon.check /> Selected</span>}
                            </button>
                            <button
                              type="button"
                              className={isOutboundShortlisted ? "ctr-shortlist-btn active" : "ctr-shortlist-btn"}
                              onClick={() => toggleFlightShortlist(outboundKey, opt.title)}
                            >
                              {isOutboundShortlisted ? "Shortlisted" : "Shortlist"}
                            </button>
                          </div>
                          {opt.returnLeg && (
                            <div className="ctr-leg-wrap">
                              <button
                                className={isReturnSelected ? "ctr-leg ctr-leg-return selected" : "ctr-leg ctr-leg-return"}
                                onClick={() => {
                                  if (isReturnSelected) {
                                    setSelectedReturnFlightId(null);
                                    setSelectedFlightId(null);
                                  } else {
                                    setSelectedReturnFlightId(opt.id);
                                    setSelectedFlightId(opt.id);
                                  }
                                }}
                              >
                                <span className="ctr-leg-head"><AirlineLogo name={opt.returnLeg.airline} /><strong>{opt.returnLeg.airline}</strong></span>
                                <span className="ctr-leg-times">
                                  <strong>{stripNextDay(opt.returnLeg.depart.time)}</strong>
                                  <span className="ctr-leg-dur">{opt.returnLeg.duration}<em>{opt.returnLeg.stops}</em></span>
                                  <strong>{stripNextDay(opt.returnLeg.arrive.time)}</strong>
                                </span>
                                <span className="ctr-fare-row"><span>Included round trip</span></span>
                                {isReturnSelected && <span className="ctr-selected-badge"><NavIcon.check /> Selected</span>}
                              </button>
                              <button
                                type="button"
                                className={isReturnShortlisted ? "ctr-shortlist-btn active" : "ctr-shortlist-btn"}
                                onClick={() => toggleFlightShortlist(returnKey, opt.returnLeg!.airline)}
                              >
                                {isReturnShortlisted ? "Shortlisted" : "Shortlist"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
  );

  return (
    <div className="plan-page">
      <div className="plan-header">
        <h1>Plan Your Trip</h1>
        <p>Choose between AI-powered planning or full manual control.</p>
        <div className="plan-mode-toggle">
          <button className={mode === "ai" ? "active" : ""} onClick={() => setMode("ai")}>
            <span className="plan-mode-icon"><NavIcon.sparkle /></span>
            <span className="plan-mode-text"><strong>AI Concierge</strong><em>Instant &amp; smart</em></span>
            {mode === "ai" && <span className="plan-mode-check"><NavIcon.check /></span>}
          </button>
          <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>
            <span className="plan-mode-icon"><NavIcon.sliders /></span>
            <span className="plan-mode-text"><strong>Manual Planning</strong><em>Full control</em></span>
            {mode === "manual" && <span className="plan-mode-check"><NavIcon.check /></span>}
          </button>
        </div>
        <p className="plan-mode-hint">
          {mode === "ai"
            ? <><NavIcon.lightning /> Plan any trip in 10 seconds with natural language</>
            : <><NavIcon.list /> Search flights, hotels, multi-city, and compare prices manually</>}
        </p>
      </div>

      {mode === "ai" ? (
        <div className="plan-body">
          <div className="plan-ai-card">
            <div className="plan-ai-card-head">
              <span className="plan-ai-card-icon"><NavIcon.sparkle /></span>
              <strong>VoyageAI Concierge</strong>
              <span className="fy-live">Live</span>
            </div>
            <p>Describe your perfect trip in plain language. AI instantly plans flights, hotels, activities, visa, and budget — no forms, no filters.</p>
            <form
              className="plan-ai-input"
              onSubmit={(e) => {
                e.preventDefault();
                if (tripInput.trim()) navigate("/concierge", { state: { initialPrompt: tripInput.trim() } });
                else openWidget();
              }}
            >
              <input
                value={tripInput}
                onChange={(e) => setTripInput(e.target.value)}
                placeholder="e.g. Plan a 10-day family trip to Japan in October under $4,000 with hiking and spa experiences…"
              />
              <button type="submit"><NavIcon.sparkle /> Plan My Trip</button>
            </form>
          </div>

          <p className="plan-try-label">Try Asking</p>
          <div className="plan-try-grid">
            {tryAsking.map((t) => (
              <button key={t} className="plan-try-pill" onClick={() => { setTripInput(t); openWidget(t); }}>
                <NavIcon.sparkle /> {t}
              </button>
            ))}
          </div>

          <div className="plan-feature-grid">
            {aiFeatures.map((f) => {
              const Icon = NavIcon[f.icon];
              return (
                <div key={f.title} className="plan-feature-card">
                  <span className="plan-feature-icon" style={{ background: f.color }}><Icon /></span>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="plan-footer-cta">
            <button className="dash-btn-primary" onClick={() => openWidget()}><NavIcon.sparkle /> Open Full AI Concierge</button>
            <span>vs 2 hrs of manual searching</span>
          </div>
        </div>
      ) : (
        <div className="plan-body">
          <div className="plan-manual-tabs">
            {manualTabs.map((t) => {
              const Icon = NavIcon[t.icon];
              return (
                <button key={t.key} className={manualTab === t.key ? "active" : ""} onClick={() => setManualTab(t.key)}>
                  <Icon /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="plan-manual-panel">
            {manualTab === "flight" && (
              <>
              <div className="ct-search">
                <div className="ct-searchbar">
                  <div className="ct-sb-field ct-sb-triptype">
                    <button type="button" onClick={() => { setTripTypeOpen((v) => !v); setTravelersOpen(false); }}>
                      {tripType === "one" ? "One way" : "Round trip"} <NavIcon.chevronDown />
                    </button>
                    {tripTypeOpen && (
                      <div className="ct-sb-pop ct-sb-triptype-pop" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={tripType === "one" ? "active" : ""} onClick={() => { setTripType("one"); setTripTypeOpen(false); }}>One way</button>
                        <button type="button" className={tripType === "round" ? "active" : ""} onClick={() => { setTripType("round"); setTripTypeOpen(false); }}>Round trip</button>
                      </div>
                    )}
                  </div>

                  <div className="ct-sb-field ct-sb-airport">
                    <AirportInput value={from} onChange={setFrom} />
                  </div>
                  <button className="ct-swap ct-sb-swap" aria-label="Swap" onClick={() => { const f = from; setFrom(to); setTo(f); }}><NavIcon.swap /></button>
                  <div className="ct-sb-field ct-sb-airport">
                    <AirportInput value={to} onChange={setTo} />
                  </div>

                  <div className="ct-sb-field ct-sb-date">
                    <DatePicker value={departDate} onChange={setDepartDate} />
                  </div>
                  <div className="ct-sb-field ct-sb-date">
                    <DatePicker value={returnDate} onChange={setReturnDate} min={departDate} disabled={tripType === "one"} />
                    {returnDate && tripType === "round" && <button type="button" aria-label="Clear return date" onClick={(e) => { e.stopPropagation(); setReturnDate(""); }}><NavIcon.close /></button>}
                  </div>

                  <div className="ct-sb-field ct-sb-travelers">
                    <button type="button" onClick={() => { setTravelersOpen((v) => !v); setTripTypeOpen(false); }}>
                      {passengers + children + infants} Traveller{passengers + children + infants === 1 ? "" : "s"}, {cabin} <NavIcon.chevronDown />
                    </button>
                    {travelersOpen && (
                      <div className="ct-sb-pop ct-travelers-pop" onClick={(e) => e.stopPropagation()}>
                        <p className="ct-travelers-head">Travellers</p>
                        <div className="ct-traveler-row">
                          <div><strong>Adult</strong><span>12+ Years</span></div>
                          <div className="plan-stepper">
                            <button aria-label="Decrease adults" onClick={() => setPassengers((p) => Math.max(1, p - 1))}><NavIcon.minus /></button>
                            <strong>{passengers}</strong>
                            <button aria-label="Increase adults" onClick={() => setPassengers((p) => p + 1)}><NavIcon.plus /></button>
                          </div>
                        </div>
                        <div className="ct-traveler-row">
                          <div><strong>Children</strong><span>2 – 12 yrs</span></div>
                          <div className="plan-stepper">
                            <button aria-label="Decrease children" onClick={() => setChildren((c) => Math.max(0, c - 1))}><NavIcon.minus /></button>
                            <strong>{children}</strong>
                            <button aria-label="Increase children" onClick={() => setChildren((c) => c + 1)}><NavIcon.plus /></button>
                          </div>
                        </div>
                        <div className="ct-traveler-row">
                          <div><strong>Infant</strong><span>Below 2 yrs</span></div>
                          <div className="plan-stepper">
                            <button aria-label="Decrease infants" onClick={() => setInfants((i) => Math.max(0, i - 1))}><NavIcon.minus /></button>
                            <strong>{infants}</strong>
                            <button aria-label="Increase infants" onClick={() => setInfants((i) => i + 1)}><NavIcon.plus /></button>
                          </div>
                        </div>
                        <p className="ct-travelers-head ct-class-head">Class</p>
                        <div className="ct-class-pills">
                          {["Economy/Premium Economy", "Premium economy", "Business class", "First class"].map((c) => (
                            <button type="button" key={c} className={cabin === c ? "active" : ""} onClick={() => setCabin(c)}>{c}</button>
                          ))}
                        </div>
                        <button type="button" className="hotel-search-guests-done" onClick={() => setTravelersOpen(false)}>Done</button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ct-sb-search"
                    onClick={() => {
                      if (!departDate) {
                        setToast("Please select a departure date");
                        return;
                      }
                      setToast(`Showing ${filteredFlights.length} flights for ${from} → ${to}`);
                      flightResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  ><NavIcon.search /> Search</button>
                </div>

                <div className="ct-perks-row a11y-decorative">
                  <button type="button" className="ct-perk-highlight" onClick={() => setToast("Business Fares — 10% extra savings unlocked")}>
                    <span>
                      <strong>Business Fares by VoyageAI</strong>
                      <em>Unlock 10% extra savings</em>
                    </span>
                    <span className="ct-perk-badge">SAVE MORE</span>
                  </button>
                  <div className="ct-perk-list">
                    <button type="button" onClick={() => setToast("Student discount applied")}><strong>Student</strong><em>Extra baggage, discounts</em></button>
                    <button type="button" onClick={() => setToast("Senior citizen discount applied")}><strong>Senior citizen</strong><em>Up to $600 off</em></button>
                    <button type="button" onClick={() => setToast("Armed forces discount applied")}><strong>Armed forces</strong><em>Up to $600 off</em></button>
                  </div>
                </div>

                <div className="ct-bottom-row">
                  <label className="ct-toggle">
                    <input type="checkbox" checked={nonStopOnly} onChange={(e) => setNonStopOnly(e.target.checked)} />
                    <span className="ct-toggle-track" />
                    Non-stop flights only
                  </label>
                </div>
              </div>

              {flightResultsPanel}
              </>
            )}

            {manualTab === "hotel" && (
              <div className="plan-hotel-layout stacked">
                <div className="hotel-search-panel">
                  <div className="hotel-search-fields-row">
                    <div className="ct-sb-field ct-sb-airport hotel-search-dest">
                      <AirportInput value={hotelDest} onChange={setHotelDest} placeholder="Destination" />
                      {hotelDest && <button type="button" aria-label="Clear destination" onClick={() => setHotelDest("")}><NavIcon.close /></button>}
                    </div>

                    <div className="ct-sb-field ct-sb-date hotel-search-checkin">
                      <DatePicker value={hotelCheckIn} onChange={setHotelCheckIn} />
                    </div>
                    <div className="ct-sb-field ct-sb-date hotel-search-checkout">
                      <DatePicker value={hotelCheckOut} onChange={setHotelCheckOut} min={hotelCheckIn} />
                    </div>

                    <div className="ct-sb-field ct-sb-travelers hotel-search-guests">
                      <button type="button" onClick={() => setHotelGuestsOpen((v) => !v)}>
                        {rooms} Room{rooms > 1 ? "s" : ""}, {guests} Guest{guests > 1 ? "s" : ""} <NavIcon.chevronDown />
                      </button>
                      {hotelGuestsOpen && (
                        <div className="hotel-search-guests-pop" onClick={(e) => e.stopPropagation()}>
                          <div className="plan-field">
                            <label><NavIcon.guests /> GUESTS</label>
                            <div className="plan-stepper">
                              <button aria-label="Decrease" onClick={() => setGuests((g) => Math.max(1, g - 1))}><NavIcon.minus /></button>
                              <strong>{guests}</strong>
                              <button aria-label="Increase" onClick={() => setGuests((g) => g + 1)}><NavIcon.plus /></button>
                            </div>
                          </div>
                          <div className="plan-field">
                            <label><NavIcon.hotel /> ROOMS</label>
                            <div className="plan-stepper">
                              <button aria-label="Decrease" onClick={() => setRooms((r) => Math.max(1, r - 1))}><NavIcon.minus /></button>
                              <strong>{rooms}</strong>
                              <button aria-label="Increase" onClick={() => setRooms((r) => r + 1)}><NavIcon.plus /></button>
                            </div>
                          </div>
                          <div className="ct-traveler-row">
                            <div><strong>Adults</strong><span>12+ Years</span></div>
                            <div className="plan-stepper">
                              <button aria-label="Decrease adults" onClick={() => setHotelAdults((a) => Math.max(1, a - 1))}><NavIcon.minus /></button>
                              <strong>{hotelAdults}</strong>
                              <button aria-label="Increase adults" onClick={() => setHotelAdults((a) => a + 1)}><NavIcon.plus /></button>
                            </div>
                          </div>
                          <div className="ct-traveler-row">
                            <div><strong>Children</strong><span>2 – 12 yrs</span></div>
                            <div className="plan-stepper">
                              <button aria-label="Decrease children" onClick={() => setHotelChildren((c) => Math.max(0, c - 1))}><NavIcon.minus /></button>
                              <strong>{hotelChildren}</strong>
                              <button aria-label="Increase children" onClick={() => setHotelChildren((c) => c + 1)}><NavIcon.plus /></button>
                            </div>
                          </div>
                          <button type="button" className="hotel-search-guests-done" onClick={() => setHotelGuestsOpen(false)}>Done</button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ct-sb-search"
                      onClick={() => {
                        if (!hotelDest.trim()) {
                          setToast("Please enter a destination");
                          return;
                        }
                        if (hotelCheckOut && hotelCheckIn && hotelCheckOut <= hotelCheckIn) {
                          setToast("Check-out date must be after check-in date");
                          return;
                        }
                        setHotelSearchQuery(hotelDest.trim());
                        setToast(`Showing ${filteredHotels.length} hotels for ${hotelDest.trim()}`);
                        hotelResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    ><NavIcon.search /> Search</button>
                  </div>
                </div>

                <div className="ctr-hotel-toolbar" ref={hotelResultsRef}>
                  <div className="ctr-hotel-allfilters-wrap">
                    <button className={hotelFiltersActive ? "ctr-hotel-allfilters active" : "ctr-hotel-allfilters"} onClick={() => setAllHotelFiltersOpen((v) => !v)}>
                      <NavIcon.sliders /> All filters{hotelFiltersActive && <span className="ctr-hotel-allfilters-dot" />}
                    </button>
                    {allHotelFiltersOpen && (
                      <div className="ctr-hotel-allfilters-pop" onClick={(e) => e.stopPropagation()}>
                        <div className="ctr-hotel-allfilters-head">
                          <strong>All filters</strong>
                          <button type="button" className="ctr-filter-clear" onClick={clearAllHotelFilters}>Clear all</button>
                        </div>
                        <div className="ctr-hotel-allfilters-group">
                          <p className="ctr-filter-head">Sort by</p>
                          <div className="ctr-chip-row">
                            {([
                              { key: "recommended", label: "Recommended" },
                              { key: "priceLowHigh", label: "Price: Low to High" },
                              { key: "rating", label: "Guest Rating" },
                            ] as const).map((s) => (
                              <button key={s.key} type="button" className={hotelSort === s.key ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelSort(s.key)}>{s.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="ctr-hotel-allfilters-group">
                          <p className="ctr-filter-head">Deals</p>
                          <div className="ctr-chip-row">
                            {([
                              { key: "all", label: "All deals" },
                              { key: "topPicks", label: "Top picks" },
                              { key: "jackpot", label: "Jackpot deals" },
                              { key: "luxury", label: "Luxury deals" },
                              { key: "steal", label: "Steal deals" },
                            ] as const).map((d) => (
                              <button key={d.key} type="button" className={hotelDeal === d.key ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelDeal(d.key)}>{d.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="ctr-hotel-allfilters-group">
                          <p className="ctr-filter-head">Star category</p>
                          <div className="ctr-chip-row">
                            {([
                              { key: "all", label: "Any" },
                              { key: "5", label: "5 star" },
                              { key: "4", label: "4 star" },
                              { key: "3", label: "3 star" },
                            ] as const).map((s) => (
                              <button key={s.key} type="button" className={hotelStar === s.key ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelStar(s.key)}>{s.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="ctr-hotel-allfilters-group">
                          <p className="ctr-filter-head">Guest ratings</p>
                          <div className="ctr-chip-row">
                            {([
                              { key: "all", label: "Any" },
                              { key: "4", label: "4.0+" },
                              { key: "4.5", label: "4.5+" },
                            ] as const).map((r) => (
                              <button key={r.key} type="button" className={hotelMinRating === r.key ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelMinRating(r.key)}>{r.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="ctr-hotel-allfilters-group">
                          <p className="ctr-filter-head">Location</p>
                          <div className="ctr-chip-row">
                            <button type="button" className={hotelArea === "all" ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelArea("all")}>All areas</button>
                            {hotelAreas.map((a) => (
                              <button key={a} type="button" className={hotelArea === a ? "ctr-chip active" : "ctr-chip"} onClick={() => setHotelArea(a)}>{a}</button>
                            ))}
                          </div>
                        </div>
                        <button type="button" className="hotel-search-guests-done" onClick={() => setAllHotelFiltersOpen(false)}>Show {filteredHotels.length} hotels</button>
                      </div>
                    )}
                  </div>
                  {([
                    {
                      key: "sort" as const,
                      label: "Sort by",
                      value: hotelSort === "recommended" ? "Recommended" : hotelSort === "priceLowHigh" ? "Price: Low to High" : "Guest Rating",
                      options: [
                        { value: "recommended", label: "Recommended" },
                        { value: "priceLowHigh", label: "Price: Low to High" },
                        { value: "rating", label: "Guest Rating" },
                      ],
                      current: hotelSort,
                      onSelect: (v: string) => setHotelSort(v as typeof hotelSort),
                    },
                    {
                      key: "deals" as const,
                      label: "Deals",
                      value: hotelDeal === "all" ? "All deals" : hotelDeal === "topPicks" ? "Top picks" : hotelDeal === "jackpot" ? "Jackpot deals" : hotelDeal === "luxury" ? "Luxury deals" : "Steal deals",
                      options: [
                        { value: "all", label: "All deals" },
                        { value: "topPicks", label: "Top picks" },
                        { value: "jackpot", label: "Jackpot deals" },
                        { value: "luxury", label: "Luxury deals" },
                        { value: "steal", label: "Steal deals" },
                      ],
                      current: hotelDeal,
                      onSelect: (v: string) => setHotelDeal(v as typeof hotelDeal),
                    },
                    {
                      key: "star" as const,
                      label: "Star category",
                      value: hotelStar === "all" ? "Any" : `${hotelStar} star`,
                      options: [
                        { value: "all", label: "Any" },
                        { value: "5", label: "5 star" },
                        { value: "4", label: "4 star" },
                        { value: "3", label: "3 star" },
                      ],
                      current: hotelStar,
                      onSelect: (v: string) => setHotelStar(v as typeof hotelStar),
                    },
                    {
                      key: "rating" as const,
                      label: "Guest ratings",
                      value: hotelMinRating === "all" ? "Any" : `${hotelMinRating}+`,
                      options: [
                        { value: "all", label: "Any" },
                        { value: "4", label: "4.0+" },
                        { value: "4.5", label: "4.5+" },
                      ],
                      current: hotelMinRating,
                      onSelect: (v: string) => setHotelMinRating(v as typeof hotelMinRating),
                    },
                    {
                      key: "location" as const,
                      label: "Location",
                      value: hotelArea === "all" ? "All areas" : hotelArea,
                      options: [{ value: "all", label: "All areas" }, ...hotelAreas.map((a) => ({ value: a, label: a }))],
                      current: hotelArea,
                      onSelect: (v: string) => setHotelArea(v),
                    },
                  ]).map((pill) => (
                    <div key={pill.key} className="ctr-hotel-filter-pill-wrap">
                      <button
                        type="button"
                        className={hotelPillOpen === pill.key ? "ctr-hotel-filter-pill active" : "ctr-hotel-filter-pill"}
                        onClick={() => setHotelPillOpen((v) => (v === pill.key ? null : pill.key))}
                      >
                        {pill.label} <strong>{pill.value}</strong> <NavIcon.chevronDown />
                      </button>
                      {hotelPillOpen === pill.key && (
                        <div className="ctr-hotel-pill-pop" onClick={(e) => e.stopPropagation()}>
                          {pill.options.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              className={pill.current === o.value ? "ctr-hotel-pill-item active" : "ctr-hotel-pill-item"}
                              onClick={() => { pill.onSelect(o.value); setHotelPillOpen(null); }}
                            >
                              {pill.current === o.value && <NavIcon.check />}
                              {o.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="ctr-hotel-deal-row">
                  {([
                    { key: "topPicks", icon: "bookmark", label: "Top picks", sub: "Never before prices" },
                    { key: "jackpot", icon: "award", label: "Jackpot deals", sub: "25% & above" },
                    { key: "luxury", icon: "crown", label: "Luxury deals", sub: "5-star · min 10% off" },
                    { key: "steal", icon: "star", label: "Steal deals", sub: "10% - 25% off" },
                  ] as const).map((d) => {
                    const Icon = NavIcon[d.icon];
                    const active = hotelDeal === d.key;
                    return (
                      <button key={d.key} type="button" className={active ? "ctr-hotel-deal active" : "ctr-hotel-deal"} onClick={() => setHotelDeal(active ? "all" : d.key)}>
                        <Icon />
                        <div><strong>{d.label}</strong><span>{d.sub}</span></div>
                      </button>
                    );
                  })}
                </div>

                {filteredHotels.length === 0 && (
                  <p className="ctr-empty">No hotels match these filters — try clearing one.</p>
                )}

                <div className="book-grid three-col">
                  {filteredHotels.map((opt) => {
                    const isSelected = shortlistedHotels.has(opt.id);
                    const isExpanded = hotelExpanded[opt.id];
                    return (
                      <article key={opt.id} className="book-card">
                        <div
                          className="book-card-media"
                          style={opt.image ? { backgroundImage: `url(/images/${opt.image})` } : { background: opt.gradient ?? "linear-gradient(135deg,#e6e9f0,#cfd6e6)" }}
                        >
                          {opt.badge === "recommended" && <span className="book-badge book-badge-ai"><NavIcon.sparkle /> AI Recommended</span>}
                          {!!opt.saveAmount && <span className="book-badge book-badge-save">Save {formatPriceString(`$${opt.saveAmount}`)}</span>}
                          {!!opt.rating && <span className="book-rating"><NavIcon.star /> {opt.rating} <em>({opt.reviews})</em></span>}
                        </div>
                        <div className="book-card-body">
                          <div className="book-card-title-row">
                            <div>
                              <strong>{opt.title}</strong>
                              {opt.infoLines?.map((line) => (
                                <p key={line.text} className="book-info-line">
                                  {line.icon === "location" && <NavIcon.location />}
                                  {line.text}
                                </p>
                              ))}
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

                          {opt.policy && (
                            <div className={`book-policy ${opt.policy.kind}`}>
                              {opt.policy.icon === "check" && <NavIcon.check />}
                              {opt.policy.icon === "info" && <NavIcon.info />}
                              {opt.policy.text}
                            </div>
                          )}

                          <button className="book-included-toggle" onClick={() => setHotelExpanded((p) => ({ ...p, [opt.id]: !p[opt.id] }))}>
                            What's included <span className={isExpanded ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
                          </button>
                          {isExpanded && (
                            <ul className="book-included-list">
                              {opt.included.map((li) => <li key={li}><NavIcon.check /> {li}</li>)}
                            </ul>
                          )}

                          <div className="hotel-card-actions">
                            <button
                              type="button"
                              className={isSelected ? "ctr-shortlist-btn active" : "ctr-shortlist-btn"}
                              onClick={() => toggleHotelShortlist(opt.id, opt.title)}
                            >
                              {isSelected ? <><NavIcon.check /> Shortlisted</> : "Shortlist"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {manualTab === "multi" && (
              <div className="plan-multi">
                <div className="plan-multi-head">
                  <strong><NavIcon.globe /> Multi-City Route</strong>
                  <button className="plan-add-flight" onClick={addFlight}><NavIcon.plus /> Add flight</button>
                </div>
                <div className="plan-multi-route">
                  {cities.map((c, i) => (
                    <span key={`${c}-${i}`} className="plan-route-step">
                      <span className={i === cities.length - 1 ? "plan-route-dot end" : "plan-route-dot"}>{i + 1}</span>
                      <em>{c}</em>
                      {i < cities.length - 1 && <NavIcon.plane />}
                    </span>
                  ))}
                </div>
                {multiCity.map((leg, i) => (
                  <div key={i} className="plan-multi-row">
                    <span className="plan-multi-num">{i + 1}</span>
                    <input value={leg.from} onChange={(e) => setMultiCity(multiCity.map((l, idx) => (idx === i ? { ...l, from: e.target.value } : l)))} />
                    <input value={leg.to} onChange={(e) => setMultiCity(multiCity.map((l, idx) => (idx === i ? { ...l, to: e.target.value } : l)))} />
                    <input placeholder="Select date" onFocus={() => setToast("Opening date picker")} readOnly />
                    <select onChange={() => setToast("Cabin class updated")}>
                      <option>Economy</option>
                      <option>Business</option>
                    </select>
                    <button aria-label="Remove flight" onClick={() => removeFlight(i)}><NavIcon.trash /></button>
                  </div>
                ))}
                <button
                  className="plan-search-btn"
                  onClick={() => {
                    setToast(`Showing ${filteredFlights.length} flights for ${multiCity.length}-city route`);
                    flightResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                ><NavIcon.search /> Search {multiCity.length}-City Route</button>

                {flightResultsPanel}
              </div>
            )}

            {manualTab === "compare" && (
              <div className="plan-compare">
                <div className="plan-compare-head">
                  <strong><NavIcon.barChart /> Price Comparison</strong>
                  <span>Mumbai → Tokyo · Oct 10 · 4 passengers · Economy · 3 nights hotel</span>
                </div>
                <div className="plan-compare-table">
                  <div className="plan-compare-row plan-compare-th">
                    <span>Platform</span><span>Flight/Person</span><span>Hotel/Night</span><span>Total (4 pax)</span><span>Extras</span><span></span>
                  </div>
                  {compareRows.map((r) => {
                    const isSelected = r.platform === selectedPlatform;
                    return (
                    <div key={r.platform} className={isSelected ? "plan-compare-row selected" : "plan-compare-row"}>
                      <span className="plan-compare-platform"><i style={{ background: r.dot }} />{r.platform}{r.badge && <em className={`plan-badge-${r.badgeKind}`}>{r.badge}</em>}</span>
                      <span>{r.flight}</span>
                      <span>{r.hotel}</span>
                      <span className="plan-compare-total"><strong>{r.total}</strong><em className={r.extraTotal.startsWith("✓") ? "green" : ""}>{r.extraTotal}</em></span>
                      <span className="plan-compare-extras">{r.extras}</span>
                      <span>
                        <button
                          className={isSelected ? "plan-select-btn active" : "plan-select-btn"}
                          onClick={() => {
                            setSelectedPlatform(r.platform);
                            navigate("/book", { state: { stepKey: "flights", searchWhere: `${from} → ${to}`, searchGuests: `${passengers} Passenger${passengers === 1 ? "" : "s"}` } });
                          }}
                        >
                          {isSelected ? "Selected" : "Book"}
                        </button>
                      </span>
                    </div>
                    );
                  })}
                </div>
                <div className="plan-compare-save">
                  <NavIcon.trendUp />
                  <div><strong>VoyageAI saves you the most</strong><em>$10,000+ in total savings vs. booking separately on other platforms</em></div>
                </div>
              </div>
            )}
          </div>

          <div className="plan-tired-banner a11y-decorative">
            <span className="plan-ai-card-icon small"><NavIcon.sparkle /></span>
            <div>
              <strong>Tired of filling forms?</strong>
              <p>Switch to AI mode and plan this entire trip in one sentence — no tabs, no filters, no manual work.</p>
            </div>
            <button className="dash-btn-primary" onClick={() => setMode("ai")}><NavIcon.sparkle /> Try AI</button>
          </div>
        </div>
      )}
    </div>
  );
}
