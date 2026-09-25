import { useState } from "react";

export const airportOptions = [
  "Mumbai (BOM)", "Delhi (DEL)", "Bengaluru (BLR)", "Chennai (MAA)", "Kolkata (CCU)",
  "Hyderabad (HYD)", "Ahmedabad (AMD)", "Pune (PNQ)", "Goa (GOI)", "Jaipur (JAI)", "Kochi (COK)",
  "Tokyo (NRT)", "Osaka (KIX)", "Singapore (SIN)", "Bangkok (BKK)", "Hong Kong (HKG)",
  "Bali (DPS)", "Kuala Lumpur (KUL)", "Dubai (DXB)", "Abu Dhabi (AUH)",
  "London (LHR)", "Paris (CDG)", "Rome (FCO)", "Amsterdam (AMS)", "Zurich (ZRH)",
  "New York (JFK)", "San Francisco (SFO)", "Los Angeles (LAX)", "Toronto (YYZ)",
  "Sydney (SYD)", "Melbourne (MEL)", "Auckland (AKL)", "Male (MLE)", "Kathmandu (KTM)",
];

export function AirportInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const suggestions = (query ? airportOptions.filter((a) => a.toLowerCase().includes(query)) : airportOptions).slice(0, 6);

  return (
    <div className="airport-input-wrap">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="airport-suggest">
          {suggestions.map((s) => (
            <button type="button" key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(s); setOpen(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
