import { useEffect, useState } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { readA11ySetting } from "./accessibility";

type NotifKind = "action" | "info" | "accepted" | "price" | "checkin" | "urgent";

interface Notif {
  id: string;
  icon: keyof typeof NavIcon;
  kind: NotifKind;
  title: string;
  tag?: string;
  time: string;
  pending: boolean;
  critical: boolean;
  body?: string;
  aiWill?: string;
  resolvedText?: string;
  primaryAction?: string;
  secondaryAction?: string;
  tertiaryAction?: string;
}

const notifs: Notif[] = [
  {
    id: "n0", icon: "lightning", kind: "price", title: "Local SIM deal: $800 for 15GB Japan data", tag: "New", time: "Just now", pending: true, critical: false,
    body: "VoyageAI detected you land in 3 days. IIJmio tourist SIM available for pickup at Narita Terminal 1 — unlimited calls + 15GB for $800.",
    primaryAction: "Reserve SIM", secondaryAction: "Remind at Airport",
  },
  {
    id: "n1", icon: "plane", kind: "action", title: "Flight AI 302 delayed by 3 hours", tag: "Action needed", time: "2 min ago", pending: true, critical: false,
    body: "Your departure from Mumbai (BOM) is now at 02:45 instead of 23:45. New arrival Tokyo (NRT) estimated 11:30+1. Gate B14 remains unchanged.",
    aiWill: "AI will rebook your Narita Express and notify the hotel of late arrival.",
    primaryAction: "Accept Rebooking", secondaryAction: "Modify Itinerary", tertiaryAction: "Ignore",
  },
  {
    id: "n2", icon: "cloud", kind: "info", title: "Typhoon warning lifted for Tokyo", tag: "New", time: "14 min ago", pending: true, critical: false,
    body: "Typhoon Khanun has weakened and moved northeast. Your Oct 11–13 Tokyo stay looks clear. Light rain expected Oct 12 afternoon. Pack an umbrella.",
    primaryAction: "Got It", secondaryAction: "Update Packing List",
  },
  {
    id: "n3", icon: "shield", kind: "accepted", title: "Japan eases tourist entry requirements", tag: "Accepted", time: "1 hr ago", pending: false, critical: false,
    body: "Japan removed the tourist registration requirement for Indian passport holders effective Oct 1, 2026. Your existing visa is valid. No additional steps needed.",
    resolvedText: "Resolved · accepted",
  },
  {
    id: "n4", icon: "lightning", kind: "price", title: "Price drop: Hakone Ginyu saved $4,200", tag: "New", time: "2 hrs ago", pending: true, critical: false,
    body: "Your saved ryokan dropped in price. The Oct 12–13 rate fell from $26,200 to $22,000 per night. Lock it in now — only 2 rooms left.",
    aiWill: "Booking locked at $22,000/night. Confirmation sent to your email.",
    primaryAction: "Book Now & Save", secondaryAction: "Remind Later", tertiaryAction: "Ignore",
  },
  {
    id: "n5", icon: "check", kind: "checkin", title: "Online check-in now open for AI 302", tag: "New", time: "3 hrs ago", pending: true, critical: false,
    body: "Check in now to select your preferred seats before they fill up. Window seats 12A–12D are available — great for Mt. Fuji views on the descent.",
    primaryAction: "Check In Now", secondaryAction: "Remind in 2 hrs",
  },
  {
    id: "n6", icon: "siren", kind: "urgent", title: "Earthquake alert: M4.2 near Hakone", tag: "URGENT", time: "Just now", pending: true, critical: true,
    body: "A magnitude 4.2 earthquake was detected 18 km from Hakone. No tsunami threat. Your hotel has confirmed all guests are safe. Stay away from cliffs until further notice.",
    aiWill: "Safety status sent to your emergency contacts.",
    primaryAction: "I'm Safe", secondaryAction: "Contact Hotel", tertiaryAction: "Emergency Help",
  },
];

const monitoring: { icon: keyof typeof NavIcon; label: string; color: string }[] = [
  { icon: "plane", label: "Flight status", color: "#3c7ef2" },
  { icon: "cloud", label: "Weather alerts", color: "#3c7ef2" },
  { icon: "shield", label: "Travel advisories", color: "#9c6fe0" },
  { icon: "trendUp", label: "Price changes", color: "#4bb383" },
  { icon: "heart", label: "Hotel availability", color: "#ef6f8e" },
  { icon: "globe", label: "Visa updates", color: "#2fa8a3" },
];

