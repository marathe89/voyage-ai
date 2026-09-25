import { useNavigate, useParams } from "react-router-dom";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { ShareButton } from "./ShareButton";
import { useCurrency } from "./currency";
import { bookings, typeIcon, statusMeta } from "./bookingsData";

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setToast, openWidget } = useShell();
  const { formatPriceString } = useCurrency();
  const b = bookings.find((x) => x.id === id);

  if (!b) {
    return (
      <div className="bk-detail-page">
        <div className="bk-detail-empty">
          <h1>Booking not found</h1>
          <p>We couldn't find that reservation.</p>
          <button className="dash-btn-primary" onClick={() => navigate("/bookings")}>Back to Bookings</button>
        </div>
      </div>
    );
  }

  const Icon = NavIcon[typeIcon[b.type]];
  const meta = statusMeta[b.status];

  const workflowSteps = [
    { key: "placed", label: "Booking Placed", desc: "Reservation created & payment received" },
    { key: "confirmed", label: "Confirmed", desc: b.status === "pending" ? "Awaiting confirmation from provider" : `Confirmation code ${b.code} issued` },
    { key: "upcoming", label: b.type === "hotel" ? "Check-in" : b.type === "flight" ? "Departure" : "Pickup", desc: `${b.date} · ${b.time}` },
    { key: "completed", label: "Completed", desc: b.type === "hotel" ? "Checked out" : b.type === "flight" ? "Arrived at destination" : "Trip completed" },
  ] as const;
  const workflowStepIndex = b.status === "pending" ? 1 : b.status === "confirmed" ? 2 : 4;

  function downloadBooking() {
    if (!b) return;
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

  return (
    <div className="bk-detail-page">
      <button className="bk-detail-back" onClick={() => navigate("/bookings")}><span className="chev chev-left"><NavIcon.chevronDown /></span> Back to Bookings</button>

      <div className="bk-detail-card">
        <div className="bk-detail-thumb" style={b.image ? { backgroundImage: `url(/images/${b.image})` } : { background: b.gradient }}>
          <span className="bk-thumb-icon"><Icon /></span>
          <span className={`bk-badge ${meta.className}`}><NavIcon.check /> {meta.label}</span>
        </div>
        <div className="bk-detail-body">
          <h1>{b.title}</h1>
          <p className="bk-detail-subtitle">{b.subtitle}</p>
          <div className="summary-rows bk-detail-rows">
            <div><span>Date</span><strong>{b.date}</strong></div>
            <div><span>Time</span><strong>{b.time}</strong></div>
            <div><span>Confirmation code</span><strong>{b.code}</strong></div>
            <div><span>Total paid</span><strong>{formatPriceString(b.price)}</strong></div>
          </div>

          <div className="bk-detail-workflow">
            <h2>Booking Progress</h2>
            <div className="bk-workflow-track">
              {workflowSteps.map((step, i) => {
                const isDone = i < workflowStepIndex;
                const isActive = i === workflowStepIndex;
                return (
                  <div key={step.key} className={`bk-workflow-step${isDone ? " done" : ""}${isActive ? " active" : ""}`}>
                    <div className="bk-workflow-dot">{isDone ? <NavIcon.check /> : i + 1}</div>
                    <div className="bk-workflow-text">
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bk-detail-actions">
            <ShareButton
              title={b.title}
              text={`${b.title} — ${b.subtitle}`}
              link={`https://voyageai.app/bookings/${b.id}`}
              label="Share Booking"
              buttonClassName="dash-btn-ghost light"
            />
            <button className="dash-btn-primary" onClick={downloadBooking}><NavIcon.download /> Download {b.type === "flight" ? "e-ticket" : b.type === "hotel" ? "voucher" : "receipt"}</button>
            <button className="dash-btn-ghost light" onClick={() => openWidget(`Help with my booking ${b.code}: ${b.title}`)}><NavIcon.chat /> Contact Support</button>
            {b.status !== "completed" && (
              <button className="bk-cancel-btn" onClick={() => { setToast(`Cancellation request sent for ${b.code}`); navigate("/bookings"); }}>Cancel booking</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
