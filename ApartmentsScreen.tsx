import { useState } from "react";
import { Plus, Trash2, Link, ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { useApartments } from "../hooks/useApartments";
import type { ApartmentAccent } from "../data/mockData";

const ACCENT_OPTIONS: { value: ApartmentAccent; label: string; color: string }[] = [
  { value: "coral",    label: "Korall",   color: "#dc8460" },
  { value: "sage",     label: "Zsálya",   color: "#60bc9e" },
  { value: "sky",      label: "Égkék",    color: "#6aa6cc" },
  { value: "lavender", label: "Levendula", color: "#9c91c8" },
  { value: "amber",    label: "Borostyán", color: "#d9ab4e" },
];

const SOURCE_OPTIONS = [
  { value: "airbnb",      label: "Airbnb" },
  { value: "szallas",     label: "Szállás.hu" },
  { value: "booking",     label: "Booking.com" },
  { value: "google",      label: "Google Naptár" },
  { value: "vrbo",        label: "VRBO" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "expedia",     label: "Expedia" },
];

interface ApartmentsScreenProps {
  userId: string;
}

export function ApartmentsScreen({ userId }: ApartmentsScreenProps) {
  const { apartments, feeds, loading, addApartment, deleteApartment, addFeed, deleteFeed } = useApartments(userId);

  const [newName, setNewName]     = useState("");
  const [newAccent, setNewAccent] = useState<ApartmentAccent>("coral");
  const [showAddApt, setShowAddApt] = useState(false);

  const [expandedApt, setExpandedApt] = useState<string | null>(null);
  const [newSource, setNewSource] = useState("airbnb");
  const [newUrl, setNewUrl]       = useState("");
  const [addingFeedFor, setAddingFeedFor] = useState<string | null>(null);

  async function handleAddApartment() {
    if (!newName.trim()) return;
    await addApartment(newName.trim(), newAccent);
    setNewName(""); setNewAccent("coral"); setShowAddApt(false);
  }

  async function handleAddFeed(apartmentId: string) {
    if (!newUrl.trim()) return;
    await addFeed(apartmentId, newSource, newUrl.trim());
    setNewUrl(""); setNewSource("airbnb"); setAddingFeedFor(null);
  }

  if (loading) return <p className="text-text-muted text-[13px]">Betöltés...</p>;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <SectionHeader title="Apartmanok" subtitle={`${apartments.length} apartman`} />

      {/* Apartman lista */}
      {apartments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center"
          style={{ borderColor: "rgb(86 176 187 / 0.18)" }}>
          <p className="text-[13px] text-text-secondary">Még nincs apartman.</p>
          <p className="text-[11px] text-text-muted">Adja hozzá az első apartmant alább.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {apartments.map((apt) => {
            const aptFeeds = feeds.filter((f) => f.apartment_id === apt.id);
            const accentColor = ACCENT_OPTIONS.find((a) => a.value === apt.accent)?.color ?? "#56b0bb";
            const isExpanded = expandedApt === apt.id;

            return (
              <li key={apt.id}>
                <div className="card-elevated rounded-2xl overflow-hidden">
                  {/* Apartment header */}
                  <div className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: isExpanded ? "1px solid rgb(255 255 255 / 0.06)" : "none" }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                      style={{ background: `${accentColor}22`, color: accentColor }}>
                      {apt.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex-1 text-[14px] font-semibold text-text-primary">{apt.name}</span>
                    <span className="text-[11px] text-text-muted mr-2">{aptFeeds.length} feed</span>
                    <button type="button" onClick={() => setExpandedApt(isExpanded ? null : apt.id)}
                      className="pressable flex h-7 w-7 items-center justify-center rounded-lg transition-soft"
                      style={{ color: "#56b0bb" }}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => deleteApartment(apt.id)}
                      className="pressable flex h-7 w-7 items-center justify-center rounded-lg transition-soft"
                      style={{ color: "rgb(207 102 85 / 0.6)" }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Feeds */}
                  {isExpanded && (
                    <div className="px-4 py-3 flex flex-col gap-2">
                      {aptFeeds.length === 0 && (
                        <p className="text-[12px] text-text-muted">Még nincs iCal feed.</p>
                      )}
                      {aptFeeds.map((feed) => (
                        <div key={feed.id} className="flex items-center gap-2 rounded-xl border px-3 py-2"
                          style={{ borderColor: "rgb(86 176 187 / 0.15)", background: "rgb(86 176 187 / 0.05)" }}>
                          <Link className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                          <span className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-text-secondary">
                              {SOURCE_OPTIONS.find((s) => s.value === feed.source)?.label ?? feed.source}
                            </span>
                            <span className="block text-[10px] text-text-muted truncate">{feed.url}</span>
                          </span>
                          <button type="button" onClick={() => deleteFeed(feed.id)}
                            className="pressable flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                            style={{ color: "rgb(207 102 85 / 0.5)" }}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add feed form */}
                      {addingFeedFor === apt.id ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <select value={newSource} onChange={(e) => setNewSource(e.target.value)}
                            className="w-full rounded-lg border bg-surface-raised px-3 py-2 text-[13px] text-text-primary outline-none"
                            style={{ borderColor: "rgb(86 176 187 / 0.25)" }}>
                            {SOURCE_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="iCal URL (https://...)"
                            className="w-full rounded-lg border bg-transparent px-3 py-2 text-[12px] text-text-primary outline-none input-teal"
                            style={{ borderColor: "rgb(86 176 187 / 0.25)" }} />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleAddFeed(apt.id)}
                              className="pressable flex-1 rounded-lg py-2 text-[12px] font-semibold"
                              style={{ background: "rgb(86 176 187 / 0.18)", color: "#56b0bb" }}>
                              Mentés
                            </button>
                            <button type="button" onClick={() => setAddingFeedFor(null)}
                              className="pressable flex-1 rounded-lg py-2 text-[12px] font-semibold text-text-muted">
                              Mégse
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setAddingFeedFor(apt.id)}
                          className="pressable flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-left mt-1"
                          style={{ borderColor: "rgb(86 176 187 / 0.25)", color: "#56b0bb" }}>
                          <Plus className="h-3.5 w-3.5" />
                          <span className="text-[12px] font-medium">iCal feed hozzáadása</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add apartment form */}
      {showAddApt ? (
        <div className="card-elevated rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-text-primary">Új apartman</p>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Apartman neve (pl. Napfény)"
            className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-[13px] text-text-primary outline-none input-teal"
            style={{ borderColor: "rgb(86 176 187 / 0.25)" }} autoFocus />
          <div className="flex gap-2">
            {ACCENT_OPTIONS.map((a) => (
              <button key={a.value} type="button" onClick={() => setNewAccent(a.value)}
                className="pressable flex-1 rounded-xl py-2 text-[11px] font-semibold transition-soft"
                style={{
                  background: newAccent === a.value ? `${a.color}22` : "transparent",
                  color: a.color,
                  outline: newAccent === a.value ? `1px solid ${a.color}44` : `1px solid ${a.color}22`,
                }}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAddApartment}
              className="pressable flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
              style={{ background: "rgb(86 176 187 / 0.18)", color: "#56b0bb" }}>
              Hozzáadás
            </button>
            <button type="button" onClick={() => setShowAddApt(false)}
              className="pressable flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-text-muted">
              Mégse
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAddApt(true)}
          className="pressable flex w-full items-center gap-2 rounded-2xl border border-dashed px-4 py-3.5 text-left"
          style={{ borderColor: "rgb(86 176 187 / 0.25)", color: "#56b0bb" }}>
          <Plus className="h-4 w-4" />
          <span className="text-[13px] font-medium">Új apartman hozzáadása</span>
        </button>
      )}
    </div>
  );
}