import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { useAuth } from "./auth";
import { searchSiteIndex, siteIndex } from "./siteIndex";

const widgetSuggestions = [
  "Plan a 7-day trip to Japan",
  "Find cheap flights to Paris this weekend",
  "Best beaches in Southeast Asia",
  "Create a romantic Italy itinerary",
];

export function goToSection(navigate: ReturnType<typeof useNavigate>, pathname: string, id: string) {
  if (id === "home") { navigate("/"); return; }
  if (id === "discover") { navigate("/discover"); return; }
  if (id === "concierge") { navigate("/concierge", { state: { showLanding: true } }); return; }
  if (id === "book") { navigate("/book"); return; }
  if (id === "dashboard") { navigate("/dashboard"); return; }
  if (id === "for-you") { navigate("/for-you"); return; }
  if (id === "plan") { navigate("/plan"); return; }
  if (id === "itinerary") { navigate("/itinerary"); return; }
  if (id === "my-trips") { navigate("/my-trips"); return; }
  if (id === "bookings") { navigate("/bookings"); return; }
  if (id === "wallet") { navigate("/wallet"); return; }
  if (id === "live-assistance") { navigate("/live-assistance"); return; }
  if (id === "memories") { navigate("/memories"); return; }
  if (id === "profile") { navigate("/profile"); return; }
  if (pathname === "/") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    navigate(`/#${id}`);
  }
}

export function SiteNav() {
  const { tripInput, setTripInput, conciergeReply, toast, setToast, widgetOpen, setWidgetOpen, openWidget, pendingItineraryKey, clearPendingItineraryKey, darkMode, setDarkMode, conciergeInputRef } = useShell();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  const activeNav = location.pathname === "/discover" ? "discover" : location.pathname === "/concierge" ? "concierge" : location.pathname === "/book" ? "book" : location.pathname === "/dashboard" ? "dashboard" : location.pathname === "/for-you" ? "for-you" : location.pathname === "/plan" ? "plan" : location.pathname === "/itinerary" ? "itinerary" : location.pathname === "/my-trips" ? "my-trips" : location.pathname === "/bookings" ? "bookings" : location.pathname === "/wallet" ? "wallet" : location.pathname === "/live-assistance" ? "live-assistance" : location.pathname === "/memories" ? "memories" : location.pathname === "/profile" ? "profile" : "home";
  const onConciergePage = location.pathname === "/concierge";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-more")) setMoreOpen(false);
      if (!target.closest(".nav-search-wrap")) setSearchOpen(false);
      if (!target.closest(".nav-profile")) setProfileOpen(false);
    }
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  function goTo(id: string) {
    setMoreOpen(false);
    goToSection(navigate, location.pathname, id);
  }

