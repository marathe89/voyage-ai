import { useRef, useState, type ChangeEvent } from "react";
import { NavIcon } from "./icons";
import { useShell } from "./shell";
import { ShareButton } from "./ShareButton";

type Tab = "memories" | "photos" | "journal";

interface Memory {
  id: string;
  title: string;
  location: string;
  date: string;
  desc: string;
  photos: string[];
  emoji: string;
  trip: string;
  tags: string[];
}

const initialMemories: Memory[] = [
  { id: "m1", title: "Sunrise at Fushimi Inari", location: "Kyoto, Japan", date: "Oct 14, 2026", desc: "Woke up at 5 AM to beat the crowds. The morning light through 10,000 torii gates was absolutely breathtaking.", photos: ["/images/dest-kyoto.png", "/images/book-act-kyoto.jpg"], emoji: "🤩", trip: "Japan Family Adventure", tags: ["best", "scenery"] },
  { id: "m2", title: "Onsen Night in Hakone", location: "Hakone, Japan", date: "Oct 12, 2026", desc: "The rotenburo outdoor bath with Mt. Fuji glowing in the moonlight. Nothing quite like it. A moment I'll remember forever.", photos: ["/images/book-act-fuji.jpg", "/images/itin-tokyo.png"], emoji: "😍", trip: "Japan Family Adventure", tags: ["best"] },
  { id: "m3", title: "Bali Rice Terraces at Sunrise", location: "Ubud, Bali", date: "May 12, 2026", desc: "The Tegallalang rice terraces looked other-worldly in the early morning mist. My guide made amazing local coffee.", photos: ["/images/itin-lombok.png", "/images/dest-bali.png"], emoji: "🏝️", trip: "Bali Wellness Retreat", tags: ["scenery"] },
];

const reactionEmojis = ["🤩", "😍", "🏝️", "😌", "🥰", "🎉", "😋", "🥾"];

const smartAlbums = [
  { key: "best", icon: "star" as const, label: "Best Moments" },
  { key: "food", icon: "dining" as const, label: "Food & Dining" },
  { key: "scenery", icon: "adventure" as const, label: "Scenery" },
  { key: "family", icon: "family" as const, label: "Family Shots" },
];

const tripFilters = ["Japan Family Adventure", "Bali Wellness Retreat", "Paris Weekend", "Greece 2025", "All Trips"];

interface Photo { id: string; src: string; trip: string; albums: string[]; }

let photoIdCounter = 0;
function nextPhotoId() {
  photoIdCounter += 1;
  return `p-${photoIdCounter}`;
}

const initialPhotoLibrary: Photo[] = [
  { id: nextPhotoId(), src: "/images/itin-tokyo.png", trip: "Japan Family Adventure", albums: ["scenery", "best"] },
  { id: nextPhotoId(), src: "/images/dest-kyoto.png", trip: "Japan Family Adventure", albums: ["scenery", "best"] },
  { id: nextPhotoId(), src: "/images/dest-bali.png", trip: "Bali Wellness Retreat", albums: ["scenery"] },
  { id: nextPhotoId(), src: "/images/dest-paris.jpg", trip: "Paris Weekend", albums: ["scenery", "food"] },
  { id: nextPhotoId(), src: "/images/dest-santorini.png", trip: "Greece 2025", albums: ["scenery", "best"] },
  { id: nextPhotoId(), src: "/images/book-act-kyoto.jpg", trip: "Japan Family Adventure", albums: ["food", "family"] },
  { id: nextPhotoId(), src: "/images/book-act-lantern.jpg", trip: "Japan Family Adventure", albums: ["best", "scenery"] },
  { id: nextPhotoId(), src: "/images/book-act-fuji.jpg", trip: "Japan Family Adventure", albums: ["scenery", "family", "best"] },
  { id: nextPhotoId(), src: "/images/itin-lombok.png", trip: "Bali Wellness Retreat", albums: ["scenery", "family"] },
];

interface JournalEntry {
  id: string;
  location: string;
  mood: string;
  date: string;
  weather: string;
  text: string;
  photos: string[];
  avatar?: string;
  trip: string;
}

const initialJournal: JournalEntry[] = [
  { id: "j1", location: "Tokyo, Japan", mood: "Excited", date: "Oct 11, 2026", weather: "Clear, 18°C", photos: ["/images/itin-tokyo.png"], trip: "Japan Family Adventure", text: "First day in Tokyo and already overwhelmed in the best way possible. Shibuya crossing was everything I imagined — a beautiful organised chaos. The kids could not stop staring. Had the most incredible ramen at a tiny 8-seat shop near Shinjuku. The chef has been running it for 40 years. Tried to order in Japanese — they laughed and replied in perfect English." },
  { id: "j2", location: "Ubud, Bali", mood: "Peaceful", date: "May 10, 2026", weather: "Warm, 29°C", photos: ["/images/dest-bali.png"], avatar: "avatar-sarah.png", trip: "Bali Wellness Retreat", text: "Checked into the jungle villa. The sound of the river below and the birds waking me up — completely alien to city life. Did a morning yoga class. My body protested the first 10 minutes, then surrendered. Had a Balinese massage that lasted 2 hours. I don't think I've ever felt that relaxed. Ate local warungs only today — Nasi Goreng for breakfast, lunch, and dinner. Zero regrets." },
  { id: "j3", location: "Paris, France", mood: "Romantic", date: "Mar 14, 2026", weather: "Cloudy, 12°C", photos: ["/images/dest-paris.jpg"], trip: "Paris Weekend", text: "Last day in Paris. Went back to the Seine at golden hour just to see it one more time. We got a crêpe from the same vendor as three years ago and sat on the steps of Notre-Dame (the restoration is nearly done — it looks stunning). Priya bought a small painting from a street artist near Montmartre. She cried a little. I pretended not to notice. Coming back here soon." },
];

