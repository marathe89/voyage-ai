// Minimal content-management store for the admin panel. There's no real CMS
// backend in this project, so overrides are read/written to localStorage;
// pages that support editable content (currently just the Home hero + a
// "highlights" block grid) read this at mount and fall back to their
// hardcoded defaults when unset.

export interface ContentBlock {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

export interface CmsContent {
  homeTitle?: string;
  homeSubtitle?: string;
  homeImage?: string;
  blocks?: Record<string, ContentBlock[]>;
}

export interface CmsPage {
  id: string;
  label: string;
}

export const CMS_PAGES: CmsPage[] = [
  { id: "home", label: "Home" },
  { id: "discover", label: "Discover" },
  { id: "concierge", label: "Concierge AI" },
  { id: "book", label: "Book" },
  { id: "dashboard", label: "Dashboard" },
  { id: "for-you", label: "For You" },
  { id: "plan", label: "Plan Trip" },
  { id: "itinerary", label: "Itinerary" },
  { id: "my-trips", label: "My Trips" },
  { id: "bookings", label: "My Bookings" },
  { id: "wallet", label: "Wallet" },
  { id: "live-assistance", label: "Live Assistant" },
  { id: "memories", label: "Trip Memories" },
  { id: "profile", label: "Profile" },
];

const CMS_KEY = "voyageai_cms_content";

export function loadCmsContent(): CmsContent {
  try {
    const raw = localStorage.getItem(CMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCmsContent(content: CmsContent) {
  try {
    localStorage.setItem(CMS_KEY, JSON.stringify(content));
  } catch { /* storage unavailable — ignore */ }
}
