import { useState } from "react";
import { NavIcon } from "./icons";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

export function formatDateDisplay(iso: string) {
  const parsed = parseISO(iso);
  if (!parsed) return "";
  return `${parsed.d}/${parsed.m + 1}/${parsed.y}`;
}

export function DatePicker({
  value,
  onChange,
  min,
  disabled,
  placeholder = "Select date",
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const minParsed = min ? parseISO(min) : null;
  const [viewY, setViewY] = useState(selected?.y ?? new Date().getFullYear());
  const [viewM, setViewM] = useState(selected?.m ?? new Date().getMonth());

  function openPicker() {
    if (disabled) return;
    const p = parseISO(value);
    if (p) {
      setViewY(p.y);
      setViewM(p.m);
    }
    setOpen((v) => !v);
  }

  const firstWeekday = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewY, viewM, 0).getDate();
  const cells: { day: number; inMonth: boolean; y: number; m: number }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, inMonth: false, y: viewM === 0 ? viewY - 1 : viewY, m: viewM === 0 ? 11 : viewM - 1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true, y: viewY, m: viewM });
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= trailing; d++) cells.push({ day: d, inMonth: false, y: viewM === 11 ? viewY + 1 : viewY, m: viewM === 11 ? 0 : viewM + 1 });

  function isBeforeMin(y: number, m: number, d: number) {
    if (!minParsed) return false;
    const iso = toISO(y, m, d);
    return iso < min!;
  }

  return (
    <div className="datepicker-wrap">
      <button type="button" className="datepicker-trigger" onClick={openPicker} disabled={disabled}>
        {value ? formatDateDisplay(value) : placeholder}
      </button>
      {open && (
        <div className="datepicker-pop" onClick={(e) => e.stopPropagation()}>
          <div className="datepicker-head">
            <strong>{monthNames[viewM]} {viewY}</strong>
            <div className="datepicker-nav">
              <button type="button" aria-label="Previous month" onClick={() => { if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); } else setViewM((m) => m - 1); }}>
                <span className="datepicker-chev-left"><NavIcon.chevronRight /></span>
              </button>
              <button type="button" aria-label="Next month" onClick={() => { if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); } else setViewM((m) => m + 1); }}>
                <NavIcon.chevronRight />
              </button>
            </div>
          </div>
          <div className="datepicker-weekdays">
            {weekdayLabels.map((w, i) => <span key={`${w}-${i}`}>{w}</span>)}
          </div>
          <div className="datepicker-grid">
            {cells.map((c, i) => {
              const iso = toISO(c.y, c.m, c.day);
              const isSelected = value === iso;
              const isDisabled = isBeforeMin(c.y, c.m, c.day);
              return (
                <button
                  key={i}
                  type="button"
                  className={isSelected ? "datepicker-day selected" : c.inMonth ? "datepicker-day" : "datepicker-day muted"}
                  disabled={isDisabled}
                  onClick={() => { onChange(iso); setOpen(false); }}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
          <div className="datepicker-foot">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>
            <button type="button" onClick={() => {
              const today = new Date();
              setViewY(today.getFullYear());
              setViewM(today.getMonth());
              onChange(toISO(today.getFullYear(), today.getMonth(), today.getDate()));
              setOpen(false);
            }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
