import { useState } from "react";
import { Phone, Mail, Search, User, CalendarDays, Plus, Trash2, Briefcase } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { useManualContacts } from "../hooks/useManualContacts";
import type { AppState, AppStateActions } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";

interface ContactsScreenProps {
  appState: AppState & AppStateActions;
  ical: IcalState;
  userId: string;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
  bookings: { arrival: string; departure: string; apartment: string; year?: string }[];
}

export function ContactsScreen({ appState, ical, userId }: ContactsScreenProps) {
  const [search, setSearch] = useState("");
  const { detailStates } = appState;
  const { contacts: manualContacts, addContact, deleteContact } = useManualContacts(userId);

  /* Add form state */
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName]   = useState("");
  const [newRole, setNewRole]   = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote]   = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    await addContact({
      name: newName.trim(), role: newRole.trim(),
      phone: newPhone.trim(), email: newEmail.trim(), note: newNote.trim(),
    });
    setNewName(""); setNewRole(""); setNewPhone(""); setNewEmail(""); setNewNote("");
    setShowAdd(false);
  }

  /* Build guest contact list from detailStates — keyed by contactName */
  const contactMap = new Map<string, Contact>();

  for (const booking of ical.bookings) {
    const detail = detailStates[booking.id];
    if (!detail) continue;
    const name  = detail.contactName?.trim();
    const phone = detail.contactPhone?.trim();
    const email = detail.contactEmail?.trim();
    if (!name && !phone && !email) continue;

    const key = name || phone || email;
    if (!contactMap.has(key)) {
      contactMap.set(key, { name: name || "—", phone: phone || "", email: email || "", bookings: [] });
    }

    contactMap.get(key)!.bookings.push({
      arrival:   booking.arrival,
      departure: booking.departure,
      apartment: booking.apartment,
      year:      booking._checkinRaw ? booking._checkinRaw.slice(0, 4) : "",
    });
  }

  /* Future bookings */
  for (const booking of ical.futureBookings) {
    const detail = detailStates[booking.id];
    if (!detail) continue;
    const name  = detail.contactName?.trim();
    const phone = detail.contactPhone?.trim();
    const email = (detail as any).contactEmail?.trim();
    if (!name && !phone && !email) continue;

    const key = name || phone || email;
    if (!contactMap.has(key)) {
      contactMap.set(key, { name: name || "—", phone: phone || "", email: email || "", bookings: [] });
    }
    contactMap.get(key)!.bookings.push({
      arrival:   booking.arrival,
      departure: `${booking.nights} éj`,
      apartment: booking.apartment,
      year:      booking._checkinRaw ? booking._checkinRaw.slice(0, 4) : "",
    });
  }

  const guestContacts = Array.from(contactMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "hu")
  );

  const q = search.toLowerCase();
  const filteredGuests = guestContacts.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  );
  const filteredManual = manualContacts.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.role.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  );

  const inputCls = "w-full rounded-xl border bg-transparent px-3 py-2.5 text-[13px] text-text-primary outline-none input-teal";
  const inputStyle = { borderColor: "rgb(86 176 187 / 0.25)" } as React.CSSProperties;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <SectionHeader
        title="Kapcsolatok"
        subtitle={`${guestContacts.length} vendég · ${manualContacts.length} egyéb`}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, címke, telefon, email alapján…"
          className="w-full rounded-xl border bg-surface-raised py-2.5 pl-9 pr-4 text-[13px] text-text-primary outline-none"
          style={{ borderColor: "rgb(86 176 187 / 0.20)" }}
        />
      </div>

      {/* ── Saját kapcsolatok (manual) ── */}
      <section aria-label="Saját kapcsolatok">
        <div className="mb-3 flex items-center gap-2.5">
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Saját kapcsolatok
          </h2>
          <div className="flex-1 border-t border-dashed border-border-faint/50" aria-hidden />
        </div>

        {filteredManual.length > 0 && (
          <ul className="flex flex-col gap-3 mb-3">
            {filteredManual.map((c) => (
              <li key={c.id}>
                <article className="card-elevated rounded-2xl p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                      style={{ background: "rgb(217 171 78 / 0.16)", color: "#ddb055" }}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold" style={{ color: "#F4F0E8" }}>
                        {c.name}
                      </span>
                      {c.role && (
                        <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: "rgb(217 171 78 / 0.14)", color: "#ddb055", outline: "1px solid rgb(217 171 78 / 0.28)" }}>
                          {c.role}
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => deleteContact(c.id)}
                      className="pressable flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ color: "rgb(207 102 85 / 0.6)" }}
                      aria-label={`${c.name} törlése`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 mb-2">
                      <Phone className="h-4 w-4 shrink-0 text-text-muted" />
                      <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{c.phone}</span>
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 mb-2">
                      <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                      <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{c.email}</span>
                    </a>
                  )}
                  {c.note && (
                    <p className="text-[12px] text-text-secondary">{c.note}</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}

        {/* Add form / button */}
        {showAdd ? (
          <div className="card-elevated rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-text-primary">Új kapcsolat</p>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Név (pl. Kovács János)" className={inputCls} style={inputStyle} autoFocus />
            <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)}
              placeholder="Címke (pl. kertész, takarító)" className={inputCls} style={inputStyle} />
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Telefonszám" className={inputCls} style={inputStyle} />
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email cím (opcionális)" className={inputCls} style={inputStyle} />
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
              placeholder="Megjegyzés (opcionális)" className={inputCls} style={inputStyle} />
            <div className="flex gap-2">
              <button type="button" onClick={handleAdd}
                className="pressable flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
                style={{ background: "rgb(86 176 187 / 0.18)", color: "#56b0bb" }}>
                Mentés
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="pressable flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-text-muted">
                Mégse
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowAdd(true)}
            className="pressable flex w-full items-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-left"
            style={{ borderColor: "rgb(86 176 187 / 0.25)", color: "#56b0bb" }}>
            <Plus className="h-4 w-4" />
            <span className="text-[13px] font-medium">Kapcsolat hozzáadása (pl. takarító, kertész)</span>
          </button>
        )}
      </section>

      {/* ── Vendégek ── */}
      <section aria-label="Vendég kapcsolatok">
        <div className="mb-3 flex items-center gap-2.5">
          <User className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Vendégek
          </h2>
          <div className="flex-1 border-t border-dashed border-border-faint/50" aria-hidden />
        </div>

        {filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center"
            style={{ borderColor: "rgb(86 176 187 / 0.18)" }}>
            <User className="h-8 w-8 text-text-muted" />
            <p className="text-[13px] text-text-secondary">
              {search ? "Nincs találat." : "Még nincs mentett vendég."}
            </p>
            <p className="text-[11px] text-text-muted">
              {!search && "Add meg a vendégek adatait a foglalás részleteinél."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filteredGuests.map((contact) => (
              <li key={contact.name + contact.phone}>
                <article className="card-elevated rounded-2xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                      style={{ background: "rgb(86 176 187 / 0.18)", color: "#7dd4dd" }}>
                      {contact.name !== "—" ? contact.name.slice(0, 2).toUpperCase() : "?"}
                    </span>
                    <span className="text-[15px] font-bold" style={{ color: "#F4F0E8" }}>
                      {contact.name}
                    </span>
                  </div>

                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 mb-2">
                      <Phone className="h-4 w-4 shrink-0 text-text-muted" />
                      <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{contact.phone}</span>
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 mb-2">
                      <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                      <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{contact.email}</span>
                    </a>
                  )}

                  {contact.bookings.length > 0 && (
                    <div className="mt-3 border-t pt-3" style={{ borderColor: "rgb(255 255 255 / 0.06)" }}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Foglalások
                      </p>
                      <ul className="flex flex-col gap-1">
                        {contact.bookings.map((b, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                            <span className="text-[12px] text-text-secondary">
                              {b.apartment} · {b.arrival} → {b.departure}{b.year ? ` (${b.year})` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
