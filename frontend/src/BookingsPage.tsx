import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { ShareButton } from "./ShareButton";
import { CurrencyConverter, useCurrency } from "./currency";
import { bookings, typeIcon, statusMeta, type Booking } from "./bookingsData";

const filterPills: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "flight", label: "Flight" },
  { key: "hotel", label: "Hotel" },
  { key: "car", label: "Car" },
];

export function BookingsPage() {
  const navigate = useNavigate();
  const { setToast, openWidget } = useShell();
  const { formatPriceString } = useCurrency();
  const [filter, setFilter] = useState("all");

  const filtered = bookings.filter((b) => {
    if (filter !== "all" && b.type !== filter && b.status !== filter) return false;
    return true;
  });

  function downloadBooking(e: MouseEvent, b: Booking) {
    e.stopPropagation();
    const lines = [b.title, b.subtitle, `${b.date} · ${b.time}`, `Confirmation: ${b.code}`, `Total: ${b.price}`, `Status: ${statusMeta[b.status].label}`];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Downloaded ${b.code}`);
  }

  function contactAboutBooking(e: MouseEvent, b: Booking) {
    e.stopPropagation();
    openWidget(`Help with my booking ${b.code}: ${b.title}`);
  }

  return (
    <div className="bk-page">
      <div className="bk-header">
        <div>
          <h1>Bookings</h1>
          <p>{bookings.length} total reservations</p>
        </div>
        <CurrencyConverter />
      </div>

      <div className="bk-filters">
        {filterPills.map((p) => (
          <button key={p.key} className={filter === p.key ? "active" : ""} onClick={() => setFilter(p.key)}>{p.label}</button>
        ))}
      </div>

      <div className="bk-grid">
        {filtered.map((b) => {
          const Icon = NavIcon[typeIcon[b.type]];
          const meta = statusMeta[b.status];
          return (
            <article key={b.id} className="bk-card" onClick={() => navigate("/book")}>
              <div className="bk-card-thumb" style={b.image ? { backgroundImage: `url(/images/${b.image})` } : { background: b.gradient }}>
                <span className="bk-thumb-icon"><Icon /></span>
                <span className={`bk-badge ${meta.className}`}><NavIcon.check /> {meta.label}</span>
              </div>
              <div className="bk-card-body">
                <strong>{b.title}</strong>
                <span className="bk-row-sub">{b.subtitle}</span>
                <span className="bk-row-meta">{b.date} <span>·</span> {b.time}</span>
                <span className="bk-code">{b.code}</span>
                <div className="bk-card-bottom">
                  <strong className="bk-row-price">{formatPriceString(b.price)}</strong>
                </div>
                <div className="bk-card-actions">
                  <ShareButton
                    title={b.title}
                    text={`${b.title} — ${b.subtitle}`}
                    link={`https://voyageai.app/bookings/${b.id}`}
                    label="Share"
                    buttonClassName="bk-action-btn"
                  />
                  <button className="bk-action-btn" onClick={(e) => downloadBooking(e, b)}><NavIcon.download /> Download</button>
                  <button className="bk-action-btn" onClick={(e) => contactAboutBooking(e, b)}><NavIcon.chat /> Chat</button>
                </div>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <p className="discover-empty">No bookings match your search.</p>}
      </div>
    </div>
  );
}
