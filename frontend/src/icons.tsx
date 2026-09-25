export function DestImage({ from, prefix = "dest" }: { from: string; prefix?: string }) {
  return <img className="dest-image" src={`/images/${prefix}-${from}.png`} alt="" />;
}

export const NavIcon = {
  dragHandle: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
  ),
  search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" strokeLinecap="round" /></svg>
  ),
  moon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>
  ),
  home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 11.5 12 5l8 6.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  discover: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M15 9l-2 5-4.5 1.5L10.5 10 15 9z" strokeLinejoin="round" /></svg>
  ),
  concierge: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
  ),
  chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  list: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" /><circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" /></svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  bot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="8.5" width="16" height="11" rx="3" /><path d="M12 8.5V5M9.5 4h5" strokeLinecap="round" /><circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none" /><path d="M9 17.3h6" strokeLinecap="round" /></svg>
  ),
  forYou: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9.5 4l1.6 4.9L16 10.5l-4.9 1.6L9.5 17l-1.6-4.9L3 10.5l4.9-1.6L9.5 4z" strokeLinejoin="round" /><path d="M18 13.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" strokeLinejoin="round" /></svg>
  ),
  sliders: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h5M13 6h7M4 12h9M17 12h3M4 18h13M21 18h0" strokeLinecap="round" /><circle cx="9.5" cy="6" r="1.6" fill="currentColor" stroke="none" /><circle cx="13.5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="17.5" cy="18" r="1.6" fill="currentColor" stroke="none" /></svg>
  ),
  wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h13A1.5 1.5 0 0 1 19 7.5V9H4.5A1.5 1.5 0 0 1 3 7.5z" strokeLinejoin="round" /><path d="M3 9h16.5A1.5 1.5 0 0 1 21 10.5v7a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 17.5V9z" strokeLinejoin="round" /><circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" /></svg>
  ),
  bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" /></svg>
  ),
  camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.3" /></svg>
  ),
  compass: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 5-4.5 1.5L10.5 10 15 9z" strokeLinejoin="round" /></svg>
  ),
  expand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 15L4 20M4 20h4M4 20v-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 9l5-5M20 4h-4M20 4v4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
  ),
  mic: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" /></svg>
  ),
  send: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11.5L21 3l-6 18-3.5-7L3 11.5z" /></svg>
  ),
  heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20.5s-7.5-4.6-9.7-9.3C.8 7.8 2.6 4.5 6 4c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.4.5 5.2 3.8 3.7 7.2-2.2 4.7-9.7 9.3-9.7 9.3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  trendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  dining: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3v6a2 2 0 0 1-4 0V3M5 9v12M11 3c0 4-2 5-2 8s2 3 2 3v7" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 3c-1.7 0-3 2-3 5s1.3 5 3 5 3-2 3-5-1.3-5-3-5z" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 13v9" strokeLinecap="round" /></svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" strokeLinejoin="round" /></svg>
  ),
  package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" /><path d="M4.5 7.5L12 12l7.5-4.5M12 12v9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-7 4 14 2-7h6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" strokeLinejoin="round" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13z" strokeLinejoin="round" /></svg>
  ),
  dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
  ),
  location: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21.5s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11z" strokeLinejoin="round" /><circle cx="12" cy="10.5" r="2.3" /></svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" /></svg>
  ),
  guests: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" strokeLinecap="round" /><circle cx="17" cy="8.5" r="2.4" /><path d="M14.5 14.3c2.5.3 4.5 2.5 4.5 5.7" strokeLinecap="round" /></svg>
  ),
  sparkle: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
  ),
  play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5z" /></svg>
  ),
  plane: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5l8 2.5z" /></svg>
  ),
  hotel: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21V5.5A1.5 1.5 0 0 1 4.5 4h6A1.5 1.5 0 0 1 12 5.5V21" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 10h6.5A1.5 1.5 0 0 1 20 11.5V21" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 21h20M6 8h2M6 12h2M6 16h2" strokeLinecap="round" /></svg>
  ),
  pin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21.5s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11z" strokeLinejoin="round" /><circle cx="12" cy="10.5" r="2.3" /></svg>
  ),
  transport: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="9" width="18" height="8" rx="2" /><circle cx="7.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" /><circle cx="16.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" /><path d="M5 9l1.5-4h11L19 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  adventure: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l9 18H3L12 3z" strokeLinejoin="round" /><path d="M12 9l5 12M12 9L7 21" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  wellness: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 14c3 0 3 3 6 3s3-3 6-3 3 3 6 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  crown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" strokeLinejoin="round" /></svg>
  ),
  family: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" strokeLinecap="round" /></svg>
  ),
  reset: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11A8 8 0 1 0 18 16" strokeLinecap="round" /><path d="M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z" /></svg>
  ),
  sim: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeLinejoin="round" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
  ),
  globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
  ),
  gate: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 21V6l7-3 7 3v15" strokeLinejoin="round" /><path d="M9 21v-7h6v7" strokeLinejoin="round" /></svg>
  ),
  info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" strokeLinecap="round" /></svg>
  ),
  paperclip: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5l-8.9 8.9a4.5 4.5 0 1 1-6.4-6.4l8.4-8.4a3 3 0 1 1 4.3 4.3l-8.5 8.5a1.5 1.5 0 1 1-2.1-2.1l7.8-7.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" strokeLinecap="round" /></svg>
  ),
  help: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.5 2.5 0 1 1 3.5 2.3c-.7.35-1 .7-1 1.5v.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 17v.01" strokeLinecap="round" /></svg>
  ),
  copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
  ),
  dots: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
  ),
  dollar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 7c0-1.9-2.2-3-5-3s-5 1.3-5 3.2c0 4 10 1.8 10 5.8 0 2-2.2 3-5 3s-5-1.1-5-3" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  chevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5.5-5.5L4 21" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  lightning: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
  ),
  chevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  barChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="12" width="4" height="8" rx="1" /><rect x="10" y="7" width="4" height="13" rx="1" /><rect x="16" y="3" width="4" height="17" rx="1" /></svg>
  ),
  lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" /></svg>
  ),
  clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v13m0 0l-4.5-4.5M12 16l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="5.5" /><path d="M8.5 13l-1.5 8 5-2.5 5 2.5-1.5-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  bookmark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" /></svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 21l1-4L16.5 5.5a1.8 1.8 0 0 1 2.5 0 1.8 1.8 0 0 1 0 2.5L7.5 19.5 4 21z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  creditCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18" strokeLinecap="round" /></svg>
  ),
  sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" /></svg>
  ),
  swap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h13M13 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 16H7M11 20l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
  ),
  minus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" strokeLinecap="round" /></svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  cloud: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 18h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 18z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  wind: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h8a2 2 0 1 1-2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z" strokeLinejoin="round" /></svg>
  ),
  eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.5" /></svg>
  ),
  phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L19 16v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" strokeLinejoin="round" /></svg>
  ),
  siren: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a1 1 0 0 1 1 1v1.5h-2V3a1 1 0 0 1 1-1z" strokeLinejoin="round" /><path d="M6 12a6 6 0 0 1 12 0v6H6v-6z" strokeLinejoin="round" /><path d="M4 21h16M2 15h2M20 15h2" strokeLinecap="round" /></svg>
  ),
  wifi: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9a12 12 0 0 1 16 0M7 12.5a8 8 0 0 1 10 0M10 16a4 4 0 0 1 4 0" strokeLinecap="round" /><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" /></svg>
  ),
  volume: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5z" strokeLinejoin="round" /><path d="M16 9a4 4 0 0 1 0 6" strokeLinecap="round" /></svg>
  ),
  volumeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5z" strokeLinejoin="round" /><path d="M16 10l4 4M20 10l-4 4" strokeLinecap="round" /></svg>
  ),
  briefcase: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12h18" strokeLinecap="round" /></svg>
  ),
  userCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6 19a6 6 0 0 1 12 0" strokeLinecap="round" /></svg>
  ),
  fingerprint: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4a8 8 0 0 1 8 8v2M12 4a8 8 0 0 0-8 8v3M12 8a4 4 0 0 1 4 4v3M12 8a4 4 0 0 0-4 4v5M12 12v6" strokeLinecap="round" /></svg>
  ),
  logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  alertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4 2 20h20L12 4z" strokeLinejoin="round" /><path d="M12 10v4M12 17h.01" strokeLinecap="round" /></svg>
  ),
  thumbsUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" strokeLinejoin="round" /><path d="M7 11l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 1.94 2.5l-1.5 6A2 2 0 0 1 17 20H7" strokeLinejoin="round" /></svg>
  ),
  thumbsDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3z" strokeLinejoin="round" /><path d="M17 13l-4 7a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-1.94-2.5l1.5-6A2 2 0 0 1 7 4h10" strokeLinejoin="round" /></svg>
  ),
  accessibility: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9.2" /><circle cx="12" cy="7" r="1.3" fill="currentColor" stroke="none" /><path d="M7 10.2c3.3 1.1 6.7 1.1 10 0" strokeLinecap="round" /><path d="M12 10.5v4.3M12 14.8l-2.6 4M12 14.8l2.6 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  hand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 12.5V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11.5V6a1.5 1.5 0 0 1 3 0v8.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 12.5v3a5.5 5.5 0 0 0 5.5 5.5h1A5.5 5.5 0 0 0 20 15.5V10a1.5 1.5 0 0 0-3-.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 12.5c-.6-.8-1.6-2-2.3-2.6a1.4 1.4 0 0 0-2 2L6 14.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};
