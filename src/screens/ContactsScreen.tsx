import { useState } from "react";
import { Phone, Mail, Search, User, CalendarDays } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, AppStateActions } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";

interface ContactsScreenProps {
  appState: AppState & AppStateActions;
  ical: IcalState;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
  bookings: { arrival: string; departure: string; apartment: string; year: string }[];
}

export function ContactsScreen({ appState, ical }: ContactsScreenProps) {
  const [search, setSearch] = useState("");
  const { detailStates } = appState;
  const allBookings = [...ical.bookings, ...ical.futureBookings];

  /* Build contact list from detailStates — keyed by contactName */
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
    });
  }

  /* Sort A-Z by name */
  const contacts = Array.from(contactMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "hu")
  );

  /* Filter by search */
  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-5 pb-2">
      <SectionHeader
        title="Kapcsolatok"
        subtitle={`${contacts.length} vendég`}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, telefon, email alapján…"
          className="w-full rounded-xl border bg-surface-raised py-2.5 pl-9 pr-4 text-[13px] text-text-primary outline-none"
          style={{ borderColor: "rgb(86 176 187 / 0.20)" }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center"
          style={{ borderColor: "rgb(86 176 187 / 0.18)" }}>
          <User className="h-8 w-8 text-text-muted" />
          <p className="text-[13px] text-text-secondary">
            {search ? "Nincs találat." : "Még nincs mentett kapcsolat."}
          </p>
          <p className="text-[11px] text-text-muted">
            {!search && "Add meg a vendégek adatait a foglalás részleteinél."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((contact) => (
            <li key={contact.name + contact.phone}>
              <article className="card-elevated rounded-2xl p-4">
                {/* Name */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                    style={{ background: "rgb(86 176 187 / 0.18)", color: "#7dd4dd" }}>
                    {contact.name !== "—" ? contact.name.slice(0, 2).toUpperCase() : "?"}
                  </span>
                  <span className="text-[15px] font-bold" style={{ color: "#F4F0E8" }}>
                    {contact.name}
                  </span>
                </div>

                {/* Phone */}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`}
                    className="flex items-center gap-2.5 mb-2"
                    onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-4 w-4 shrink-0 text-text-muted" />
                    <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>
                      {contact.phone}
                    </span>
                  </a>
                )}

                {/* Email */}
                {contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="flex items-center gap-2.5 mb-2"
                    onClick={(e) => e.stopPropagation()}>
                    <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                    <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>
                      {contact.email}
                    </span>
                  </a>
                )}

                {/* Bookings */}
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
    </div>
  );
}