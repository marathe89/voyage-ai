import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { NavIcon } from "./icons";
import { useAuth } from "./auth";
import { useShell } from "./shell";

interface CheckoutLineItem { label: string; amount: number; }
interface CheckoutState { tripTitle?: string; items?: CheckoutLineItem[]; total?: number; }

const DEFAULT_ITEMS: CheckoutLineItem[] = [
  { label: "Flights", amount: 1720 },
  { label: "Hotel", amount: 1560 },
  { label: "Cabs & Transfers", amount: 220 },
  { label: "Restaurants", amount: 460 },
  { label: "Activities", amount: 280 },
];

function formatCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

type PayMethod = "card" | "upi" | "netbanking";
const bankOptions = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"];

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setToast } = useShell();
  const state = (location.state as CheckoutState | null) ?? {};
  const items = state.items?.length ? state.items : DEFAULT_ITEMS;
  const total = state.total ?? items.reduce((sum, i) => sum + i.amount, 0);
  const tripTitle = state.tripTitle ?? "Your Trip";

  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [cardName, setCardName] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState(bankOptions[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (payMethod === "card" && (cardNumber.replace(/\s/g, "").length < 12 || !expiry || cvv.length < 3)) {
      setToast("Please fill in valid card details");
      return;
    }
    if (payMethod === "upi" && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      setToast("Please enter a valid UPI ID");
      return;
    }
    if (payMethod === "netbanking" && accountNumber.replace(/\D/g, "").length < 6) {
      setToast("Please enter a valid account number");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setOrderId(`VYG-${Math.floor(100000 + Math.random() * 899999)}`);
    }, 1400);
  }

  if (orderId) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <span className="checkout-success-icon"><NavIcon.check /></span>
          <h1>Payment successful</h1>
          <p>Your booking for <strong>{tripTitle}</strong> is confirmed.</p>
          <div className="checkout-order-id">Order ID <strong>{orderId}</strong></div>
          <div className="checkout-success-actions">
            <Link to="/concierge" className="dash-btn-primary">View Itinerary</Link>
            <Link to="/dashboard" className="dash-btn-ghost light">Back to Dashboard</Link>
          </div>
          <p className="checkout-disclaimer">This is a simulated payment — no real charge was made.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-grid">
        <form className="checkout-card" onSubmit={handlePay}>
          <h1>Checkout</h1>
          <p className="checkout-sub">Complete payment for {tripTitle}</p>

          <div className="wallet-pm-type-row">
            {(["card", "upi", "netbanking"] as const).map((t) => (
              <button key={t} type="button" className={payMethod === t ? "wallet-pm-type active" : "wallet-pm-type"} onClick={() => setPayMethod(t)}>
                {t === "card" ? "Credit/Debit Card" : t === "upi" ? "UPI" : "Net Banking"}
              </button>
            ))}
          </div>

          {payMethod === "card" && (
            <>
              <label>Cardholder name
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" required />
              </label>
              <label>Card number
                <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric" required />
              </label>
              <div className="checkout-form-grid">
                <label>Expiry
                  <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} required />
                </label>
                <label>CVV
                  <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" required />
                </label>
              </div>
            </>
          )}

          {payMethod === "upi" && (
            <label>UPI ID
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@okhdfc" required />
            </label>
          )}

          {payMethod === "netbanking" && (
            <>
              <label>Bank
                <select value={bank} onChange={(e) => setBank(e.target.value)}>
                  {bankOptions.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
              <label>Account number
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))} placeholder="e.g. 0123456789" inputMode="numeric" required />
              </label>
            </>
          )}

          <button type="submit" className="dash-btn-primary auth-submit" disabled={processing}>
            {processing ? "Processing…" : `Pay $${total.toLocaleString()}`}
          </button>
          <p className="checkout-disclaimer">Demo checkout — no real payment provider is connected, and no card details leave your browser.</p>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="summary-rows">
            {items.map((item) => (
              <div key={item.label}><span>{item.label}</span><strong>${item.amount.toLocaleString()}</strong></div>
            ))}
          </div>
          <div className="summary-total"><span>Total</span><strong>${total.toLocaleString()}</strong></div>
        </div>
      </div>
    </div>
  );
}
