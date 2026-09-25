import { useState, type FormEvent } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { useAuth } from "./auth";

const defaultDnaStats = [
  { icon: "sun" as const, label: "Preferred season", value: "Oct–Mar (post-monsoon, winter)" },
  { icon: "clock" as const, label: "Avg. trip length", value: "9.4 days" },
  { icon: "globe" as const, label: "Preferred region", value: "East Asia (40%), Europe (30%)" },
  { icon: "calendar" as const, label: "Booking lead time", value: "6–8 weeks before departure" },
  { icon: "dollar" as const, label: "Avg. trip budget", value: "$2,800 per trip" },
  { icon: "family" as const, label: "Travel companions", value: "Family (67%), Solo (25%)" },
];

const travelStyles = [
  { key: "adventure", icon: "adventure" as const, color: "#4bb383", label: "Adventure", desc: "Hiking, trekking, extreme sports" },
  { key: "luxury", icon: "crown" as const, color: "#e5a13c", label: "Luxury", desc: "5-star stays, fine dining, business" },
  { key: "wellness", icon: "wellness" as const, color: "#2fa8a3", label: "Wellness", desc: "Spa, yoga, meditation retreats" },
  { key: "business", icon: "briefcase" as const, color: "#3c7ef2", label: "Business", desc: "Corporate travel, fast check-in" },
];

const allAmenities = ["Spa", "Yoga", "Kids Club", "Pet Friendly", "Pool", "Beach Access", "Vegan Dining", "Gym", "Late Checkout", "Airport Lounge", "Early Check-in", "Butler Service"];

interface VisaRequirement { flag: string; status: "Visa-free" | "Visa on Arrival" | "eVisa Required" | "Visa Required"; kind: "good" | "warn" | "bad"; stay: string; note: string; }
const visaRequirementLookup: Record<string, VisaRequirement> = {
  "united states": { flag: "🇺🇸", status: "Visa Required", kind: "bad", stay: "Up to 6 months (B1/B2)", note: "Apply for a B1/B2 tourist visa at the US Embassy/Consulate before travel. Interview required." },
  "united kingdom": { flag: "🇬🇧", status: "Visa Required", kind: "bad", stay: "Up to 6 months", note: "Apply for a Standard Visitor visa online before travel." },
  "japan": { flag: "🇯🇵", status: "eVisa Required", kind: "warn", stay: "Up to 90 days", note: "Apply for a Japan e-Visa or through a visa agent; processing takes 5–7 business days." },
  "singapore": { flag: "🇸🇬", status: "eVisa Required", kind: "warn", stay: "Up to 30 days", note: "Apply for a Singapore eVisa online; approval usually takes 1–3 business days." },
  "thailand": { flag: "🇹🇭", status: "Visa on Arrival", kind: "warn", stay: "Up to 15 days", note: "Visa on arrival available at major airports for a fee. eVisa also accepted." },
  "uae": { flag: "🇦🇪", status: "eVisa Required", kind: "warn", stay: "Up to 30 days", note: "Apply for a UAE tourist eVisa online through an airline or visa agent." },
  "united arab emirates": { flag: "🇦🇪", status: "eVisa Required", kind: "warn", stay: "Up to 30 days", note: "Apply for a UAE tourist eVisa online through an airline or visa agent." },
  "schengen area": { flag: "🇪🇺", status: "Visa Required", kind: "bad", stay: "Up to 90 days in 180", note: "Apply for a Short-stay Schengen C visa at the consulate of your main destination country." },
  "indonesia": { flag: "🇮🇩", status: "Visa on Arrival", kind: "warn", stay: "Up to 30 days", note: "Visa on arrival available at major airports, extendable once." },
  "maldives": { flag: "🇲🇻", status: "Visa-free", kind: "good", stay: "Up to 30 days", note: "Free 30-day visa issued on arrival, no application needed." },
  "nepal": { flag: "🇳🇵", status: "Visa-free", kind: "good", stay: "Unlimited (open border)", note: "No visa required — free movement under the India–Nepal treaty." },
  "bhutan": { flag: "🇧🇹", status: "Visa-free", kind: "good", stay: "Up to 14 days on permit", note: "No visa required, but an entry permit is needed on arrival." },
  "sri lanka": { flag: "🇱🇰", status: "eVisa Required", kind: "warn", stay: "Up to 30 days", note: "Apply for an ETA online before travel; approval is usually instant." },
};

interface Passport { id: string; holderName: string; country: string; flag: string; label: "Primary" | "Secondary"; number: string; expires: string; note: string; }
const initialPassports: Passport[] = [
  { id: "in", holderName: "Arjun Mehta", country: "India", flag: "🇮🇳", label: "Primary", number: "Z •••• •••4", expires: "Sep 2031", note: "Indian" },
  { id: "us", holderName: "Arjun Mehta", country: "United States", flag: "🇺🇸", label: "Secondary", number: "A •••• •••9", expires: "Mar 2028", note: "Indian-American OCI" },
];

interface Visa { id: string; holderName: string; country: string; flag: string; type: string; expires: string; status: "Valid" | "Expired" | "Expiring Soon"; }
const initialVisas: Visa[] = [
  { id: "v1", holderName: "Arjun Mehta", country: "United States", flag: "🇺🇸", type: "B1/B2 Tourist", expires: "Mar 2032", status: "Valid" },
  { id: "v2", holderName: "Arjun Mehta", country: "United Kingdom", flag: "🇬🇧", type: "Standard Visitor", expires: "Jan 2025", status: "Expired" },
  { id: "v3", holderName: "Priya Mehta", country: "Schengen Area", flag: "🇪🇺", type: "Short-stay C", expires: "Sep 2026", status: "Expiring Soon" },
];

