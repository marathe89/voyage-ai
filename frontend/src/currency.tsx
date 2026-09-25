import { createContext, useContext, useState, type ReactNode } from "react";
import { NavIcon } from "./icons";

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  rate: number; // units per 1 USD
}

export const currencies: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", label: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79 },
  { code: "INR", symbol: "₹", label: "Indian Rupee", rate: 83.2 },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", rate: 149.5 },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", rate: 1.53 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", rate: 1.34 },
];

interface CurrencyState {
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number, opts?: { maximumFractionDigits?: number }) => string;
  formatPriceString: (value: string) => string;
}

const CurrencyContext = createContext<CurrencyState | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);

  function setCurrencyCode(code: string) {
    const next = currencies.find((c) => c.code === code);
    if (next) setCurrency(next);
  }

  function convert(usdAmount: number) {
    return usdAmount * currency.rate;
  }

  function format(usdAmount: number, opts?: { maximumFractionDigits?: number }) {
    const converted = convert(usdAmount);
    return `${currency.symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: opts?.maximumFractionDigits ?? (currency.code === "JPY" ? 0 : 2) })}`;
  }

  function formatPriceString(value: string) {
    const match = value.match(/([+-]?)\$?([\d,]+(?:\.\d+)?)(.*)/);
    if (!match) return value;
    const [, sign, digits, suffix] = match;
    const amount = parseFloat(digits.replace(/,/g, ""));
    if (Number.isNaN(amount)) return value;
    const converted = amount * currency.rate;
    const maxFrac = currency.code === "JPY" ? 0 : amount % 1 !== 0 ? 2 : 0;
    return `${sign}${currency.symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: maxFrac })}${suffix}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode, convert, format, formatPriceString }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

export function CurrencyConverter({ className }: { className?: string }) {
  const { currency, setCurrencyCode } = useCurrency();
  return (
    <label className={className ? `currency-converter ${className}` : "currency-converter"}>
      <NavIcon.dollar />
      <select value={currency.code} onChange={(e) => setCurrencyCode(e.target.value)} aria-label="Display currency">
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>
        ))}
      </select>
    </label>
  );
}
