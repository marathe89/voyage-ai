import { useState, type FormEvent } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { CurrencyConverter, useCurrency } from "./currency";

const stats = [
  { icon: "plane" as const, color: "#3c7ef2", value: "12", label: "Total Trips Funded" },
  { icon: "dollar" as const, color: "#4bb383", value: "$2,140", label: "Avg. Trip Cost" },
  { icon: "trendUp" as const, color: "#2fa8a3", value: "$1,280", label: "Total Savings" },
];

function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface Txn { icon: keyof typeof NavIcon; title: string; date: string; tag: string; amount: string; credit: boolean; }

const transactions: Txn[] = [
  { icon: "plane" as const, title: "Japan Airlines JL061", date: "Jun 2, 2026", tag: "Flight", amount: "-$892", credit: false },
  { icon: "hotel" as const, title: "Andaz Tokyo Hotel", date: "Jun 2, 2026", tag: "Hotel", amount: "-$2,140", credit: false },
  { icon: "reset" as const, title: "VoyageAI Refund", date: "Jun 1, 2026", tag: "Refund", amount: "+$340", credit: true },
  { icon: "transport" as const, title: "Narita Airport Transfer", date: "May 30, 2026", tag: "Transfer", amount: "-$85", credit: false },
  { icon: "dining" as const, title: "Ubud Restaurant Reserve", date: "May 18, 2026", tag: "Dining", amount: "-$124", credit: false },
  { icon: "hotel" as const, title: "Four Seasons Bali", date: "May 10, 2026", tag: "Hotel", amount: "-$3,200", credit: false },
];

type WalletAction = "add" | "send" | "withdraw" | "autotopup";

const quickActions: { icon: keyof typeof NavIcon; color: string; label: string; action: WalletAction }[] = [
  { icon: "plus", color: "#3c7ef2", label: "Add Money", action: "add" },
  { icon: "swap", color: "#4bb383", label: "Send Money", action: "send" },
  { icon: "download", color: "#9c6fe0", label: "Withdraw", action: "withdraw" },
  { icon: "reset", color: "#e5a13c", label: "Auto Top-up", action: "autotopup" },
];

const actionMeta: Record<WalletAction, { title: string; cta: string; needsRecipient?: boolean }> = {
  add: { title: "Add Money", cta: "Add Money" },
  send: { title: "Send Money", cta: "Send Money", needsRecipient: true },
  withdraw: { title: "Withdraw Funds", cta: "Withdraw" },
  autotopup: { title: "Auto Top-up", cta: "Save Settings" },
};

type PaymentType = "card" | "upi" | "netbanking";

interface PaymentMethod {
  id: string;
  type: PaymentType;
  label: string;
  detail: string;
  gateway: string;
  isDefault: boolean;
  icon: keyof typeof NavIcon;
}

const initialPaymentMethods: PaymentMethod[] = [
  { id: "pm1", type: "card", label: "HDFC Regalia", detail: "Visa •••• 4821 · Exp 08/28", gateway: "Razorpay", isDefault: true, icon: "creditCard" },
  { id: "pm2", type: "upi", label: "UPI", detail: "arjun.mehta@okhdfc", gateway: "VoyageAI Pay", isDefault: false, icon: "wallet" },
];

const gatewayOptions = ["VoyageAI Pay", "Razorpay", "PayPal", "Stripe"];
const bankOptions = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"];

const loyaltyPrograms = [
  { id: "jal", name: "Japan Airlines", tier: "Gold", tierClass: "wallet-tier-gold", pointsNum: 24600, valueNum: 295, pct: 62, color: "#e5a13c", icon: "plane" as const },
  { id: "marriott", name: "Marriott Bonvoy", tier: "Platinum", tierClass: "wallet-tier-platinum", pointsNum: 48200, valueNum: 578, pct: 88, color: "#9c6fe0", icon: "plane" as const },
  { id: "sq", name: "Singapore Air", tier: "Silver", tierClass: "wallet-tier-silver", pointsNum: 12400, valueNum: 149, pct: 32, color: "#8892a6", icon: "plane" as const },
];