const quickLinks = siteIndex.filter((e) => ["Home", "Dashboard", "Concierge AI", "Book a Trip", "For You", "Trip Memories"].includes(e.label));
  const navResults = navQuery.trim() ? searchSiteIndex(navQuery) : quickLinks;

  function goToEntry(entry: (typeof siteIndex)[number]) {
    setSearchOpen(false);
    setNavQuery("");
    navigate(entry.path, entry.state ? { state: entry.state } : undefined);
  }

  function goToConciergeWith(prompt: string) {
    if (!prompt.trim()) return;
    setWidgetOpen(false);
    setTripInput("");
    const itineraryKey = pendingItineraryKey ?? undefined;
    clearPendingItineraryKey();
    navigate("/concierge", { state: { initialPrompt: prompt.trim(), itineraryKey } });
  }

  function askAiFallback() {
    setSearchOpen(false);
    const q = navQuery.trim();
    setNavQuery("");
    openWidget(`Help me find "${q}" in VoyageAI`);
  }

  const moreMenu = [
    { icon: "dashboard", label: "Voyage Dashboard", action: () => goTo("dashboard") },
    { icon: "forYou", label: "For You", action: () => goTo("for-you") },
    { icon: "calendar", label: "Itinerary", action: () => goTo("itinerary") },
    { icon: "pin", label: "My Trips", action: () => goTo("my-trips") },
    { icon: "book", label: "My Bookings", action: () => goTo("bookings") },
    { icon: "wallet", label: "Wallet", action: () => goTo("wallet") },
    { icon: "bell", label: "Live Assistant", action: () => goTo("live-assistance") },
    { icon: "camera", label: "Trip Memories", action: () => goTo("memories") },
    { icon: "discover", label: "Discover", action: () => goTo("discover") },
    { icon: "userCircle", label: "My Preferences", action: () => goTo("profile") },
  ];

  return (
    <>
      <nav className="navbar">
        <button className="nav-brand" onClick={() => goTo("home")}><span className="brand-text">Voyage<span className="brand-accent">AI</span></span></button>
        <div className="nav-links">
          <button className={activeNav === "home" ? "active" : ""} onClick={() => goTo("home")}><NavIcon.home /> Home</button>
          <button className={activeNav === "concierge" ? "active" : ""} onClick={() => goTo("concierge")}><NavIcon.concierge /> Concierge <span className="ai-badge">AI</span></button>
          <button className={activeNav === "plan" ? "active" : ""} onClick={() => goTo("plan")}><NavIcon.sliders /> Plan Your Trip</button>
          <button className={activeNav === "book" ? "active" : ""} onClick={() => goTo("book")}><NavIcon.book /> Book</button>
          <div className="nav-more">
            <button className={moreOpen ? "active" : ""} onClick={() => setMoreOpen((v) => !v)}>My Voyage ▾</button>
            {moreOpen && (
              <div className="nav-dropdown nav-dropdown-list">
                {moreMenu.map((m) => {
                  const Icon = NavIcon[m.icon as keyof typeof NavIcon];
                  return (
                    <button key={m.label} onClick={() => { m.action(); setMoreOpen(false); }}>
                      <Icon /> {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="nav-actions">
          <div className="nav-search-wrap">
            <form
              className={searchOpen ? "nav-search nav-search-expanded" : "nav-search"}
              onSubmit={(e) => {
                e.preventDefault();
                if (navResults.length > 0) goToEntry(navResults[0]);
                else if (navQuery.trim()) askAiFallback();
              }}
            >
              <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)}><NavIcon.search /></button>
              {searchOpen ? (
                <input
                  autoFocus
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  onBlur={() => { if (!navQuery.trim()) setSearchOpen(false); }}
                  placeholder="Search the site…"
                />
              ) : (
                <span onClick={() => setSearchOpen(true)}>Search the site…</span>
              )}
            </form>
            {searchOpen && (
              <div className="nav-search-popover">
                {navResults.length === 0 ? (
                  <button type="button" className="nav-search-item nav-search-ai" onMouseDown={(e) => e.preventDefault()} onClick={askAiFallback}>
                    <NavIcon.sparkle /> Ask AI about "{navQuery.trim()}"
                  </button>
                ) : (
                  <>
                    <p className="nav-search-label">{navQuery.trim() ? "Pages & sections" : "Quick links"}</p>
                    {navResults.map((entry) => {
                      const Icon = NavIcon[entry.icon];
                      return (
                        <button type="button" key={`${entry.label}-${entry.path}-${JSON.stringify(entry.state ?? {})}`} className="nav-search-item" onMouseDown={(e) => e.preventDefault()} onClick={() => goToEntry(entry)}>
                          <Icon />
                          <span className="nav-search-item-text">
                            {entry.label}
                            <em>{entry.group}</em>
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          <button className="nav-icon" aria-label="Toggle dark mode" onClick={() => setDarkMode(!darkMode)}><NavIcon.moon /></button>
          {user ? (
            <div className="nav-profile">
              <button className="nav-avatar" onClick={() => setProfileOpen((v) => !v)}><img src={user.avatar} alt="Account" /></button>
              {profileOpen && (
                <div className="nav-dropdown nav-dropdown-right">
                  <div className="nav-dropdown-user"><strong>{user.name}</strong><span>{user.email}</span></div>
                  {!isAdmin && (
                    <>
                      <button onClick={() => { goTo("profile"); setProfileOpen(false); }}>Profile</button>
                      <button onClick={() => { goTo("my-trips"); setProfileOpen(false); }}>My Trips</button>
                    </>
                  )}
                  {isAdmin && (
                    <button onClick={() => { navigate("/admin"); setProfileOpen(false); }}>Governance</button>
                  )}
                  <button onClick={() => { logout(); setToast("Signed out"); setProfileOpen(false); navigate("/"); }}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-actions">
              <button className="dash-btn-ghost" onClick={() => navigate("/login")}>Log In</button>
              <button className="dash-btn-primary" onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          )}
        </div>
      </nav>
      {toast && <div className="toast">{toast}</div>}

      {widgetOpen && !onConciergePage && (
        <div className="concierge-widget">
          <div className="concierge-widget-header">
            <span className="concierge-widget-icon"><NavIcon.sparkle /></span>
            <div className="concierge-widget-title">
              <strong>VoyageAI</strong>
              <span>Your travel concierge</span>
            </div>
            <button aria-label="Expand" onClick={() => { setWidgetOpen(false); clearPendingItineraryKey(); goTo("concierge"); }}><NavIcon.expand /></button>
            <button aria-label="Close" onClick={() => { setWidgetOpen(false); clearPendingItineraryKey(); }}><NavIcon.close /></button>
          </div>
          <div className="concierge-widget-body">
            <p className="concierge-widget-greeting">Hi! I'm your VoyageAI concierge. Where would you like to explore today? ✈️</p>
            {conciergeReply && <p className="concierge-widget-reply">{conciergeReply}</p>}
            <div className="concierge-widget-pills">
              {widgetSuggestions.map((s) => (
                <button key={s} onClick={() => goToConciergeWith(s)}>{s}</button>
              ))}
            </div>
          </div>
          <form className="concierge-widget-input" onSubmit={(e) => { e.preventDefault(); goToConciergeWith(tripInput); }}>
            <input
              ref={conciergeInputRef}
              value={tripInput}
              onChange={(e) => setTripInput(e.target.value)}
              placeholder="Ask me anything…"
              aria-label="Ask the concierge"
            />
            <button type="button" aria-label="Voice input" onClick={() => setToast("Voice input coming soon")}><NavIcon.mic /></button>
            <button type="submit" aria-label="Send"><NavIcon.send /></button>
          </form>
        </div>
      )}

      {!onConciergePage && (
        <button className="hero-fab" aria-label={widgetOpen ? "Close AI concierge" : "Open AI concierge"} onClick={() => setWidgetOpen(!widgetOpen)}>
          <img src="/images/logo-ai-badge.png" alt="" />
        </button>
      )}
    </>
  );
}