const moodEmoji: Record<string, string> = { Excited: "🤩", Peaceful: "😌", Romantic: "🥰" };

export function TripMemoriesPage() {
  const { setToast } = useShell();
  const [tab, setTab] = useState<Tab>("memories");
  const [liked, setLiked] = useState<Set<string>>(new Set(["m1", "m2"]));
  const [activeAlbum, setActiveAlbum] = useState("food");
  const [photoTrip, setPhotoTrip] = useState("All Trips");
  const [photoLibrary, setPhotoLibrary] = useState<Photo[]>(initialPhotoLibrary);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [viewingPhotoId, setViewingPhotoId] = useState<string | null>(null);
  const [viewingMemoryId, setViewingMemoryId] = useState<string | null>(null);
  const [viewingJournalId, setViewingJournalId] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagDraft, setNewTagDraft] = useState("");
  const [uploadTagModalOpen, setUploadTagModalOpen] = useState(false);
  const [pendingUploadUrls, setPendingUploadUrls] = useState<string[]>([]);
  const [uploadTrip, setUploadTrip] = useState(tripFilters[0]);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [journal, setJournal] = useState(initialJournal);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [jLocation, setJLocation] = useState("");
  const [jMood, setJMood] = useState("Excited");
  const [jDate, setJDate] = useState("");
  const [jWeather, setJWeather] = useState("");
  const [jTrip, setJTrip] = useState(tripFilters[0]);
  const [jPhotos, setJPhotos] = useState<string[]>([]);
  const [journalMoodFilter, setJournalMoodFilter] = useState<string | null>(null);
  const [journalTripFilter, setJournalTripFilter] = useState("All Trips");
  const journalEditorRef = useRef<HTMLDivElement>(null);
  const journalFileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteJournalId, setConfirmDeleteJournalId] = useState<string | null>(null);

  const [memories, setMemories] = useState(initialMemories);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mDate, setMDate] = useState("");
  const [mTrip, setMTrip] = useState(tripFilters[0]);
  const [mEmoji, setMEmoji] = useState(reactionEmojis[0]);
  const [mPhotos, setMPhotos] = useState<string[]>([]);
  const [mTags, setMTags] = useState<string[]>([]);
  const [memoryTagFilter, setMemoryTagFilter] = useState<string | null>(null);
  const [memoryTripFilter, setMemoryTripFilter] = useState("All Trips");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const memoryTagOptions = [...new Set(memories.flatMap((m) => m.tags))];
  const filteredMemoriesList = memories.filter((m) => {
    if (memoryTagFilter && !m.tags.includes(memoryTagFilter)) return false;
    if (memoryTripFilter !== "All Trips" && m.trip !== memoryTripFilter) return false;
    return true;
  });

  const journalMoodOptions = [...new Set(journal.map((j) => j.mood))];
  const filteredJournal = journal.filter((j) => {
    if (journalMoodFilter && j.mood !== journalMoodFilter) return false;
    if (journalTripFilter !== "All Trips" && j.trip !== journalTripFilter) return false;
    return true;
  });

  const filteredPhotos = photoLibrary.filter((p) => {
    if (!p.albums.includes(activeAlbum)) return false;
    if (photoTrip !== "All Trips" && p.trip !== photoTrip) return false;
    return true;
  });

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function format(cmd: string) {
    document.execCommand(cmd);
    editorRef.current?.focus();
  }

  function openCreateMemory() {
    setEditingMemoryId(null);
    setMTitle("");
    setMLocation("");
    setMDate("");
    setMTrip(tripFilters[0]);
    setMEmoji(reactionEmojis[0]);
    setMPhotos([]);
    setMTags([]);
    setMemoryModalOpen(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = ""; }, 0);
  }

  function openEditMemory(m: Memory) {
    setEditingMemoryId(m.id);
    setMTitle(m.title);
    setMLocation(m.location);
    setMDate(m.date);
    setMTrip(m.trip);
    setMEmoji(m.emoji);
    setMPhotos(m.photos);
    setMTags(m.tags);
    setMemoryModalOpen(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = m.desc; }, 0);
  }

  function toggleMTag(key: string) {
    setMTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  function addCustomMemoryTag() {
    const name = newTagDraft.trim().toLowerCase();
    if (!name) return;
    if (![...smartAlbums.map((a) => a.key), ...customTags].includes(name)) {
      setCustomTags((prev) => [...prev, name]);
    }
    setMTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setNewTagDraft("");
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setMPhotos((prev) => [...prev, ...urls]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(url: string) {
    setMPhotos((prev) => prev.filter((p) => p !== url));
  }

  function saveMemory() {
    if (!mTitle.trim() || !mLocation.trim() || !mDate.trim()) {
      setToast("Please fill in a title, location, and date");
      return;
    }
    const desc = editorRef.current?.innerHTML.trim() ?? "";
    if (editingMemoryId) {
      setMemories((prev) => prev.map((m) => (m.id === editingMemoryId ? { ...m, title: mTitle.trim(), location: mLocation.trim(), date: mDate.trim(), trip: mTrip, emoji: mEmoji, photos: mPhotos, tags: mTags, desc } : m)));
      setToast("Memory updated");
    } else {
      const newMemory: Memory = { id: `m-${Date.now()}`, title: mTitle.trim(), location: mLocation.trim(), date: mDate.trim(), trip: mTrip, emoji: mEmoji, photos: mPhotos, tags: mTags, desc };
      setMemories((prev) => [newMemory, ...prev]);
      setToast("Memory created");
    }
    setMemoryModalOpen(false);
  }

  function deleteMemory(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setConfirmDeleteId(null);
    setToast("Memory deleted");
  }

  function deleteJournalEntry(id: string) {
    setJournal((prev) => prev.filter((j) => j.id !== id));
    setConfirmDeleteJournalId(null);
    setToast("Journal entry deleted");
  }

  function handleGalleryPhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPendingUploadUrls(urls);
    setUploadTrip(photoTrip === "All Trips" ? tripFilters[0] : photoTrip);
    setUploadTags([activeAlbum]);
    setUploadTagModalOpen(true);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
  }

  function toggleUploadTag(key: string) {
    setUploadTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  function addCustomUploadTag() {
    const name = newTagDraft.trim().toLowerCase();
    if (!name) return;
    if (![...smartAlbums.map((a) => a.key), ...customTags].includes(name)) {
      setCustomTags((prev) => [...prev, name]);
    }
    setUploadTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setNewTagDraft("");
  }

  function confirmUploadPhotos() {
    const newPhotos: Photo[] = pendingUploadUrls.map((src) => ({ id: nextPhotoId(), src, trip: uploadTrip, albums: uploadTags }));
    setPhotoLibrary((prev) => [...newPhotos, ...prev]);
    setToast(`${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"} added`);
    setUploadTagModalOpen(false);
    setPendingUploadUrls([]);
  }

  function togglePhotoAlbum(id: string, key: string) {
    setPhotoLibrary((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const has = p.albums.includes(key);
      return { ...p, albums: has ? p.albums.filter((a) => a !== key) : [...p.albums, key] };
    }));
  }

  function setPhotoTripTag(id: string, trip: string) {
    setPhotoLibrary((prev) => prev.map((p) => (p.id === id ? { ...p, trip } : p)));
  }

  function deletePhoto(id: string) {
    setPhotoLibrary((prev) => prev.filter((p) => p.id !== id));
    setViewingPhotoId(null);
    setToast("Photo deleted");
  }

  function addCustomTag(photoId: string) {
    const name = newTagDraft.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (![...smartAlbums.map((a) => a.key), ...customTags].includes(key)) {
      setCustomTags((prev) => [...prev, key]);
    }
    setPhotoLibrary((prev) => prev.map((p) => (p.id === photoId && !p.albums.includes(key) ? { ...p, albums: [...p.albums, key] } : p)));
    setNewTagDraft("");
  }

  function openNewJournalEntry() {
    setEditingJournalId(null);
    setJLocation("");
    setJMood("Excited");
    setJDate("");
    setJWeather("");
    setJTrip(tripFilters[0]);
    setJPhotos([]);
    setJournalModalOpen(true);
    setTimeout(() => { if (journalEditorRef.current) journalEditorRef.current.innerHTML = ""; }, 0);
  }

  function openEditJournalEntry(j: JournalEntry) {
    setEditingJournalId(j.id);
    setJLocation(j.location);
    setJMood(j.mood);
    setJDate(j.date);
    setJWeather(j.weather);
    setJTrip(j.trip);
    setJPhotos(j.photos);
    setJournalModalOpen(true);
    setTimeout(() => { if (journalEditorRef.current) journalEditorRef.current.innerHTML = j.text; }, 0);
  }

  function formatJournal(cmd: string) {
    document.execCommand(cmd);
    journalEditorRef.current?.focus();
  }

  function handleJournalPhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setJPhotos((prev) => [...prev, ...urls]);
    if (journalFileInputRef.current) journalFileInputRef.current.value = "";
  }

  function removeJournalPhoto(url: string) {
    setJPhotos((prev) => prev.filter((p) => p !== url));
  }

  function submitJournalEntry() {
    const text = journalEditorRef.current?.innerHTML.trim() ?? "";
    if (!jLocation.trim() || !text) {
      setToast("Add a location and a few words about your day");
      return;
    }
    if (editingJournalId) {
      setJournal((prev) => prev.map((j) => (j.id === editingJournalId ? { ...j, location: jLocation.trim(), mood: jMood, date: jDate.trim() || "Today", weather: jWeather.trim() || "—", trip: jTrip, photos: jPhotos.length ? jPhotos : j.photos, text } : j)));
      setToast("Journal entry updated");
      setJournalModalOpen(false);
      return;
    }
    const entry: JournalEntry = {
      id: `j${Date.now()}`,
      location: jLocation.trim(),
      mood: jMood,
      date: jDate.trim() || "Today",
      weather: jWeather.trim() || "—",
      trip: jTrip,
      photos: jPhotos.length ? jPhotos : [photoLibrary[0].src],
      text,
    };
    setJournal([entry, ...journal]);
    setJournalModalOpen(false);
    setToast("Journal entry saved");
  }

  return (
    <div className="mem-page">
      <div className="mem-header">
        <div className="mem-header-top">
          <div>
            <span className="mem-eyebrow"><NavIcon.camera /> TRIP MEMORIES</span>
            <h1>Your Travel Stories</h1>
            <p>{memories.length} memories · {photoLibrary.length} photos · {journal.length} journal entries</p>
          </div>
        </div>
        <div className="mem-tabs">
          <button className={tab === "memories" ? "active" : ""} onClick={() => setTab("memories")}><NavIcon.sparkle /> Memories</button>
          <button className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}><NavIcon.image /> Photos</button>
          <button className={tab === "journal" ? "active" : ""} onClick={() => setTab("journal")}><NavIcon.bookmark /> Journal</button>
        </div>
      </div>

      {tab === "memories" && (
        <div className="mem-body">
          <div className="mem-toolbar">
            <button className="dash-btn-primary mem-create-btn" onClick={openCreateMemory}><span>+</span> Create Memory</button>
          </div>
          {memoryTagOptions.length > 0 && (
            <div className="mem-albums-grid">
              <button type="button" className={memoryTagFilter === null ? "mem-album active" : "mem-album"} onClick={() => setMemoryTagFilter(null)}>
                <span><NavIcon.sparkle /></span>
                <div><strong>All Memories</strong><em>{memories.length} {memories.length === 1 ? "memory" : "memories"}</em></div>
              </button>
              {memoryTagOptions.map((t) => {
                const count = memories.filter((m) => m.tags.includes(t)).length;
                return (
                  <button key={t} type="button" className={memoryTagFilter === t ? "mem-album active" : "mem-album"} onClick={() => setMemoryTagFilter(t)}>
                    <span><NavIcon.bookmark /></span>
                    <div><strong className="mem-album-label">{t}</strong><em>{count} {count === 1 ? "memory" : "memories"}</em></div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mem-trip-pills">
            {tripFilters.map((t) => (
              <button key={t} type="button" className={memoryTripFilter === t ? "active" : ""} onClick={() => setMemoryTripFilter(t)}>{t}</button>
            ))}
          </div>
          <div className="mem-grid">
            {filteredMemoriesList.map((m) => (
              <article key={m.id} className="mem-card" onClick={() => setViewingMemoryId(m.id)}>
                <div className="mem-card-media" style={{ backgroundImage: `url(${m.photos[0] ?? "/images/dest-kyoto.png"})` }}>
                  <button className={liked.has(m.id) ? "mem-heart active" : "mem-heart"} onClick={(e) => { e.stopPropagation(); toggleLike(m.id); }}><NavIcon.heart /></button>
                  <span className="mem-emoji">{m.emoji}</span>
                  {m.photos.length > 1 && <span className="mem-photocount">+{m.photos.length - 1} photos</span>}
                </div>
                <div className="mem-card-body">
                  <strong>{m.title}</strong>
                  <p className="mem-card-meta"><NavIcon.location /> {m.location} <span>·</span> <NavIcon.calendar /> {m.date}</p>
                  <p className="mem-card-desc" dangerouslySetInnerHTML={{ __html: m.desc }} />
                  <div className="mem-card-foot">
                    <span className="mem-card-foot-tags">
                      <span className="mem-trip-tag">{m.trip}</span>
                      {m.tags.map((t) => <span key={t} className="mem-mini-tag">{t}</span>)}
                    </span>
                    <span className="mem-card-icons" onClick={(e) => e.stopPropagation()}>
                      <button aria-label="Edit" onClick={() => openEditMemory(m)}><NavIcon.edit /></button>
                      <button aria-label="Delete" onClick={() => setConfirmDeleteId(m.id)}><NavIcon.trash /></button>
                      <ShareButton
                        title={m.title}
                        text={`${m.title} — ${m.location}`}
                        link={`https://voyageai.app/memories/${m.id}`}
                        wrapClassName="mem-share-wrap"
                      />
                    </span>
                  </div>
                </div>
              </article>
            ))}
            <button className="mem-create-card" onClick={openCreateMemory}>
              <span><NavIcon.plus /></span>
              Create Memory
            </button>
          </div>
        </div>
      )}

      {tab === "photos" && (
        <div className="mem-body">
          <div className="mem-toolbar">
            <button className="dash-btn-primary mem-create-btn" onClick={() => galleryFileInputRef.current?.click()}><span>+</span> Add Photos</button>
            <input ref={galleryFileInputRef} type="file" accept="image/*" multiple hidden onChange={handleGalleryPhotoUpload} />
          </div>
          <div className="mem-albums-head">
            <h3><NavIcon.sparkle /> AI Smart Albums</h3>
            <span>Auto-organised by AI</span>
          </div>
          <div className="mem-albums-grid">
            {smartAlbums.map((a) => {
              const Icon = NavIcon[a.icon];
              const count = photoLibrary.filter((p) => p.albums.includes(a.key) && (photoTrip === "All Trips" || p.trip === photoTrip)).length;
              return (
                <button key={a.key} className={activeAlbum === a.key ? "mem-album active" : "mem-album"} onClick={() => setActiveAlbum(a.key)}>
                  <span><Icon /></span>
                  <div><strong>{a.label}</strong><em>{count} photo{count === 1 ? "" : "s"}</em></div>
                </button>
              );
            })}
          </div>
          <div className="mem-trip-pills">
            {tripFilters.map((t) => (
              <button key={t} className={photoTrip === t ? "active" : ""} onClick={() => setPhotoTrip(t)}>{t}</button>
            ))}
          </div>
          <div className="mem-photo-grid">
            {filteredPhotos.map((p) => (
              <div key={p.id} className="mem-photo-tile" style={{ backgroundImage: `url(${p.src})` }} onClick={() => setViewingPhotoId(p.id)} />
            ))}
            <button className="mem-photo-add" onClick={() => galleryFileInputRef.current?.click()}>
              <NavIcon.camera />
              <span>Add Photo</span>
            </button>
          </div>
        </div>
      )}

      {tab === "journal" && (
        <div className="mem-body">
          <div className="mem-journal-head">
            <h2>Travel Journal</h2>
            <button className="dash-btn-primary" onClick={openNewJournalEntry}><span>+</span> Create Journal</button>
          </div>

          {journalMoodOptions.length > 0 && (
            <div className="mem-albums-grid">
              <button type="button" className={journalMoodFilter === null ? "mem-album active" : "mem-album"} onClick={() => setJournalMoodFilter(null)}>
                <span><NavIcon.sparkle /></span>
                <div><strong>All Moods</strong><em>{journal.length} {journal.length === 1 ? "entry" : "entries"}</em></div>
              </button>
              {journalMoodOptions.map((mood) => {
                const count = journal.filter((j) => j.mood === mood).length;
                return (
                  <button key={mood} type="button" className={journalMoodFilter === mood ? "mem-album active" : "mem-album"} onClick={() => setJournalMoodFilter(mood)}>
                    <span>{moodEmoji[mood] ?? "📝"}</span>
                    <div><strong>{mood}</strong><em>{count} {count === 1 ? "entry" : "entries"}</em></div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mem-trip-pills">
            {tripFilters.map((t) => (
              <button key={t} type="button" className={journalTripFilter === t ? "active" : ""} onClick={() => setJournalTripFilter(t)}>{t}</button>
            ))}
          </div>

          <div className="mem-journal-grid">
            {filteredJournal.map((j) => (
              <div key={j.id} className="mem-journal-card" onClick={() => setViewingJournalId(j.id)}>
                <div className="mem-journal-banner" style={{ backgroundImage: `url(${j.photos[0] ?? "/images/dest-kyoto.png"})` }}>
                  <span className="mem-journal-dot">{moodEmoji[j.mood] ?? "📝"}</span>
                </div>
                <div className="mem-journal-body">
                  <div className="mem-journal-top">
                    <div>
                      <strong>{j.location}</strong> <span className="mem-mood-tag">{j.mood}</span>
                      <p className="mem-journal-meta"><NavIcon.calendar /> {j.date} <span>·</span> <NavIcon.sun /> {j.weather}</p>
                    </div>
                    <span className="mem-card-icons" onClick={(e) => e.stopPropagation()}>
                      <button aria-label="Edit" onClick={() => openEditJournalEntry(j)}><NavIcon.edit /></button>
                      <button aria-label="Delete" onClick={() => setConfirmDeleteJournalId(j.id)}><NavIcon.trash /></button>
                      <ShareButton
                        title={`${j.location} journal entry`}
                        text={`${j.location} — ${j.date}`}
                        link={`https://voyageai.app/memories/journal/${j.id}`}
                        wrapClassName="mem-share-wrap"
                      />
                    </span>
                  </div>
                  <p className="mem-journal-text" dangerouslySetInnerHTML={{ __html: j.text }} />
                  {j.avatar && <img className="mem-journal-avatar" src={`/images/${j.avatar}`} alt="" />}
                </div>
              </div>
            ))}
            <button className="mem-create-card" onClick={openNewJournalEntry}>
              <span><NavIcon.plus /></span>
              Create Journal
            </button>
          </div>
        </div>
      )}

      {memoryModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setMemoryModalOpen(false)}>
          <div className="feature-modal mem-editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="feature-modal-close" aria-label="Close" onClick={() => setMemoryModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingMemoryId ? "Edit Memory" : "Create Memory"}</h3>

            <div className="mem-editor-row">
              <label className="wallet-modal-field">Title
                <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Sunrise at Fushimi Inari" />
              </label>
              <label className="wallet-modal-field">Trip
                <select value={mTrip} onChange={(e) => setMTrip(e.target.value)}>
                  {tripFilters.slice(0, -1).map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="mem-editor-row">
              <label className="wallet-modal-field">Location
                <input value={mLocation} onChange={(e) => setMLocation(e.target.value)} placeholder="Kyoto, Japan" />
              </label>
              <label className="wallet-modal-field">Date
                <input value={mDate} onChange={(e) => setMDate(e.target.value)} placeholder="Oct 14, 2026" />
              </label>
            </div>

            <p className="mem-editor-label">Reaction</p>
            <div className="mem-emoji-row">
              {reactionEmojis.map((em) => (
                <button key={em} type="button" className={mEmoji === em ? "mem-emoji-pick active" : "mem-emoji-pick"} onClick={() => setMEmoji(em)}>{em}</button>
              ))}
            </div>

            <p className="mem-editor-label">Tags</p>
            <div className="mem-chip-row">
              {smartAlbums.map((a) => (
                <button key={a.key} type="button" className={mTags.includes(a.key) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => toggleMTag(a.key)}>{a.label}</button>
              ))}
              {customTags.map((t) => (
                <button key={t} type="button" className={mTags.includes(t) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => toggleMTag(t)}>{t}</button>
              ))}
            </div>
            <div className="mem-custom-tag-row mem-custom-tag-row-inline">
              <input
                value={newTagDraft}
                onChange={(e) => setNewTagDraft(e.target.value)}
                placeholder="Add a custom tag..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomMemoryTag(); } }}
              />
              <button type="button" onClick={addCustomMemoryTag}><NavIcon.plus /></button>
            </div>

            <p className="mem-editor-label">Write-up</p>
            <div className="mem-editor-toolbar">
              <button type="button" onClick={() => format("bold")}><strong>B</strong></button>
              <button type="button" onClick={() => format("italic")}><em>I</em></button>
              <button type="button" onClick={() => format("underline")}><u>U</u></button>
              <button type="button" onClick={() => format("insertUnorderedList")}><NavIcon.list /></button>
            </div>
            <div ref={editorRef} className="mem-editor-richtext" contentEditable suppressContentEditableWarning />

            <p className="mem-editor-label">Photos</p>
            <div className="mem-editor-photos">
              {mPhotos.map((p) => (
                <div key={p} className="mem-editor-photo" style={{ backgroundImage: `url(${p})` }}>
                  <button type="button" aria-label="Remove photo" onClick={() => removePhoto(p)}><NavIcon.close /></button>
                </div>
              ))}
              <button type="button" className="mem-editor-photo-add" onClick={() => fileInputRef.current?.click()}>
                <NavIcon.camera />
                <span>Add photo</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
            </div>

            <div className="mem-editor-actions">
              {editingMemoryId && (
                <button type="button" className="mem-delete-btn" onClick={() => { setConfirmDeleteId(editingMemoryId); setMemoryModalOpen(false); }}><NavIcon.trash /> Delete</button>
              )}
              <button type="button" className="btn-primary feature-modal-cta" onClick={saveMemory}><NavIcon.check /> {editingMemoryId ? "Save Changes" : "Create Memory"}</button>
            </div>
          </div>
        </div>
      )}

      {journalModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setJournalModalOpen(false)}>
          <div className="feature-modal mem-editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="feature-modal-close" aria-label="Close" onClick={() => setJournalModalOpen(false)}><NavIcon.close /></button>
            <h3>{editingJournalId ? "Edit Journal Entry" : "New Journal Entry"}</h3>

            <div className="mem-editor-row">
              <label className="wallet-modal-field">Location
                <input value={jLocation} onChange={(e) => setJLocation(e.target.value)} placeholder="Tokyo, Japan" />
              </label>
              <label className="wallet-modal-field">Trip
                <select value={jTrip} onChange={(e) => setJTrip(e.target.value)}>
                  {tripFilters.slice(0, -1).map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="mem-editor-row">
              <label className="wallet-modal-field">Date
                <input value={jDate} onChange={(e) => setJDate(e.target.value)} placeholder="Oct 11, 2026" />
              </label>
              <label className="wallet-modal-field">Weather
                <input value={jWeather} onChange={(e) => setJWeather(e.target.value)} placeholder="Clear, 18°C" />
              </label>
            </div>

            <p className="mem-editor-label">Mood</p>
            <div className="mem-emoji-row">
              {Object.keys(moodEmoji).map((m) => (
                <button key={m} type="button" className={jMood === m ? "mem-mood-pick active" : "mem-mood-pick"} onClick={() => setJMood(m)}>
                  <span>{moodEmoji[m]}</span> {m}
                </button>
              ))}
            </div>

            <p className="mem-editor-label">Today's entry</p>
            <div className="mem-editor-toolbar">
              <button type="button" onClick={() => formatJournal("bold")}><strong>B</strong></button>
              <button type="button" onClick={() => formatJournal("italic")}><em>I</em></button>
              <button type="button" onClick={() => formatJournal("underline")}><u>U</u></button>
              <button type="button" onClick={() => formatJournal("insertUnorderedList")}><NavIcon.list /></button>
            </div>
            <div ref={journalEditorRef} className="mem-editor-richtext" contentEditable suppressContentEditableWarning />

            <p className="mem-editor-label">Photos</p>
            <div className="mem-editor-photos">
              {jPhotos.map((p) => (
                <div key={p} className="mem-editor-photo" style={{ backgroundImage: `url(${p})` }}>
                  <button type="button" aria-label="Remove photo" onClick={() => removeJournalPhoto(p)}><NavIcon.close /></button>
                </div>
              ))}
              <button type="button" className="mem-editor-photo-add" onClick={() => journalFileInputRef.current?.click()}>
                <NavIcon.camera />
                <span>Add photo</span>
              </button>
              <input ref={journalFileInputRef} type="file" accept="image/*" multiple hidden onChange={handleJournalPhotoUpload} />
            </div>

            <div className="mem-editor-actions">
              {editingJournalId && (
                <button type="button" className="mem-delete-btn" onClick={() => { setConfirmDeleteJournalId(editingJournalId); setJournalModalOpen(false); }}><NavIcon.trash /> Delete</button>
              )}
              <button type="button" className="btn-primary feature-modal-cta" onClick={submitJournalEntry}><NavIcon.check /> {editingJournalId ? "Save Changes" : "Save Entry"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (() => {
        const m = memories.find((x) => x.id === confirmDeleteId);
        if (!m) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="feature-modal mem-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete "{m.title}"?</h3>
              <p className="feature-modal-desc">This memory and its photos will be removed. This can't be undone.</p>
              <div className="mem-editor-actions">
                <button className="dash-btn-ghost light" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button className="mem-delete-btn mem-confirm-delete" onClick={() => deleteMemory(m.id)}><NavIcon.trash /> Delete Memory</button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDeleteJournalId && (() => {
        const j = journal.find((x) => x.id === confirmDeleteJournalId);
        if (!j) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setConfirmDeleteJournalId(null)}>
            <div className="feature-modal mem-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete journal entry?</h3>
              <p className="feature-modal-desc">Your "{j.location}" entry from {j.date} will be removed. This can't be undone.</p>
              <div className="mem-editor-actions">
                <button className="dash-btn-ghost light" onClick={() => setConfirmDeleteJournalId(null)}>Cancel</button>
                <button className="mem-delete-btn mem-confirm-delete" onClick={() => deleteJournalEntry(j.id)}><NavIcon.trash /> Delete Entry</button>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingMemoryId && (() => {
        const m = memories.find((x) => x.id === viewingMemoryId);
        if (!m) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setViewingMemoryId(null)}>
            <div className="mem-lightbox mem-detail-lightbox" onClick={(e) => e.stopPropagation()}>
              <div className="mem-detail-media">
                <div className="mem-lightbox-image" style={{ backgroundImage: `url(${m.photos[0] ?? "/images/dest-kyoto.png"})` }} />
                {m.photos.length > 1 && (
                  <div className="mem-detail-thumbstrip">
                    {m.photos.map((p) => <div key={p} className="mem-detail-thumb" style={{ backgroundImage: `url(${p})` }} />)}
                  </div>
                )}
              </div>
              <div className="mem-lightbox-panel">
                <div className="mem-lightbox-panel-head">
                  <span className="mem-detail-emoji">{m.emoji}</span>
                  <button className="feature-modal-close" aria-label="Close" onClick={() => setViewingMemoryId(null)}><NavIcon.close /></button>
                </div>
                <h3>{m.title}</h3>
                <p className="mem-detail-meta"><NavIcon.location /> {m.location} <span>·</span> <NavIcon.calendar /> {m.date}</p>
                <div className="mem-chip-row">
                  <span className="mem-trip-tag">{m.trip}</span>
                  {m.tags.map((t) => <span key={t} className="mem-mini-tag">{t}</span>)}
                </div>
                <p className="mem-detail-desc" dangerouslySetInnerHTML={{ __html: m.desc }} />
                <div className="mem-editor-actions">
                  <button type="button" className="mem-delete-btn" onClick={() => { setViewingMemoryId(null); setConfirmDeleteId(m.id); }}><NavIcon.trash /> Delete</button>
                  <button type="button" className="btn-primary feature-modal-cta" onClick={() => { setViewingMemoryId(null); openEditMemory(m); }}><NavIcon.edit /> Edit Memory</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingJournalId && (() => {
        const j = journal.find((x) => x.id === viewingJournalId);
        if (!j) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setViewingJournalId(null)}>
            <div className="mem-lightbox mem-detail-lightbox" onClick={(e) => e.stopPropagation()}>
              <div className="mem-detail-media">
                <div className="mem-lightbox-image" style={{ backgroundImage: `url(${j.photos[0] ?? "/images/dest-kyoto.png"})` }} />
                {j.photos.length > 1 && (
                  <div className="mem-detail-thumbstrip">
                    {j.photos.map((p) => <div key={p} className="mem-detail-thumb" style={{ backgroundImage: `url(${p})` }} />)}
                  </div>
                )}
              </div>
              <div className="mem-lightbox-panel">
                <div className="mem-lightbox-panel-head">
                  <span className="mem-detail-emoji">{moodEmoji[j.mood] ?? "📝"}</span>
                  <button className="feature-modal-close" aria-label="Close" onClick={() => setViewingJournalId(null)}><NavIcon.close /></button>
                </div>
                <h3>{j.location}</h3>
                <p className="mem-detail-meta"><NavIcon.calendar /> {j.date} <span>·</span> <NavIcon.sun /> {j.weather}</p>
                <div className="mem-chip-row">
                  <span className="mem-trip-tag">{j.trip}</span>
                  <span className="mem-mood-tag">{j.mood}</span>
                </div>
                <p className="mem-detail-desc" dangerouslySetInnerHTML={{ __html: j.text }} />
                <div className="mem-editor-actions">
                  <button type="button" className="mem-delete-btn" onClick={() => { setViewingJournalId(null); setConfirmDeleteJournalId(j.id); }}><NavIcon.trash /> Delete</button>
                  <button type="button" className="btn-primary feature-modal-cta" onClick={() => { setViewingJournalId(null); openEditJournalEntry(j); }}><NavIcon.edit /> Edit Entry</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {uploadTagModalOpen && (
        <div className="feature-modal-overlay" onClick={() => setUploadTagModalOpen(false)}>
          <div className="feature-modal mem-editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="feature-modal-close" aria-label="Close" onClick={() => setUploadTagModalOpen(false)}><NavIcon.close /></button>
            <h3>Tag {pendingUploadUrls.length} photo{pendingUploadUrls.length === 1 ? "" : "s"}</h3>
            <p className="feature-modal-desc">Choose a trip and tags before adding {pendingUploadUrls.length === 1 ? "it" : "them"} to your library.</p>

            <div className="mem-editor-photos">
              {pendingUploadUrls.map((p) => (
                <div key={p} className="mem-editor-photo" style={{ backgroundImage: `url(${p})` }} />
              ))}
            </div>

            <p className="mem-editor-label">Trip</p>
            <select value={uploadTrip} onChange={(e) => setUploadTrip(e.target.value)}>
              {tripFilters.slice(0, -1).map((t) => <option key={t}>{t}</option>)}
            </select>

            <p className="mem-editor-label">Tags</p>
            <div className="mem-chip-row">
              {smartAlbums.map((a) => (
                <button key={a.key} type="button" className={uploadTags.includes(a.key) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => toggleUploadTag(a.key)}>{a.label}</button>
              ))}
              {customTags.map((t) => (
                <button key={t} type="button" className={uploadTags.includes(t) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => toggleUploadTag(t)}>{t}</button>
              ))}
            </div>
            <div className="mem-custom-tag-row mem-custom-tag-row-inline">
              <input
                value={newTagDraft}
                onChange={(e) => setNewTagDraft(e.target.value)}
                placeholder="Add a custom tag..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomUploadTag(); } }}
              />
              <button type="button" onClick={addCustomUploadTag}><NavIcon.plus /></button>
            </div>

            <div className="mem-editor-actions">
              <button type="button" className="btn-primary feature-modal-cta" onClick={confirmUploadPhotos}><NavIcon.check /> Add to Library</button>
            </div>
          </div>
        </div>
      )}

      {viewingPhotoId && (() => {
        const p = photoLibrary.find((x) => x.id === viewingPhotoId);
        if (!p) return null;
        return (
          <div className="feature-modal-overlay" onClick={() => setViewingPhotoId(null)}>
            <div className="mem-lightbox" onClick={(e) => e.stopPropagation()}>
              <div className="mem-lightbox-image" style={{ backgroundImage: `url(${p.src})` }} />
              <div className="mem-lightbox-panel">
                <div className="mem-lightbox-panel-head">
                  <button className="feature-modal-close" aria-label="Close" onClick={() => setViewingPhotoId(null)}><NavIcon.close /></button>
                </div>

                <div className="mem-lightbox-panel-body">
                  <p className="mem-editor-label">Trip</p>
                  <select value={p.trip} onChange={(e) => setPhotoTripTag(p.id, e.target.value)}>
                    {tripFilters.slice(0, -1).map((t) => <option key={t}>{t}</option>)}
                  </select>

                  <p className="mem-editor-label">Tags</p>
                  <div className="mem-chip-row">
                    {smartAlbums.map((a) => (
                      <button key={a.key} type="button" className={p.albums.includes(a.key) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => togglePhotoAlbum(p.id, a.key)}>
                        {a.label}
                      </button>
                    ))}
                    {customTags.map((t) => (
                      <button key={t} type="button" className={p.albums.includes(t) ? "mem-tag-chip active" : "mem-tag-chip"} onClick={() => togglePhotoAlbum(p.id, t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="mem-custom-tag-row">
                    <input
                      value={newTagDraft}
                      onChange={(e) => setNewTagDraft(e.target.value)}
                      placeholder="Add a custom tag..."
                      onKeyDown={(e) => { if (e.key === "Enter") addCustomTag(p.id); }}
                    />
                    <button type="button" onClick={() => addCustomTag(p.id)}><NavIcon.plus /></button>
                  </div>
                </div>

                <button type="button" className="mem-delete-btn mem-lightbox-delete-bottom" onClick={() => deletePhoto(p.id)}><NavIcon.trash /> Delete Photo</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