const weatherByCity: Record<string, { temp: string; desc: string; humidity: string; wind: string; visibility: string }> = {
  Tokyo: { temp: "18°C", desc: "Partly cloudy", humidity: "68%", wind: "12 km/h", visibility: "9 km" },
  Hakone: { temp: "14°C", desc: "Light rain", humidity: "82%", wind: "18 km/h", visibility: "5 km" },
  Kyoto: { temp: "20°C", desc: "Clear skies", humidity: "55%", wind: "8 km/h", visibility: "12 km" },
  Osaka: { temp: "21°C", desc: "Sunny", humidity: "50%", wind: "10 km/h", visibility: "14 km" },
};

const emergencyJapan = [
  { icon: "phone" as const, label: "Emergency (Police/Fire/Ambulance)", value: "110 / 119" },
  { icon: "phone" as const, label: "Tourist Police Hotline", value: "03-3501-0110" },
  { icon: "globe" as const, label: "India Embassy Tokyo", value: "+81-3-3262-2391" },
  { icon: "sparkle" as const, label: "VoyageAI Emergency Desk", value: "+1-800-VOYAGE-1" },
];
const emergencyHotel = [
  { icon: "phone" as const, label: "Front Desk", value: "+81-3-6830-1234" },
  { icon: "star" as const, label: "Concierge", value: "+81-3-6830-1240" },
];