interface FamilyMember { id: string; name: string; relation: "Primary" | "Spouse" | "Child"; dob: string; expires: string; status: "Valid" | "Expiring Soon"; avatar?: string; initials?: string; }
const initialFamily: FamilyMember[] = [
  { id: "f1", name: "Arjun Mehta", relation: "Primary", dob: "12 Mar 1985", expires: "Sep 2031", status: "Valid", avatar: "avatar-user.jpg" },
  { id: "f2", name: "Priya Mehta", relation: "Spouse", dob: "22 Jul 1987", expires: "Jan 2030", status: "Valid", avatar: "avatar-emma.png" },
  { id: "f3", name: "Arya Mehta", relation: "Child", dob: "05 Jun 2015", expires: "Jun 2025", status: "Expiring Soon", initials: "AR", avatar: "avatar-child-girl.svg" },
  { id: "f4", name: "Vihaan Mehta", relation: "Child", dob: "18 Nov 2018", expires: "Nov 2028", status: "Valid", initials: "VH", avatar: "avatar-child-boy.svg" },
];

interface ProfilePayment { id: string; type: "card" | "upi"; cardName?: string; last4?: string; expiry?: string; upiId?: string; isDefault: boolean; }
const initialPayments: ProfilePayment[] = [
  { id: "pp1", type: "card", cardName: "Arjun Mehta", last4: "4821", expiry: "08/28", isDefault: true },
  { id: "pp2", type: "upi", upiId: "arjun.mehta@okhdfc", isDefault: false },
];

interface Loyalty { id: string; name: string; icon: keyof typeof NavIcon; color: string; expires: string; points: string; value: string; tier: string; tierClass: string; pct: number; nextLabel: string; }
const loyaltyPrograms: Loyalty[] = [
  { id: "l1", name: "Air India Flying Returns", icon: "plane", color: "#3c7ef2", expires: "Dec 2028", points: "24,600", value: "$295", tier: "Gold", tierClass: "prof-tier-gold", pct: 62, nextLabel: "25,400 pts to Platinum" },
  { id: "l2", name: "Marriott Bonvoy", icon: "hotel", color: "#9c6fe0", expires: "Jan 2027", points: "48,200", value: "$578", tier: "Platinum", tierClass: "prof-tier-platinum", pct: 88, nextLabel: "1,800 pts to Titanium" },
  { id: "l3", name: "Singapore KrisFlyer", icon: "plane", color: "#8892a6", expires: "Jun 2027", points: "12,400", value: "$149", tier: "Silver", tierClass: "prof-tier-silver", pct: 28, nextLabel: "12,600 pts to Gold" },
  { id: "l4", name: "Hilton Honors", icon: "hotel", color: "#2fa8a3", expires: "Mar 2027", points: "82,000", value: "$984", tier: "Diamond", tierClass: "prof-tier-diamond", pct: 82, nextLabel: "18,000 pts to Max" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button className={on ? "prof-toggle on" : "prof-toggle"} onClick={onChange} role="switch" aria-checked={on}>
      <span />
    </button>
  );
}

