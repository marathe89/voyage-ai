import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NavIcon } from "./icons";

export type TextSize = "normal" | "large" | "xlarge";

export interface A11ySettings {
  // Vision
  textSize: TextSize;
  highContrast: boolean;
  underlineLinks: boolean;
  // Motor
  largeTargets: boolean;
  reduceMotion: boolean;
  keyboardFocus: boolean;
  // Hearing
  muteSoundsByDefault: boolean;
  extendedAlerts: boolean;
  // Cognitive
  readingMode: boolean;
  simplifyLayout: boolean;
}

const defaultSettings: A11ySettings = {
  textSize: "normal",
  highContrast: false,
  underlineLinks: false,
  largeTargets: false,
  reduceMotion: false,
  keyboardFocus: false,
  muteSoundsByDefault: false,
  extendedAlerts: false,
  readingMode: false,
  simplifyLayout: false,
};

export const A11Y_STORAGE_KEY = "voyageai-a11y-settings";

interface A11yState {
  settings: A11ySettings;
  update: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  reset: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  activeCount: number;
}

const A11yContext = createContext<A11yState | null>(null);

function loadSettings(): A11ySettings {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) {
      // Respect the OS-level "reduce motion" preference the first time,
      // per WCAG 2.3.3 best practice, until the person picks explicitly.
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      return { ...defaultSettings, reduceMotion: prefersReducedMotion };
    }
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function readA11ySetting<K extends keyof A11ySettings>(key: K): A11ySettings[K] {
  return loadSettings()[key];
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(() => loadSettings());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings));
    } catch { /* storage unavailable — ignore */ }

    const root = document.documentElement;
    root.dataset.a11yFont = settings.textSize;
    root.dataset.a11yContrast = settings.highContrast ? "high" : "";
    root.dataset.a11yUnderline = settings.underlineLinks ? "on" : "";
    root.dataset.a11yTargets = settings.largeTargets ? "large" : "";
    root.dataset.a11yMotion = settings.reduceMotion ? "reduce" : "";
    root.dataset.a11yFocus = settings.keyboardFocus ? "on" : "";
    root.dataset.a11yReading = settings.readingMode ? "on" : "";
    root.dataset.a11ySimplify = settings.simplifyLayout ? "on" : "";
  }, [settings]);

  function update<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setSettings(defaultSettings);
  }

  const activeCount = Object.entries(settings).filter(([k, v]) =>
    k === "textSize" ? v !== "normal" : v === true
  ).length;

  return (
    <A11yContext.Provider value={{ settings, update, reset, menuOpen, setMenuOpen, activeCount }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

let uid = 0;
function nextId(prefix: string) {
  uid += 1;
  return `${prefix}-${uid}`;
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="a11y-row"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="a11y-row-text">
        <strong>{label}</strong>
        <span>{desc}</span>
      </span>
      <span className={checked ? "a11y-switch on" : "a11y-switch"} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

export function AccessibilityMenu() {
  const { settings, update, reset, menuOpen, setMenuOpen, activeCount } = useAccessibility();
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useRef(nextId("a11y-title")).current;

  // Move focus into the panel when it opens, and back to the trigger
  // button when it closes, so keyboard users never lose their place
  // (WCAG 2.4.3 focus order).
  useEffect(() => {
    if (menuOpen) {
      closeBtnRef.current?.focus();
    } else {
      fabRef.current?.focus();
    }
  }, [menuOpen]);

  // Escape closes the dialog, and Tab is trapped inside it while open
  // (WCAG 2.1.2 no keyboard trap — this is a deliberate, escapable one).
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, setMenuOpen]);

  return (
    <>
      <button
        ref={fabRef}
        className="a11y-fab"
        aria-label={activeCount > 0 ? `Accessibility options, ${activeCount} active` : "Accessibility options"}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <NavIcon.accessibility />
        {activeCount > 0 && <span className="a11y-fab-badge" aria-hidden="true">{activeCount}</span>}
      </button>

      {menuOpen && (
        <div className="a11y-overlay" onClick={() => setMenuOpen(false)}>
          <div ref={panelRef} className="a11y-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="a11y-panel-head">
              <strong id={titleId}><NavIcon.accessibility /> Accessibility</strong>
              <button ref={closeBtnRef} aria-label="Close accessibility panel" onClick={() => setMenuOpen(false)}><NavIcon.close /></button>
            </div>

            <div className="a11y-panel-body">
              <section className="a11y-section">
                <h3><NavIcon.eye /> Vision</h3>
                <div className="a11y-row">
                  <span className="a11y-row-text">
                    <strong>Text size</strong>
                    <span>Increase reading text across the app</span>
                  </span>
                  <div className="a11y-size-group" role="group" aria-label="Text size">
                    {(["normal", "large", "xlarge"] as TextSize[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={settings.textSize === s}
                        aria-label={s === "normal" ? "Normal text size" : s === "large" ? "Large text size" : "Extra large text size"}
                        className={settings.textSize === s ? "a11y-size-btn active" : "a11y-size-btn"}
                        onClick={() => update("textSize", s)}
                      >
                        {s === "normal" ? "A" : s === "large" ? "A+" : "A++"}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow label="High contrast mode" desc="Stronger contrast between text and backgrounds" checked={settings.highContrast} onChange={(v) => update("highContrast", v)} />
                <ToggleRow label="Underline links" desc="Make links identifiable without relying on color" checked={settings.underlineLinks} onChange={(v) => update("underlineLinks", v)} />
              </section>

              <section className="a11y-section">
                <h3><NavIcon.hand /> Motor</h3>
                <ToggleRow label="Larger click targets" desc="Bigger buttons and tap areas, easier to hit" checked={settings.largeTargets} onChange={(v) => update("largeTargets", v)} />
                <ToggleRow label="Reduce motion" desc="Turn off animations and transitions" checked={settings.reduceMotion} onChange={(v) => update("reduceMotion", v)} />
                <ToggleRow label="Visible keyboard focus" desc="Show a strong outline while navigating with a keyboard" checked={settings.keyboardFocus} onChange={(v) => update("keyboardFocus", v)} />
              </section>

              <section className="a11y-section">
                <h3><NavIcon.volume /> Hearing</h3>
                <ToggleRow label="Mute sounds by default" desc="Start Live Assistant with sound off" checked={settings.muteSoundsByDefault} onChange={(v) => update("muteSoundsByDefault", v)} />
                <ToggleRow label="Extended visual alerts" desc="Keep on-screen alerts and toasts visible longer" checked={settings.extendedAlerts} onChange={(v) => update("extendedAlerts", v)} />
              </section>

              <section className="a11y-section">
                <h3><NavIcon.sparkle /> Cognitive</h3>
                <ToggleRow label="Reading mode" desc="Wider line spacing and a clearer, dyslexia-friendly font" checked={settings.readingMode} onChange={(v) => update("readingMode", v)} />
                <ToggleRow label="Simplify layout" desc="Hide promotional banners and secondary content" checked={settings.simplifyLayout} onChange={(v) => update("simplifyLayout", v)} />
              </section>
            </div>

            <div className="a11y-panel-foot">
              <button className="a11y-reset" onClick={reset}><NavIcon.reset /> Reset to defaults</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
