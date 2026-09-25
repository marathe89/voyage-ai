import type { NavIcon } from "./icons";

export type BType = "flight" | "hotel" | "car";
export type BStatus = "confirmed" | "pending" | "completed";

export interface Booking {
  id: string;
  type: BType;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  code: string;
  price: string;
  status: BStatus;
  image?: string;
  gradient?: string;
}

export const bookings: Booking[] = [
  { id: "b1", type: "flight", title: "Tokyo (NRT) → San Francisco (SFO)", subtitle: "Japan Airlines JL061 · Economy", date: "Jul 15, 2026", time: "10:45 AM", code: "VYG-2847", price: "$892", status: "confirmed", image: "book-flight1.jpg" },
  { id: "b2", type: "hotel", title: "Andaz Tokyo Toranomon Hills", subtitle: "Deluxe Room · 10 nights · Breakfast included", date: "Jul 15 – Jul 25, 2026", time: "Check-in 3:00 PM", code: "VYG-2848", price: "$2,140", status: "confirmed", image: "book-hotel1.jpg" },
  { id: "b3", type: "car", title: "Airport Transfer · Narita → Tokyo", subtitle: "Toyota Alphard · Private · 4 passengers", date: "Jul 15, 2026", time: "Upon arrival", code: "VYG-2191", price: "$85", status: "pending", image: "book-transport1.jpg" },
  { id: "b4", type: "hotel", title: "Four Seasons Bali at Sayan", subtitle: "Villa · 8 nights · Full board", date: "May 10 – May 18, 2026", time: "Checked out", code: "VYG-1934", price: "$3,200", status: "completed", image: "dest-bali.png" },
  { id: "b5", type: "flight", title: "San Francisco (SFO) → Bali (DPS)", subtitle: "Singapore Airlines SQ032 · Business", date: "May 10, 2026", time: "11:30 PM", code: "VYG-1933", price: "$2,450", status: "completed", image: "book-flight2.jpg" },
];

export const typeIcon: Record<BType, keyof typeof NavIcon> = { flight: "plane", hotel: "hotel", car: "transport" };

export const statusMeta: Record<BStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bk-badge-confirmed" },
  pending: { label: "Pending", className: "bk-badge-pending" },
  completed: { label: "Completed", className: "bk-badge-completed" },
};