const redeemOptions = [
  { key: "credit", icon: "wallet" as const, title: "Convert to Wallet Credit", desc: "Move points into your VoyageAI wallet balance instantly." },
  { key: "booking", icon: "plane" as const, title: "Apply to Next Booking", desc: "Use points to offset your next flight, hotel, or activity." },
  { key: "cash", icon: "creditCard" as const, title: "Cash Out to Card", desc: "Transfer the cash value to your default payment method." },
];

export function TravelWalletPage() {
  const { setToast } = useShell();
  const { format: formatCur, formatPriceString } = useCurrency();
  const [balance, setBalance] = useState(2840);
  const [txns, setTxns] = useState(transactions);
  const [activeAction, setActiveAction] = useState<WalletAction | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState("200");
  const [autoAmount, setAutoAmount] = useState("500");
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [pmType, setPmType] = useState<PaymentType>("card");
  const [pmCardName, setPmCardName] = useState("");
  const [pmCardNumber, setPmCardNumber] = useState("");
  const [pmExpiry, setPmExpiry] = useState("");
  const [pmCvv, setPmCvv] = useState("");
  const [pmUpiId, setPmUpiId] = useState("");
  const [pmBank, setPmBank] = useState(bankOptions[0]);
  const [pmAccountNumber, setPmAccountNumber] = useState("");
  const [pmGateway, setPmGateway] = useState(gatewayOptions[0]);
  const [pmSetDefault, setPmSetDefault] = useState(false);
  const [activeLoyalty, setActiveLoyalty] = useState<string | null>(null);

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function openAddPayment() {
    setPmType("card");
    setPmCardName("");
    setPmCardNumber("");
    setPmExpiry("");
    setPmCvv("");
    setPmUpiId("");
    setPmBank(bankOptions[0]);
    setPmAccountNumber("");
    setPmGateway(gatewayOptions[0]);
    setPmSetDefault(paymentMethods.length === 0);
    setAddPaymentOpen(true);
  }

  function submitAddPayment(e: FormEvent) {
    e.preventDefault();
    let label = "";
    let detail = "";
    let icon: keyof typeof NavIcon = "creditCard";
    if (pmType === "card") {
      if (pmCardName.trim().length < 2 || pmCardNumber.replace(/\s/g, "").length < 12 || !pmExpiry || pmCvv.length < 3) {
        setToast("Please fill in valid card details");
        return;
      }
      const last4 = pmCardNumber.replace(/\s/g, "").slice(-4);
      label = pmCardName.trim();
      detail = `Card •••• ${last4} · Exp ${pmExpiry}`;
      icon = "creditCard";
    } else if (pmType === "upi") {
      if (!/^[\w.-]+@[\w.-]+$/.test(pmUpiId.trim())) {
        setToast("Enter a valid UPI ID, e.g. name@bank");
        return;
      }
      label = "UPI";
      detail = pmUpiId.trim();
      icon = "wallet";
    } else {
      if (pmAccountNumber.replace(/\D/g, "").length < 6) {
        setToast("Enter a valid account number");
        return;
      }
      label = pmBank;
      detail = `Account •••• ${pmAccountNumber.replace(/\D/g, "").slice(-4)}`;
      icon = "bookmark";
    }
    const newMethod: PaymentMethod = { id: `pm-${Date.now()}`, type: pmType, label, detail, gateway: pmGateway, isDefault: pmSetDefault, icon };
    setPaymentMethods((prev) => (pmSetDefault ? prev.map((m) => ({ ...m, isDefault: false })) : prev).concat(newMethod));
    setToast(`${label} added via ${pmGateway}`);
    setAddPaymentOpen(false);
  }

  function removePaymentMethod(id: string) {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    setToast("Payment method removed");
  }

  function makeDefaultPaymentMethod(id: string) {
    setPaymentMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    setToast("Default payment method updated");
  }

  function redeemPoints(optionKey: string) {
    if (!activeLoyalty) return;
    const program = loyaltyPrograms.find((p) => p.id === activeLoyalty);
    if (!program) return;
    if (optionKey === "credit") {
      setBalance((b) => b + program.valueNum);
      setTxns((prev) => [{ icon: "award", title: `${program.name} points redeemed`, date: "Just now", tag: "Rewards", amount: `+${formatUSD(program.valueNum)}`, credit: true }, ...prev]);
      setToast(`${formatCur(program.valueNum)} added to your wallet from ${program.name} points`);
    } else if (optionKey === "booking") {
      setToast(`${program.pointsNum.toLocaleString()} ${program.name} points will be applied at your next checkout`);
    } else {
      setToast(`Cash-out of ${formatCur(program.valueNum)} requested to your default payment method`);
    }
    setActiveLoyalty(null);
  }

  function openAction(action: WalletAction) {
    setAmount("");
    setRecipient("");
    setActiveAction(action);
  }

  function submitAction() {
    if (!activeAction) return;
    if (activeAction === "autotopup") {
      setToast(autoEnabled ? `Auto top-up enabled: refill ${formatCur(Number(autoAmount) || 0)} when balance drops below ${formatCur(Number(autoThreshold) || 0)}` : "Auto top-up disabled");
      setActiveAction(null);
      return;
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      setToast("Enter a valid amount");
      return;
    }
    if (activeAction === "send" && !recipient.trim()) {
      setToast("Enter who you're sending money to");
      return;
    }
    if ((activeAction === "send" || activeAction === "withdraw") && value > balance) {
      setToast("Insufficient wallet balance");
      return;
    }
    if (activeAction === "add") {
      setBalance((b) => b + value);
      setTxns((prev) => [{ icon: "plus", title: "Wallet top-up", date: "Just now", tag: "Deposit", amount: `+${formatUSD(value)}`, credit: true }, ...prev]);
      setToast(`${formatUSD(value)} added to your wallet`);
    } else if (activeAction === "send") {
      setBalance((b) => b - value);
      setTxns((prev) => [{ icon: "swap", title: `Sent to ${recipient.trim()}`, date: "Just now", tag: "Transfer", amount: `-${formatUSD(value)}`, credit: false }, ...prev]);
      setToast(`${formatUSD(value)} sent to ${recipient.trim()}`);
    } else if (activeAction === "withdraw") {
      setBalance((b) => b - value);
      setTxns((prev) => [{ icon: "download", title: "Withdrawal to bank account", date: "Just now", tag: "Withdrawal", amount: `-${formatUSD(value)}`, credit: false }, ...prev]);
      setToast(`${formatUSD(value)} withdrawal initiated`);
    }
    setActiveAction(null);
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <div>
          <h1>Travel Wallet</h1>
          <p>All your travel finances in one place.</p>
        </div>
        <div className="wallet-header-actions">
          <CurrencyConverter />
          <button className="dash-btn-primary" onClick={openAddPayment}><span>+</span> Add Payment</button>
        </div>
      </div>

      <div className="wallet-stats">
        {stats.map((s) => {
          const Icon = NavIcon[s.icon];
          return (
            <span key={s.label} className="wallet-stats-item">
              <span style={{ color: s.color }}><Icon /></span>
              <strong>{s.value.includes("$") ? formatPriceString(s.value) : s.value}</strong> {s.label}
            </span>
          );
        })}
      </div>

      <div className="wallet-top">
        <div className="wallet-quick-card">
          <h3 className="wallet-section-title small">Quick Actions</h3>
          <div className="wallet-quick-grid">
            {quickActions.map((qa) => {
              const Icon = NavIcon[qa.icon];
              return (
                <button key={qa.label} className="wallet-quick-tile" onClick={() => openAction(qa.action)}>
                  <span style={{ background: qa.color }}><Icon /></span>
                  {qa.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="wallet-hero">
          <div className="wallet-hero-head">
            <span><NavIcon.creditCard /> VoyageAI Wallet</span>
            <span className="wallet-hero-coins"><i /><i /></span>
          </div>
          <strong className="wallet-hero-balance">{formatCur(balance)}</strong>
          <span className="wallet-hero-label">Available balance</span>
          <div className="wallet-hero-split">
            <div><span>Spent this year</span><strong>{formatCur(6441)}</strong></div>
            <div><span>Refunded</span><strong className="green">+{formatCur(340)}</strong></div>
          </div>
        </div>
      </div>

      <div className="wallet-section-head">
        <h2 className="wallet-section-title"><NavIcon.creditCard /> Payment Methods</h2>
        <button className="dash-redeem-link" onClick={openAddPayment}>+ Add new</button>
      </div>
      <div className="wallet-pm-list">
        {paymentMethods.length === 0 && <p className="discover-empty">No payment methods saved yet.</p>}
        {paymentMethods.map((m) => {
          const Icon = NavIcon[m.icon];
          return (
            <div key={m.id} className="wallet-pm-card">
              <span className="wallet-pm-icon"><Icon /></span>
              <div className="wallet-pm-info">
                <strong>{m.label} {m.isDefault && <em className="wallet-pm-default">Default</em>}</strong>
                <span>{m.detail} · via {m.gateway}</span>
              </div>
              <div className="wallet-pm-actions">
                {!m.isDefault && <button onClick={() => makeDefaultPaymentMethod(m.id)}>Make default</button>}
                <button onClick={() => removePaymentMethod(m.id)} aria-label={`Remove ${m.label}`}><NavIcon.trash /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wallet-layout">
        <div>
          <div className="wallet-section-head">
            <h2 className="wallet-section-title"><NavIcon.clock /> Recent Transactions</h2>
            <button className="dash-redeem-link" onClick={() => setToast("Opening full transaction history")}>View all</button>
          </div>
          <div className="wallet-txn-list">
            {txns.map((t, i) => {
              const Icon = NavIcon[t.icon];
              return (
                <div key={i} className="wallet-txn-row" onClick={() => setToast(`Viewing ${t.title} transaction`)}>
                  <span className="wallet-txn-icon"><Icon /></span>
                  <div className="wallet-txn-info"><strong>{t.title}</strong><em>{t.date} · {t.tag}</em></div>
                  <strong className={t.credit ? "wallet-txn-amount green" : "wallet-txn-amount"}>{formatPriceString(t.amount)}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="wallet-section-head">
            <h2 className="wallet-section-title"><NavIcon.award /> Loyalty Points</h2>
            <button className="dash-redeem-link" onClick={() => setActiveLoyalty(loyaltyPrograms[0].id)}>Redeem</button>
          </div>
          <div className="wallet-loyalty-list">
            {loyaltyPrograms.map((p) => {
              const Icon = NavIcon[p.icon];
              return (
                <div key={p.id} className="wallet-loyalty-card" onClick={() => setActiveLoyalty(p.id)}>
                  <div className="wallet-loyalty-head">
                    <span style={{ background: p.color }}><Icon /></span>
                    <div>
                      <strong>{p.name}</strong>
                      <span className={`wallet-tier ${p.tierClass}`}>{p.tier}</span>
                    </div>
                  </div>
                  <strong className="wallet-loyalty-pts">{p.pointsNum.toLocaleString()}</strong>
                  <span className="wallet-loyalty-sub">points · ≈{formatCur(p.valueNum)} value</span>
                  <div className="booking-progress-bar wallet-loyalty-bar"><span style={{ width: `${p.pct}%`, background: p.color }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeAction && (
        <div className="feature-modal-overlay" onClick={() => setActiveAction(null)}>
          <div className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()}>
            <button className="feature-modal-close" aria-label="Close" onClick={() => setActiveAction(null)}><NavIcon.close /></button>
            <h3>{actionMeta[activeAction].title}</h3>
            {activeAction !== "autotopup" ? (
              <>
                <p className="feature-modal-desc">
                  {activeAction === "add" && "Top up your VoyageAI wallet from a saved card or bank account."}
                  {activeAction === "send" && "Send money instantly to another VoyageAI user."}
                  {activeAction === "withdraw" && `Withdraw from your available balance of ${formatCur(balance)}.`}
                </p>
                <label className="wallet-modal-field">Amount (USD)
                  <input type="number" min={1} placeholder="e.g. 200" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                {actionMeta[activeAction].needsRecipient && (
                  <label className="wallet-modal-field">Send to
                    <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Email or VoyageAI username" />
                  </label>
                )}
              </>
            ) : (
              <>
                <p className="feature-modal-desc">Automatically top up your wallet whenever the balance runs low.</p>
                <label className="wallet-toggle-field">
                  <input type="checkbox" checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} />
                  Enable auto top-up
                </label>
                <label className="wallet-modal-field">When balance drops below (USD)
                  <input type="number" min={1} value={autoThreshold} onChange={(e) => setAutoThreshold(e.target.value)} disabled={!autoEnabled} />
                </label>
                <label className="wallet-modal-field">Top up by (USD)
                  <input type="number" min={1} value={autoAmount} onChange={(e) => setAutoAmount(e.target.value)} disabled={!autoEnabled} />
                </label>
              </>
            )}
            <button className="btn-primary feature-modal-cta" onClick={submitAction}>{actionMeta[activeAction].cta}</button>
          </div>
        </div>
      )}

      {addPaymentOpen && (
        <div className="feature-modal-overlay" onClick={() => setAddPaymentOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitAddPayment}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setAddPaymentOpen(false)}><NavIcon.close /></button>
            <h3>Add Payment Method</h3>
            <p className="feature-modal-desc">Save a card, UPI ID, or bank account to pay for bookings and top up your wallet.</p>

            <div className="wallet-pm-type-row">
              {(["card", "upi", "netbanking"] as const).map((t) => (
                <button key={t} type="button" className={pmType === t ? "wallet-pm-type active" : "wallet-pm-type"} onClick={() => setPmType(t)}>
                  {t === "card" ? "Credit/Debit Card" : t === "upi" ? "UPI" : "Net Banking"}
                </button>
              ))}
            </div>

            {pmType === "card" && (
              <>
                <label className="wallet-modal-field">Cardholder name
                  <input value={pmCardName} onChange={(e) => setPmCardName(e.target.value)} placeholder="Name on card" required />
                </label>
                <label className="wallet-modal-field">Card number
                  <input value={pmCardNumber} onChange={(e) => setPmCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric" required />
                </label>
                <div className="wallet-modal-field-row">
                  <label className="wallet-modal-field">Expiry
                    <input value={pmExpiry} onChange={(e) => setPmExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} required />
                  </label>
                  <label className="wallet-modal-field">CVV
                    <input value={pmCvv} onChange={(e) => setPmCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" required />
                  </label>
                </div>
              </>
            )}

            {pmType === "upi" && (
              <label className="wallet-modal-field">UPI ID
                <input value={pmUpiId} onChange={(e) => setPmUpiId(e.target.value)} placeholder="name@okhdfc" required />
              </label>
            )}

            {pmType === "netbanking" && (
              <>
                <label className="wallet-modal-field">Bank
                  <select value={pmBank} onChange={(e) => setPmBank(e.target.value)}>
                    {bankOptions.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </label>
                <label className="wallet-modal-field">Account number
                  <input value={pmAccountNumber} onChange={(e) => setPmAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))} placeholder="e.g. 0123456789" inputMode="numeric" required />
                </label>
              </>
            )}

            <label className="wallet-modal-field">Payment gateway
              <select value={pmGateway} onChange={(e) => setPmGateway(e.target.value)}>
                {gatewayOptions.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>

            <label className="wallet-toggle-field">
              <input type="checkbox" checked={pmSetDefault} onChange={(e) => setPmSetDefault(e.target.checked)} />
              Set as default payment method
            </label>

            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.check /> Save Payment Method</button>
          </form>
        </div>
      )}

      {activeLoyalty && (() => {
        const program = loyaltyPrograms.find((p) => p.id === activeLoyalty);
        if (!program) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setActiveLoyalty(null)}>
            <div className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()}>
              <button className="feature-modal-close" aria-label="Close" onClick={() => setActiveLoyalty(null)}><NavIcon.close /></button>
              <h3>{program.name} Rewards</h3>
              <p className="feature-modal-desc">{program.pointsNum.toLocaleString()} points · ≈{formatCur(program.valueNum)} value · {program.tier} tier</p>
              <div className="wallet-redeem-options">
                {redeemOptions.map((opt) => {
                  const OptIcon = NavIcon[opt.icon];
                  return (
                    <button key={opt.key} type="button" className="wallet-redeem-option" onClick={() => redeemPoints(opt.key)}>
                      <span style={{ background: program.color }}><OptIcon /></span>
                      <div><strong>{opt.title}</strong><span>{opt.desc}</span></div>
                      <NavIcon.chevronRight />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