export function LiveAssistancePage() {
  const { setToast, openWidget } = useShell();
  const [filter, setFilter] = useState<"all" | "pending" | "critical">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(notifs.map((n) => n.id)));
  const [soundOn, setSoundOn] = useState(() => !readA11ySetting("muteSoundsByDefault"));
  const [city, setCity] = useState("Tokyo");
  const [advisoryOpen, setAdvisoryOpen] = useState<Set<string>>(new Set(["japan"]));
  const [shareOpen, setShareOpen] = useState<string | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".live-notif-share-wrap") && !target.closest(".live-share-menu-inline") && !target.closest("[aria-label='Share flight status to phone']")) {
        setShareOpen(null);
      }
    }
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  async function shareItem(id: string, text: string) {
    const canShare = typeof navigator !== "undefined" && "share" in navigator;
    if (canShare) {
      try {
        await (navigator as Navigator & { share: (data: { title: string; text: string }) => Promise<void> }).share({ title: "VoyageAI alert", text });
        setToast("Shared to your phone");
        return;
      } catch {
        /* user cancelled or share failed — fall back to the menu */
      }
    }
    setShareOpen((prev) => (prev === id ? null : id));
  }

  async function copyShareLink(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied — open it on your phone to paste");
    } catch {
      setToast("Couldn't copy — try again");
    }
    setShareOpen(null);
  }

  const pendingCount = notifs.filter((n) => n.pending).length;
  const criticalCount = notifs.filter((n) => n.critical).length;
  const filtered = notifs.filter((n) => filter === "all" || (filter === "pending" && n.pending) || (filter === "critical" && n.critical));
  const weather = weatherByCity[city];

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAdvisory(key: string) {
    setAdvisoryOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="live-page">
      <div className="live-header">
        <div>
          <h1><NavIcon.bell /> Real-Time Assistant <span className="live-badge-count">{pendingCount}</span></h1>
          <p>Monitoring your Japan trip · Oct 10–20, 2026</p>
        </div>
        <div className="live-header-actions">
          <button className={soundOn ? "live-sound-btn" : "live-sound-btn off"} onClick={() => setSoundOn((v) => !v)}>
            {soundOn ? <NavIcon.volume /> : <NavIcon.volumeOff />} Sound {soundOn ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="live-statusbar">
        <span className="live-status-live"><i /> Live Monitoring</span>
        <span><NavIcon.wifi /> Tracking 6 signals</span>
        <span><NavIcon.bell /> {pendingCount} pending actions</span>
        <span className="red"><NavIcon.siren /> {criticalCount} critical</span>
        <span className="live-status-online"><NavIcon.wifi /> All systems online</span>
      </div>

      <div className="live-layout">
        <main className="live-main">
          <div className="live-notif-head">
            <h2><NavIcon.bell /> AI Notifications</h2>
            <div className="live-notif-filters">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({notifs.length})</button>
              <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pending ({pendingCount})</button>
              <button className={filter === "critical" ? "active" : ""} onClick={() => setFilter("critical")}>Critical ({criticalCount})</button>
            </div>
          </div>

          <div className="live-notif-list">
            {filtered.map((n) => {
              const Icon = NavIcon[n.icon];
              const isOpen = expanded.has(n.id);
              return (
                <div key={n.id} className={`live-notif live-notif-${n.kind}`}>
                  <div className="live-notif-row">
                    <button className="live-notif-row-main" onClick={() => toggleExpand(n.id)}>
                      <span className="live-notif-icon"><Icon /></span>
                      <span className="live-notif-body">
                        <strong>{n.title} {n.tag && <em className={`live-tag live-tag-${n.kind}`}>{n.tag}</em>}</strong>
                        <span className="live-notif-time"><NavIcon.clock /> {n.time}</span>
                      </span>
                      <span className={isOpen ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
                    </button>
                    <span className="live-notif-share-wrap">
                      <button
                        className="live-notif-share-btn"
                        aria-label="Share to phone"
                        onClick={(e) => { e.stopPropagation(); shareItem(n.id, `${n.title}${n.body ? " — " + n.body : ""}`); }}
                      >
                        <NavIcon.send />
                      </button>
                      {shareOpen === n.id && (
                        <div className="live-share-menu">
                          <a
                            href={`sms:?body=${encodeURIComponent(`${n.title}${n.body ? " — " + n.body : ""}`)}`}
                            onClick={() => setShareOpen(null)}
                          >
                            <NavIcon.phone /> Text to my phone
                          </a>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`${n.title}${n.body ? " — " + n.body : ""}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setShareOpen(null)}
                          >
                            <NavIcon.chat /> Send via WhatsApp
                          </a>
                          <button type="button" onClick={() => copyShareLink(`${n.title}${n.body ? " — " + n.body : ""}`)}>
                            <NavIcon.check /> Copy for my phone
                          </button>
                        </div>
                      )}
                    </span>
                  </div>
                  {isOpen && n.body && (
                    <div className="live-notif-detail">
                      <p>{n.body}</p>
                      {n.aiWill && <div className="live-ai-will"><NavIcon.sparkle /> <strong>AI will:</strong> {n.aiWill}</div>}
                      {n.resolvedText ? (
                        <div className="live-resolved"><NavIcon.check /> {n.resolvedText}</div>
                      ) : (
                        <div className="live-notif-actions">
                          {n.primaryAction && (
                            <button className="live-btn-primary" onClick={() => setToast(`${n.primaryAction} confirmed`)}><NavIcon.check /> {n.primaryAction}</button>
                          )}
                          {n.secondaryAction && (
                            <button className="live-btn-ghost" onClick={() => setToast(n.secondaryAction!)}>{n.secondaryAction}</button>
                          )}
                          {n.tertiaryAction && (
                            <button
                              className="live-btn-text"
                              onClick={() =>
                                n.tertiaryAction === "Emergency Help"
                                  ? openWidget("I need emergency help near Hakone")
                                  : setToast(`${n.tertiaryAction} for "${n.title}"`)
                              }
                            >
                              {n.tertiaryAction === "Emergency Help" && <NavIcon.close />} {n.tertiaryAction}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="live-monitoring">
            <h3><NavIcon.wifi /> What VoyageAI is monitoring</h3>
            <div className="live-monitoring-grid">
              {monitoring.map((m) => {
                const Icon = NavIcon[m.icon];
                return (
                  <div key={m.label} className="live-monitoring-tile">
                    <span style={{ background: `${m.color}1a`, color: m.color }}><Icon /></span>
                    <div><strong>{m.label}</strong><em><i /> Active</em></div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="live-sidebar">
          <div className="live-flight-card">
            <div className="live-flight-head">
              <span className="live-flight-icon"><NavIcon.plane /></span>
              <div>
                <strong>AI 302 · Air India</strong>
                <em>Mumbai (BOM) → Tokyo Narita (NRT)</em>
              </div>
              <span className="live-flight-badge">Delayed +180m</span>
              <button aria-label="Share flight status to phone" onClick={() => shareItem("flight-card", "AI 302 Mumbai (BOM) → Tokyo Narita (NRT): now departing 02:45, arriving 08:30. Gate B14, Terminal 2.")}><NavIcon.send /></button>
              <button aria-label="Refresh" onClick={() => setToast("Refreshing flight status...")}><NavIcon.reset /></button>
            </div>
            {shareOpen === "flight-card" && (
              <div className="live-share-menu live-share-menu-inline">
                <a href={`sms:?body=${encodeURIComponent("AI 302 Mumbai (BOM) → Tokyo Narita (NRT): now departing 02:45, arriving 08:30. Gate B14, Terminal 2.")}`} onClick={() => setShareOpen(null)}>
                  <NavIcon.phone /> Text to my phone
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("AI 302 Mumbai (BOM) → Tokyo Narita (NRT): now departing 02:45, arriving 08:30. Gate B14, Terminal 2.")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShareOpen(null)}
                >
                  <NavIcon.chat /> Send via WhatsApp
                </a>
                <button type="button" onClick={() => copyShareLink("AI 302 Mumbai (BOM) → Tokyo Narita (NRT): now departing 02:45, arriving 08:30. Gate B14, Terminal 2.")}>
                  <NavIcon.check /> Copy for my phone
                </button>
              </div>
            )}
            <div className="live-flight-times">
              <div><strong>23:45</strong><span>Scheduled</span><em>Mumbai</em><small>BOM · T2</small></div>
              <div className="live-flight-mid">
                <span className="live-flight-new">NEW: 02:45+1</span>
                <span className="live-flight-plane"><NavIcon.plane /></span>
                <em>9h 45m · Non-stop</em>
              </div>
              <div className="live-flight-right"><strong>08:30</strong><span>Estimated</span><em>Tokyo</em><small>NRT · T1</small></div>
            </div>
            <div className="live-flight-grid">
              <div><span>Gate</span><strong>B14</strong></div>
              <div><span>Terminal</span><strong>2</strong></div>
              <div><span>Seats</span><strong>12A–12D</strong></div>
            </div>
            <div className="live-flight-footer">
              <span>Mumbai BOM</span>
              <div className="booking-progress-bar live-flight-bar"><span style={{ width: "55%" }} /></div>
              <span>Tokyo NRT</span>
            </div>
            <p className="live-flight-note">Live data · Updated just now</p>
          </div>

          <div className="live-weather-card">
            <div className="live-weather-head">
              <strong><NavIcon.cloud /> Weather Along Your Route</strong>
              <span className="live-live-badge">Live</span>
            </div>
            <div className="live-weather-tabs">
              {Object.keys(weatherByCity).map((c) => (
                <button key={c} className={city === c ? "active" : ""} onClick={() => setCity(c)}>{c}</button>
              ))}
            </div>
            <div className="live-weather-body">
              <div className="live-weather-main">
                <span><NavIcon.cloud /></span>
                <div><strong>{weather.temp}</strong><em>{weather.desc}</em></div>
              </div>
              <div className="live-weather-stats">
                <div><NavIcon.droplet /><strong>{weather.humidity}</strong><span>Humidity</span></div>
                <div><NavIcon.wind /><strong>{weather.wind}</strong><span>Wind</span></div>
                <div><NavIcon.eye /><strong>{weather.visibility}</strong><span>Visibility</span></div>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3><NavIcon.shield /> Travel Advisory</h3>
              <span className="live-advisory-src">Via Gov.in + MEA</span>
            </div>
            <button className="live-advisory-row" onClick={() => toggleAdvisory("japan")}>
              <span className="live-flag">🇯🇵</span>
              <span className="live-advisory-info"><strong>Japan</strong><em>Updated Oct 8, 2026</em></span>
              <span className="live-risk-badge">Level 1 · Low Risk</span>
              <span className={advisoryOpen.has("japan") ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
            </button>
            {advisoryOpen.has("japan") && (
              <div className="live-advisory-detail">
                <p>Exercise normal safety precautions. Japan is one of the safest countries globally for tourists.</p>
                <ul>
                  <li><NavIcon.check /> Earthquakes: Standard preparedness</li>
                  <li><NavIcon.check /> Natural disasters: Typhoon season ends Nov 1</li>
                  <li><NavIcon.check /> Health: No vaccination requirements</li>
                </ul>
              </div>
            )}
            <button className="live-advisory-row" onClick={() => toggleAdvisory("india")}>
              <span className="live-flag">🇮🇳</span>
              <span className="live-advisory-info"><strong>India (Return)</strong><em>Updated Oct 1, 2026</em></span>
              <span className="live-risk-badge">Level 1 · Low Risk</span>
              <span className={advisoryOpen.has("india") ? "chev chev-up" : "chev"}><NavIcon.chevronDown /></span>
            </button>
            {advisoryOpen.has("india") && (
              <div className="live-advisory-detail">
                <p>No special precautions required for return travel to India.</p>
              </div>
            )}
          </div>

          <div className="live-emergency-card">
            <div className="live-emergency-head">
              <strong><NavIcon.siren /> Emergency Contacts</strong>
              <span>Tap to call</span>
            </div>
            <p className="live-emergency-section">🇯🇵 JAPAN</p>
            {emergencyJapan.map((c) => {
              const Icon = NavIcon[c.icon];
              return (
                <button key={c.label} className="live-emergency-row" onClick={() => setToast(`Calling ${c.label}: ${c.value}`)}>
                  <span><Icon /></span>
                  <span><em>{c.label}</em><strong>{c.value}</strong></span>
                </button>
              );
            })}
            <p className="live-emergency-section">🏨 YOUR HOTEL (ANDAZ TOKYO)</p>
            {emergencyHotel.map((c) => {
              const Icon = NavIcon[c.icon];
              return (
                <button key={c.label} className="live-emergency-row" onClick={() => setToast(`Calling ${c.label}: ${c.value}`)}>
                  <span><Icon /></span>
                  <span><em>{c.label}</em><strong>{c.value}</strong></span>
                </button>
              );
            })}
            <button className="live-sos-btn" onClick={() => { setToast("Connecting to emergency help..."); openWidget("I need urgent emergency help right now"); }}>
              <NavIcon.siren /> SOS — Get Emergency Help
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
