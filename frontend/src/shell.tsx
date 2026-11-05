import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

// Production is served by nginx with /api proxied to the backend, so the
// API lives on the same origin; local dev talks to the backend on :4000.
const apiUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:4000" : "");

interface ShellState {
  tripInput: string;
  setTripInput: (v: string) => void;
  conciergeReply: string;
  isLoading: boolean;
  askConcierge: (override?: string) => Promise<void>;
  toast: string | null;
  setToast: (v: string | null) => void;
  widgetOpen: boolean;
  setWidgetOpen: (v: boolean) => void;
  openWidget: (prefill?: string, itineraryKey?: string) => void;
  pendingItineraryKey: string | null;
  clearPendingItineraryKey: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  conciergeInputRef: RefObject<HTMLInputElement | null>;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [tripInput, setTripInput] = useState("");
  const [conciergeReply, setConciergeReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [pendingItineraryKey, setPendingItineraryKey] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const conciergeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const extendedAlerts = (() => {
      try {
        return Boolean(JSON.parse(localStorage.getItem("voyageai-a11y-settings") ?? "{}").extendedAlerts);
      } catch {
        return false;
      }
    })();
    const t = setTimeout(() => setToast(null), extendedAlerts ? 6000 : 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function askConcierge(override?: string) {
    const message = override ?? tripInput;
    if (!message.trim()) {
      setWidgetOpen(true);
      setTimeout(() => conciergeInputRef.current?.focus(), 300);
      return;
    }
    if (override) setTripInput(override);
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/concierge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setConciergeReply(data.reply ?? data.error ?? "I could not answer that just yet.");
    } catch {
      setConciergeReply("The concierge is offline. Start the backend and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function openWidget(prefill?: string, itineraryKey?: string) {
    if (prefill) setTripInput(prefill);
    if (itineraryKey) setPendingItineraryKey(itineraryKey);
    setWidgetOpen(true);
    setTimeout(() => conciergeInputRef.current?.focus(), 300);
  }

  function clearPendingItineraryKey() {
    setPendingItineraryKey(null);
  }

  return (
    <ShellContext.Provider
      value={{
        tripInput, setTripInput, conciergeReply, isLoading, askConcierge, toast, setToast,
        widgetOpen, setWidgetOpen, openWidget, pendingItineraryKey, clearPendingItineraryKey,
        darkMode, setDarkMode, conciergeInputRef,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