export function ProfilePage() {
  const { setToast } = useShell();
  const { user, updateProfile } = useAuth();
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set(["adventure", "wellness"]));
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set(["Spa", "Yoga", "Kids Club", "Pet Friendly", "Pool", "Airport Lounge"]));
  const [passports, setPassports] = useState(initialPassports);
  const [visas, setVisas] = useState(initialVisas);
  const [family, setFamily] = useState(initialFamily);
  const [payments, setPayments] = useState(initialPayments);
  const [notif, setNotif] = useState({ flights: true, price: true, weather: true, marketing: false });
  const [privacy, setPrivacy] = useState({ ai: true, location: true, biometric: false, twoFactor: true, share: false, partners: false });
  const [dnaStats, setDnaStats] = useState(defaultDnaStats);
  const [dnaLearnedFrom, setDnaLearnedFrom] = useState(12);
  const [recalibrating, setRecalibrating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "Arjun Mehta");
  const [editEmail, setEditEmail] = useState(user?.email ?? "arjun.mehta@email.com");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "+91 98200 34512");
  const [editLocation, setEditLocation] = useState(user?.location ?? "Mumbai, India");

  const displayName = user?.name ?? "Arjun Mehta";
  const displayEmail = user?.email ?? "arjun.mehta@email.com";
  const displayPhone = user?.phone ?? "+91 98200 34512";
  const displayLocation = user?.location ?? "Mumbai, India";
  const displayAvatar = user?.avatar ?? "/images/avatar-user.jpg";

  function startEdit() {
    setEditName(displayName);
    setEditEmail(displayEmail);
    setEditPhone(displayPhone);
    setEditLocation(displayLocation);
    setEditing(true);
  }
  function saveEdit() {
    if (user) updateProfile({ name: editName, email: editEmail, phone: editPhone, location: editLocation });
    setEditing(false);
    setToast(user ? "Profile updated" : "Log in to save profile changes");
  }

  function recalibrateAi() {
    if (recalibrating) return;
    setRecalibrating(true);
    setToast("Recalibrating AI from your latest trips...");
    setTimeout(() => {
      setDnaStats(defaultDnaStats);
      setSelectedStyles(new Set(["adventure", "wellness"]));
      setDnaLearnedFrom((n) => n + 1);
      setRecalibrating(false);
      setToast("AI recalibrated with your latest trip data");
    }, 1200);
  }

  function clearLearningData() {
    setDnaStats([]);
    setSelectedStyles(new Set());
    setSelectedAmenities(new Set());
    setDnaLearnedFrom(0);
    setToast("Learning data cleared");
  }

  function toggleStyle(key: string) {
    setSelectedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a); else next.add(a);
      return next;
    });
  }
  function setPrimary(id: string) {
    setPassports((prev) => prev.map((p) => ({ ...p, label: p.id === id ? "Primary" : "Secondary" })));
    setToast("Primary passport updated");
  }
  function removePassport(id: string) {
    setPassports((prev) => prev.filter((p) => p.id !== id));
    setToast("Document removed");
  }

  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [editingPassportId, setEditingPassportId] = useState<string | null>(null);
  const [ppHolderName, setPpHolderName] = useState("");
  const [ppCountry, setPpCountry] = useState("");
  const [ppFlag, setPpFlag] = useState("🛂");
  const [ppNumber, setPpNumber] = useState("");
  const [ppExpires, setPpExpires] = useState("");
  const [ppNote, setPpNote] = useState("");

  function openAddPassport() {
    setEditingPassportId(null);
    setPpHolderName(displayName);
    setPpCountry("");
    setPpFlag("🛂");
    setPpNumber("");
    setPpExpires("");
    setPpNote("");
    setPassportModalOpen(true);
  }
  function openEditPassport(p: Passport) {
    setEditingPassportId(p.id);
    setPpHolderName(p.holderName);
    setPpCountry(p.country);
    setPpFlag(p.flag);
    setPpNumber(p.number);
    setPpExpires(p.expires);
    setPpNote(p.note);
    setPassportModalOpen(true);
  }
  function savePassport(e: FormEvent) {
    e.preventDefault();
    if (!ppHolderName.trim() || !ppCountry.trim() || !ppNumber.trim() || !ppExpires.trim()) {
      setToast("Please fill in all passport details");
      return;
    }
    if (editingPassportId) {
      setPassports((prev) => prev.map((p) => (p.id === editingPassportId ? { ...p, holderName: ppHolderName.trim(), country: ppCountry.trim(), flag: ppFlag || "🛂", number: ppNumber.trim(), expires: ppExpires.trim(), note: ppNote.trim() } : p)));
      setToast("Passport updated");
    } else {
      const newPassport: Passport = { id: `pp-${Date.now()}`, holderName: ppHolderName.trim(), country: ppCountry.trim(), flag: ppFlag || "🛂", label: passports.length === 0 ? "Primary" : "Secondary", number: ppNumber.trim(), expires: ppExpires.trim(), note: ppNote.trim() };
      setPassports((prev) => [...prev, newPassport]);
      setToast("Passport added");
    }
    setPassportModalOpen(false);
  }

  const [visaModalOpen, setVisaModalOpen] = useState(false);
  const [editingVisaId, setEditingVisaId] = useState<string | null>(null);
  const [vsHolderName, setVsHolderName] = useState("");
  const [vsCountry, setVsCountry] = useState("");
  const [vsFlag, setVsFlag] = useState("🛂");
  const [vsType, setVsType] = useState("");
  const [vsExpires, setVsExpires] = useState("");
  const [vsStatus, setVsStatus] = useState<Visa["status"]>("Valid");

  function openAddVisa() {
    setEditingVisaId(null);
    setVsHolderName(displayName);
    setVsCountry("");
    setVsFlag("🛂");
    setVsType("");
    setVsExpires("");
    setVsStatus("Valid");
    setVisaModalOpen(true);
  }
  function openEditVisa(v: Visa) {
    setEditingVisaId(v.id);
    setVsHolderName(v.holderName);
    setVsCountry(v.country);
    setVsFlag(v.flag);
    setVsType(v.type);
    setVsExpires(v.expires);
    setVsStatus(v.status);
    setVisaModalOpen(true);
  }
  function saveVisa(e: FormEvent) {
    e.preventDefault();
    if (!vsHolderName.trim() || !vsCountry.trim() || !vsType.trim() || !vsExpires.trim()) {
      setToast("Please fill in all visa details");
      return;
    }
    if (editingVisaId) {
      setVisas((prev) => prev.map((v) => (v.id === editingVisaId ? { ...v, holderName: vsHolderName.trim(), country: vsCountry.trim(), flag: vsFlag || "🛂", type: vsType.trim(), expires: vsExpires.trim(), status: vsStatus } : v)));
      setToast("Visa updated");
    } else {
      const newVisa: Visa = { id: `visa-${Date.now()}`, holderName: vsHolderName.trim(), country: vsCountry.trim(), flag: vsFlag || "🛂", type: vsType.trim(), expires: vsExpires.trim(), status: vsStatus };
      setVisas((prev) => [...prev, newVisa]);
      setToast("Visa added");
    }
    setVisaModalOpen(false);
  }
  function deleteVisa(id: string) {
    setVisas((prev) => prev.filter((v) => v.id !== id));
    setToast("Visa removed");
  }

  const [visaCheckerOpen, setVisaCheckerOpen] = useState(false);
  const [vcNationality, setVcNationality] = useState("India");
  const [vcDestination, setVcDestination] = useState("");
  const [vcResult, setVcResult] = useState<VisaRequirement | null>(null);
  const [vcChecked, setVcChecked] = useState(false);

  function openVisaChecker() {
    setVcNationality("India");
    setVcDestination("");
    setVcResult(null);
    setVcChecked(false);
    setVisaCheckerOpen(true);
  }
  function runVisaCheck(e: FormEvent) {
    e.preventDefault();
    if (!vcDestination.trim()) {
      setToast("Enter a destination to check");
      return;
    }
    const match = visaRequirementLookup[vcDestination.trim().toLowerCase()];
    setVcResult(match ?? { flag: "🌍", status: "eVisa Required", kind: "warn", stay: "Varies by country", note: "We don't have specific data for this destination yet — check the nearest embassy or consulate website for exact requirements." });
    setVcChecked(true);
  }
  function addCheckedVisaToDocuments() {
    if (!vcResult) return;
    setVisaCheckerOpen(false);
    setEditingVisaId(null);
    setVsHolderName(displayName);
    setVsCountry(vcDestination.trim());
    setVsFlag(vcResult.flag);
    setVsType(vcResult.status === "Visa-free" ? "Visa-free entry" : "Tourist");
    setVsExpires("");
    setVsStatus("Valid");
    setVisaModalOpen(true);
  }

  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [fmName, setFmName] = useState("");
  const [fmRelation, setFmRelation] = useState<FamilyMember["relation"]>("Child");
  const [fmDob, setFmDob] = useState("");
  const [fmExpires, setFmExpires] = useState("");
  const [fmStatus, setFmStatus] = useState<FamilyMember["status"]>("Valid");

  function openAddFamily() {
    setEditingFamilyId(null);
    setFmName("");
    setFmRelation("Child");
    setFmDob("");
    setFmExpires("");
    setFmStatus("Valid");
    setFamilyModalOpen(true);
  }
  function openEditFamily(m: FamilyMember) {
    setEditingFamilyId(m.id);
    setFmName(m.name);
    setFmRelation(m.relation);
    setFmDob(m.dob);
    setFmExpires(m.expires);
    setFmStatus(m.status);
    setFamilyModalOpen(true);
  }
  function saveFamily(e: FormEvent) {
    e.preventDefault();
    if (!fmName.trim() || !fmDob.trim() || !fmExpires.trim()) {
      setToast("Please fill in all family member details");
      return;
    }
    if (editingFamilyId) {
      setFamily((prev) => prev.map((m) => (m.id === editingFamilyId ? { ...m, name: fmName.trim(), relation: fmRelation, dob: fmDob.trim(), expires: fmExpires.trim(), status: fmStatus } : m)));
      setToast("Family member updated");
    } else {
      const initials = fmName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      const newMember: FamilyMember = { id: `fam-${Date.now()}`, name: fmName.trim(), relation: fmRelation, dob: fmDob.trim(), expires: fmExpires.trim(), status: fmStatus, initials };
      setFamily((prev) => [...prev, newMember]);
      setToast("Family member added");
    }
    setFamilyModalOpen(false);
  }
  function deleteFamily(id: string) {
    setFamily((prev) => prev.filter((m) => m.id !== id));
    setToast("Family member removed");
  }

  function formatPayCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payType, setPayType] = useState<"card" | "upi">("card");
  const [payCardName, setPayCardName] = useState("");
  const [payCardNumber, setPayCardNumber] = useState("");
  const [payExpiry, setPayExpiry] = useState("");
  const [payCvv, setPayCvv] = useState("");
  const [payUpiId, setPayUpiId] = useState("");
  const [paySetDefault, setPaySetDefault] = useState(false);

  function openAddPayment() {
    setEditingPaymentId(null);
    setPayType("card");
    setPayCardName("");
    setPayCardNumber("");
    setPayExpiry("");
    setPayCvv("");
    setPayUpiId("");
    setPaySetDefault(payments.length === 0);
    setPaymentModalOpen(true);
  }
  function openEditPayment(p: ProfilePayment) {
    setEditingPaymentId(p.id);
    setPayType(p.type);
    setPayCardName(p.cardName ?? "");
    setPayCardNumber("");
    setPayExpiry(p.expiry ?? "");
    setPayCvv("");
    setPayUpiId(p.upiId ?? "");
    setPaySetDefault(p.isDefault);
    setPaymentModalOpen(true);
  }
  function submitPayment(e: FormEvent) {
    e.preventDefault();
    let entry: ProfilePayment;
    if (payType === "card") {
      const digits = payCardNumber.replace(/\s/g, "");
      if (payCardName.trim().length < 2 || !payExpiry || (!editingPaymentId && digits.length < 12)) {
        setToast("Please fill in valid card details");
        return;
      }
      const last4 = digits.length >= 4 ? digits.slice(-4) : payments.find((p) => p.id === editingPaymentId)?.last4 ?? "0000";
      entry = { id: editingPaymentId ?? `pp-${Date.now()}`, type: "card", cardName: payCardName.trim(), last4, expiry: payExpiry, isDefault: paySetDefault };
    } else {
      if (!/^[\w.-]+@[\w.-]+$/.test(payUpiId.trim())) {
        setToast("Enter a valid UPI ID, e.g. name@bank");
        return;
      }
      entry = { id: editingPaymentId ?? `pp-${Date.now()}`, type: "upi", upiId: payUpiId.trim(), isDefault: paySetDefault };
    }
    setPayments((prev) => {
      const withoutOld = prev.filter((p) => p.id !== entry.id);
      const cleared = paySetDefault ? withoutOld.map((p) => ({ ...p, isDefault: false })) : withoutOld;
      return [...cleared, entry];
    });
    setToast(editingPaymentId ? "Payment method updated" : "Payment method added");
    setPaymentModalOpen(false);
  }
  function deletePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    setToast("Payment method removed");
  }
  function makeDefaultPayment(id: string) {
    setPayments((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
    setToast("Default payment method updated");
  }

  return (
    <div className="prof-page">
      <div className="prof-hero">
        <img className="prof-avatar" src={displayAvatar} alt="" />
        {editing ? (
          <div className="prof-hero-info prof-hero-edit">
            <div className="prof-edit-grid">
              <label>Name<input value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
              <label>Email<input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></label>
              <label>Phone<input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></label>
              <label>Location<input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} /></label>
            </div>
            <div className="prof-edit-actions">
              <button className="dash-btn-primary" onClick={saveEdit}><NavIcon.check /> Save</button>
              <button className="dash-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="prof-hero-info">
            <div className="prof-hero-top">
              <strong>{displayName}</strong>
              <span className="prof-verified"><NavIcon.check /></span>
            </div>
            <p className="prof-hero-contact"><NavIcon.chat /> {displayEmail} <span>·</span> <NavIcon.phone /> {displayPhone} <span>·</span> <NavIcon.location /> {displayLocation}</p>
            <div className="prof-hero-pills">
              <span><NavIcon.plane /> 12 Trips</span>
              <span><NavIcon.globe /> 8 Countries</span>
              <span><NavIcon.crown /> Gold Member</span>
              <span><NavIcon.sparkle /> AI Traveler</span>
            </div>
          </div>
        )}
        {!editing && <button className="dash-btn-ghost" onClick={startEdit}><NavIcon.edit /> Edit Profile</button>}
      </div>

      <div className="prof-body">
        <div className="dash-card prof-dna">
          <div className="dash-card-head">
            <h3><NavIcon.sparkle /> Your AI Travel DNA</h3>
            <span className="prof-learned">{dnaLearnedFrom > 0 ? `Learned from ${dnaLearnedFrom} trips` : "No learning data yet"}</span>
          </div>
          {dnaStats.length > 0 ? (
            <div className="prof-dna-grid">
              {dnaStats.map((s) => {
                const Icon = NavIcon[s.icon];
                return (
                  <div key={s.label} className="prof-dna-tile">
                    <span><Icon /></span>
                    <div><em>{s.label}</em><strong>{s.value}</strong></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="prof-dna-empty">Learning data has been cleared. Recalibrate to rebuild your travel profile from past trips.</p>
          )}
          <div className="prof-dna-actions">
            <button onClick={recalibrateAi} disabled={recalibrating}>
              <span className={recalibrating ? "prof-spin" : ""}><NavIcon.reset /></span> {recalibrating ? "Recalibrating…" : "Recalibrate AI"}
            </button>
            <button onClick={clearLearningData}><NavIcon.trash /> Clear learning data</button>
          </div>
        </div>

        <div className="dash-card">
          <h3 className="dash-card-title"><NavIcon.sparkle /> Travel Style</h3>
          <p className="prof-sub">Select all that match how you love to travel</p>
          <div className="prof-style-grid">
            {travelStyles.map((s) => {
              const Icon = NavIcon[s.icon];
              const active = selectedStyles.has(s.key);
              return (
                <button key={s.key} className={active ? "prof-style-card active" : "prof-style-card"} onClick={() => toggleStyle(s.key)}>
                  {active && <span className="prof-style-check"><NavIcon.check /></span>}
                  <span className="prof-style-icon" style={{ background: `${s.color}22`, color: s.color }}><Icon /></span>
                  <strong style={active ? { color: s.color } : undefined}>{s.label}</strong>
                  <em>{s.desc}</em>
                </button>
              );
            })}
          </div>
        </div>

        <div className="dash-card">
          <h3 className="dash-card-title"><NavIcon.star /> Amenity Preferences</h3>
          <p className="prof-sub">AI will prioritize these when recommending stays</p>
          <div className="prof-amenity-list">
            {allAmenities.map((a) => (
              <button key={a} className={selectedAmenities.has(a) ? "prof-amenity active" : "prof-amenity"} onClick={() => toggleAmenity(a)}>
                {a} {selectedAmenities.has(a) && <NavIcon.check />}
              </button>
            ))}
          </div>
          <p className="prof-amenity-note"><NavIcon.sparkle /> {selectedAmenities.size} preferences active · AI will filter out stays that don't match</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3><NavIcon.creditCard /> Payment Methods</h3>
            <span className="prof-learned">Securely encrypted with AES-256</span>
          </div>
          <div className="wallet-pm-list">
            {payments.length === 0 && <p className="discover-empty">No payment methods saved yet.</p>}
            {payments.map((p) => {
              const Icon = NavIcon[p.type === "card" ? "creditCard" : "wallet"];
              const label = p.type === "card" ? p.cardName : "UPI";
              const detail = p.type === "card" ? `Card •••• ${p.last4} · Exp ${p.expiry}` : p.upiId;
              return (
                <div key={p.id} className="wallet-pm-card">
                  <span className="wallet-pm-icon"><Icon /></span>
                  <div className="wallet-pm-info">
                    <strong>{label} {p.isDefault && <em className="wallet-pm-default">Default</em>}</strong>
                    <span>{detail}</span>
                  </div>
                  <div className="wallet-pm-actions">
                    {!p.isDefault && <button onClick={() => makeDefaultPayment(p.id)}>Make default</button>}
                    <button aria-label={`Edit ${label}`} onClick={() => openEditPayment(p)}><NavIcon.edit /></button>
                    <button aria-label={`Remove ${label}`} onClick={() => deletePayment(p.id)}><NavIcon.trash /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="prof-add-row" onClick={openAddPayment}><NavIcon.plus /> Add payment method</button>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3><NavIcon.lock /> Saved Passports &amp; Documents</h3>
            <span className="prof-learned">Securely encrypted with AES-256</span>
          </div>
          <div className="prof-doc-list">
            {passports.map((p) => (
              <div key={p.id} className={p.label === "Primary" ? "prof-doc-row primary" : "prof-doc-row"}>
                <span className="prof-doc-flag">{p.flag}</span>
                <div className="prof-doc-info">
                  <strong>{p.country} {p.label === "Primary" && <span className="prof-mini-badge blue">Primary</span>}</strong>
                  <span>{p.holderName} · Passport: {p.number} · Expires: {p.expires}</span>
                  <em>{p.note}</em>
                </div>
                <div className="prof-doc-actions">
                  <span className="prof-text-btn-slot">
                    {p.label !== "Primary" && <button className="prof-text-btn" onClick={() => setPrimary(p.id)}>Set Primary</button>}
                  </span>
                  <button aria-label="Edit" onClick={() => openEditPassport(p)}><NavIcon.edit /></button>
                  <button aria-label="Delete" onClick={() => removePassport(p.id)}><NavIcon.trash /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="prof-add-row" onClick={openAddPassport}><NavIcon.plus /> Add passport or travel document</button>

          <div className="prof-visa-head">
            <h4><NavIcon.globe /> Visas</h4>
            <div className="prof-visa-actions">
              <button onClick={openVisaChecker}><NavIcon.search /> Visa Checker</button>
            </div>
          </div>
          <div className="prof-doc-list">
            {visas.map((v) => (
              <div key={v.id} className="prof-visa-row">
                <span className="prof-doc-flag">{v.flag}</span>
                <div className="prof-doc-info">
                  <strong>{v.country}</strong>
                  <span>{v.holderName} · {v.type} · Expires {v.expires}</span>
                </div>
                <span className={`prof-status-badge ${v.status === "Valid" ? "green" : v.status === "Expired" ? "red" : "orange"}`}>{v.status}</span>
                <button aria-label="Edit visa" onClick={() => openEditVisa(v)}><NavIcon.edit /></button>
                <button aria-label="Delete visa" onClick={() => deleteVisa(v.id)}><NavIcon.trash /></button>
              </div>
            ))}
          </div>
          <button className="prof-add-row" onClick={openAddVisa}><NavIcon.plus /> Add Visa</button>
        </div>

        <div className="dash-card">
          <h3 className="dash-card-title"><NavIcon.family /> Family Profiles · {family.length} travellers</h3>
          <p className="prof-sub">Passports auto-filled at checkout for all members</p>
          <div className="prof-family-list">
            {family.map((m) => (
              <div key={m.id} className="prof-family-row">
                {m.avatar ? <img className="prof-family-avatar" src={`/images/${m.avatar}`} alt="" /> : <span className="prof-family-initials">{m.initials}</span>}
                <div className="prof-family-info">
                  <strong>{m.name} <span className={`prof-mini-badge ${m.relation === "Primary" ? "blue" : m.relation === "Spouse" ? "purple" : "green"}`}>{m.relation}</span></strong>
                  <span>DOB: {m.dob}</span>
                </div>
                <span className="prof-family-expiry"><NavIcon.calendar /> Passport expires {m.expires} <span className={`prof-status-badge ${m.status === "Valid" ? "green" : "orange"}`}>{m.status}</span></span>
                <div className="prof-doc-actions">
                  <button aria-label={`Edit ${m.name}`} onClick={() => openEditFamily(m)}><NavIcon.edit /></button>
                  <button aria-label={`Remove ${m.name}`} onClick={() => deleteFamily(m.id)}><NavIcon.trash /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="prof-add-row" onClick={openAddFamily}><NavIcon.plus /> Add Family Member</button>
        </div>

        <div className="dash-card">
          <h3 className="dash-card-title"><NavIcon.award /> Loyalty Programs</h3>
          <p className="prof-sub">All your points in one place</p>
          <div className="prof-loyalty-list">
            {loyaltyPrograms.map((l) => {
              const Icon = NavIcon[l.icon];
              return (
                <div key={l.id} className="prof-loyalty-row" onClick={() => setToast(`Opening ${l.name}`)}>
                  <span className="prof-loyalty-icon" style={{ background: `${l.color}22`, color: l.color }}><Icon /></span>
                  <div className="prof-loyalty-body">
                    <div className="prof-loyalty-top">
                      <strong>{l.name}</strong>
                      <span className={`prof-tier-badge ${l.tierClass}`}>{l.tier}</span>
                    </div>
                    <span className="prof-loyalty-sub">Expires {l.expires}</span>
                    <div className="prof-loyalty-pts-row"><strong>{l.points}</strong> <span>points · ≈{l.value} value</span></div>
                    <div className="booking-progress-bar prof-loyalty-bar"><span style={{ width: `${l.pct}%`, background: l.color }} /></div>
                    <div className="prof-loyalty-next"><span>{l.tier}</span><span>{l.nextLabel}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="prof-add-row" onClick={() => setToast("Opening add loyalty program form")}><NavIcon.plus /> Add loyalty program</button>
        </div>

        <div className="prof-settings-grid">
          <div className="dash-card">
            <h3 className="dash-card-title"><NavIcon.bell /> Notifications</h3>
            <div className="prof-toggle-row"><div><strong>Flight alerts</strong><span>Delays, gate changes, check-in</span></div><Toggle on={notif.flights} onChange={() => { setNotif({ ...notif, flights: !notif.flights }); setToast(`Flight alerts ${!notif.flights ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Price drops</strong><span>Hotels, flights, activities</span></div><Toggle on={notif.price} onChange={() => { setNotif({ ...notif, price: !notif.price }); setToast(`Price drop alerts ${!notif.price ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Weather alerts</strong><span>Severe weather at your destination</span></div><Toggle on={notif.weather} onChange={() => { setNotif({ ...notif, weather: !notif.weather }); setToast(`Weather alerts ${!notif.weather ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Marketing emails</strong><span>Deals, inspiration, new features</span></div><Toggle on={notif.marketing} onChange={() => { setNotif({ ...notif, marketing: !notif.marketing }); setToast(`Marketing emails ${!notif.marketing ? "enabled" : "disabled"}`); }} /></div>
          </div>
          <div className="dash-card">
            <h3 className="dash-card-title"><NavIcon.lock /> Privacy &amp; Security</h3>
            <div className="prof-toggle-row"><div><strong>AI learning</strong><span>Let AI learn from your trips</span></div><Toggle on={privacy.ai} onChange={() => { setPrivacy({ ...privacy, ai: !privacy.ai }); setToast(`AI learning ${!privacy.ai ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Location tracking</strong><span>For live itinerary and alerts</span></div><Toggle on={privacy.location} onChange={() => { setPrivacy({ ...privacy, location: !privacy.location }); setToast(`Location tracking ${!privacy.location ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Biometric login</strong><span>Face ID / Touch ID</span></div><Toggle on={privacy.biometric} onChange={() => { setPrivacy({ ...privacy, biometric: !privacy.biometric }); setToast(`Biometric login ${!privacy.biometric ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Two-factor auth</strong><span>SMS or authenticator app</span></div><Toggle on={privacy.twoFactor} onChange={() => { setPrivacy({ ...privacy, twoFactor: !privacy.twoFactor }); setToast(`Two-factor auth ${!privacy.twoFactor ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong>Share itinerary</strong><span>Public visibility by default</span></div><Toggle on={privacy.share} onChange={() => { setPrivacy({ ...privacy, share: !privacy.share }); setToast(`Share itinerary ${!privacy.share ? "enabled" : "disabled"}`); }} /></div>
            <div className="prof-toggle-row"><div><strong className="prof-danger-text"><NavIcon.alertTriangle /> Share data with partners</strong><span>Third-party travel partners</span></div><Toggle on={privacy.partners} onChange={() => { setPrivacy({ ...privacy, partners: !privacy.partners }); setToast(`Share data with partners ${!privacy.partners ? "enabled" : "disabled"}`); }} /></div>
          </div>
        </div>

        <div className="prof-danger-zone">
          <h3><NavIcon.alertTriangle /> Danger Zone</h3>
          <div className="prof-danger-row">
            <div><strong>Export my data</strong><span>Download all your trips, bookings, and preferences</span></div>
            <button className="prof-danger-btn" onClick={() => setToast("Preparing your data export...")}>Export</button>
          </div>
          <div className="prof-danger-row">
            <div><strong>Reset AI preferences</strong><span>Clear all AI learning and start fresh</span></div>
            <button className="prof-danger-btn orange" onClick={() => setToast("AI preferences reset")}>Reset</button>
          </div>
          <div className="prof-danger-row">
            <div><strong>Delete account</strong><span>Permanently delete your account and all data</span></div>
            <button className="prof-danger-btn red" onClick={() => setToast("Please confirm via the email link we just sent")}>Delete</button>
          </div>
        </div>

        <button className="prof-signout" onClick={() => setToast("Signed out")}><NavIcon.logout /> Sign Out</button>
      </div>

      {paymentModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setPaymentModalOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitPayment}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setPaymentModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingPaymentId ? "Edit Payment Method" : "Add Payment Method"}</h3>
            <p className="feature-modal-desc">Save a credit/debit card or UPI ID to pay for bookings faster.</p>

            <div className="wallet-pm-type-row">
              {(["card", "upi"] as const).map((t) => (
                <button key={t} type="button" className={payType === t ? "wallet-pm-type active" : "wallet-pm-type"} onClick={() => setPayType(t)}>
                  {t === "card" ? "Credit/Debit Card" : "UPI"}
                </button>
              ))}
            </div>

            {payType === "card" && (
              <>
                <label className="wallet-modal-field">Cardholder name
                  <input value={payCardName} onChange={(e) => setPayCardName(e.target.value)} placeholder="Name on card" required />
                </label>
                <label className="wallet-modal-field">Card number
                  <input value={payCardNumber} onChange={(e) => setPayCardNumber(formatPayCardNumber(e.target.value))} placeholder={editingPaymentId ? "Leave blank to keep existing card" : "4242 4242 4242 4242"} inputMode="numeric" />
                </label>
                <div className="wallet-modal-field-row">
                  <label className="wallet-modal-field">Expiry
                    <input value={payExpiry} onChange={(e) => setPayExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} required />
                  </label>
                  <label className="wallet-modal-field">CVV
                    <input value={payCvv} onChange={(e) => setPayCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" />
                  </label>
                </div>
              </>
            )}

            {payType === "upi" && (
              <label className="wallet-modal-field">UPI ID
                <input value={payUpiId} onChange={(e) => setPayUpiId(e.target.value)} placeholder="name@okhdfc" required />
              </label>
            )}

            <label className="wallet-toggle-field">
              <input type="checkbox" checked={paySetDefault} onChange={(e) => setPaySetDefault(e.target.checked)} />
              Set as default payment method
            </label>

            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.check /> {editingPaymentId ? "Save Changes" : "Save Payment Method"}</button>
          </form>
        </div>
      )}

      {passportModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setPassportModalOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={savePassport}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setPassportModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingPassportId ? "Edit Passport" : "Add Passport or Travel Document"}</h3>
            <label className="wallet-modal-field">Name
              <input value={ppHolderName} onChange={(e) => setPpHolderName(e.target.value)} placeholder="e.g. Arjun Mehta" required />
            </label>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Country
                <input value={ppCountry} onChange={(e) => setPpCountry(e.target.value)} placeholder="e.g. India" required />
              </label>
              <label className="wallet-modal-field">Flag emoji
                <input value={ppFlag} onChange={(e) => setPpFlag(e.target.value)} placeholder="🇮🇳" maxLength={4} />
              </label>
            </div>
            <label className="wallet-modal-field">Passport number
              <input value={ppNumber} onChange={(e) => setPpNumber(e.target.value)} placeholder="Z •••• •••4" required />
            </label>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Expires
                <input value={ppExpires} onChange={(e) => setPpExpires(e.target.value)} placeholder="Sep 2031" required />
              </label>
              <label className="wallet-modal-field">Note
                <input value={ppNote} onChange={(e) => setPpNote(e.target.value)} placeholder="e.g. Indian" />
              </label>
            </div>
            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.check /> {editingPassportId ? "Save Changes" : "Add Passport"}</button>
          </form>
        </div>
      )}

      {visaModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setVisaModalOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveVisa}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setVisaModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingVisaId ? "Edit Visa" : "Add Visa"}</h3>
            <label className="wallet-modal-field">Name
              <input value={vsHolderName} onChange={(e) => setVsHolderName(e.target.value)} placeholder="e.g. Arjun Mehta" required />
            </label>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Country / Region
                <input value={vsCountry} onChange={(e) => setVsCountry(e.target.value)} placeholder="e.g. United States" required />
              </label>
              <label className="wallet-modal-field">Flag emoji
                <input value={vsFlag} onChange={(e) => setVsFlag(e.target.value)} placeholder="🇺🇸" maxLength={4} />
              </label>
            </div>
            <label className="wallet-modal-field">Visa type
              <input value={vsType} onChange={(e) => setVsType(e.target.value)} placeholder="e.g. B1/B2 Tourist" required />
            </label>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Expires
                <input value={vsExpires} onChange={(e) => setVsExpires(e.target.value)} placeholder="Mar 2032" required />
              </label>
              <label className="wallet-modal-field">Status
                <select value={vsStatus} onChange={(e) => setVsStatus(e.target.value as Visa["status"])}>
                  <option value="Valid">Valid</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </select>
              </label>
            </div>
            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.check /> {editingVisaId ? "Save Changes" : "Add Visa"}</button>
          </form>
        </div>
      )}

      {visaCheckerOpen && (
        <div className="feature-modal-overlay" onClick={() => setVisaCheckerOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={runVisaCheck}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setVisaCheckerOpen(false)}><NavIcon.close /></button>
            <h3><NavIcon.search /> Visa Checker</h3>
            <p className="feature-modal-desc">Check visa requirements for your next destination based on your passport nationality.</p>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Passport nationality
                <select value={vcNationality} onChange={(e) => setVcNationality(e.target.value)}>
                  <option value="India">India</option>
                  {passports.filter((p) => p.country !== "India").map((p) => <option key={p.id} value={p.country}>{p.country}</option>)}
                </select>
              </label>
              <label className="wallet-modal-field">Destination
                <input value={vcDestination} onChange={(e) => { setVcDestination(e.target.value); setVcChecked(false); }} placeholder="e.g. Japan" required />
              </label>
            </div>
            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.search /> Check requirement</button>

            {vcChecked && vcResult && (
              <div className={`visa-check-result ${vcResult.kind}`}>
                <div className="visa-check-result-head">
                  <span className="prof-doc-flag">{vcResult.flag}</span>
                  <div>
                    <strong>{vcDestination.trim()}</strong>
                    <span className={`prof-status-badge ${vcResult.kind === "good" ? "green" : vcResult.kind === "warn" ? "orange" : "red"}`}>{vcResult.status}</span>
                  </div>
                </div>
                <p className="visa-check-stay"><NavIcon.calendar /> Max stay: {vcResult.stay}</p>
                <p className="visa-check-note">{vcResult.note}</p>
                {vcResult.status !== "Visa-free" && (
                  <button type="button" className="dash-btn-primary" onClick={addCheckedVisaToDocuments}><NavIcon.plus /> Add this visa to my documents</button>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {familyModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setFamilyModalOpen(false)}>
          <form className="feature-modal wallet-action-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveFamily}>
            <button type="button" className="feature-modal-close" aria-label="Close" onClick={() => setFamilyModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingFamilyId ? "Edit Family Member" : "Add Family Member"}</h3>
            <label className="wallet-modal-field">Full name
              <input value={fmName} onChange={(e) => setFmName(e.target.value)} placeholder="e.g. Priya Mehta" required />
            </label>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Relation
                <select value={fmRelation} onChange={(e) => setFmRelation(e.target.value as FamilyMember["relation"])}>
                  <option value="Primary">Primary</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                </select>
              </label>
              <label className="wallet-modal-field">Date of birth
                <input value={fmDob} onChange={(e) => setFmDob(e.target.value)} placeholder="12 Mar 1985" required />
              </label>
            </div>
            <div className="wallet-modal-field-row">
              <label className="wallet-modal-field">Passport expires
                <input value={fmExpires} onChange={(e) => setFmExpires(e.target.value)} placeholder="Sep 2031" required />
              </label>
              <label className="wallet-modal-field">Status
                <select value={fmStatus} onChange={(e) => setFmStatus(e.target.value as FamilyMember["status"])}>
                  <option value="Valid">Valid</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                </select>
              </label>
            </div>
            <button type="submit" className="btn-primary feature-modal-cta"><NavIcon.check /> {editingFamilyId ? "Save Changes" : "Add Family Member"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
