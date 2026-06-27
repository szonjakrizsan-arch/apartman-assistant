/**
 * icalBookings.ts
 */

import type { Booking, BookingStatus, BookingSource } from "./mockData";
import type { FeedConfig, FeedSource } from "./icalFeeds";
import { parseIcal, parseIcalDate, formatHu, daysBetween, todayUTC } from "./icalFeeds";

const SOURCE_MAP: Record<FeedSource, BookingSource> = {
  szallas:     "Szallas.hu",
  airbnb:      "Airbnb",
  booking:     "Booking",
  google:      "Google",
  vrbo:        "VRBO",
  tripadvisor: "TripAdvisor",
  expedia:     "Expedia",
};

const SOURCE_PRIORITY: Record<BookingSource, number> = {
  Airbnb:      0,
  Booking:     1,
  VRBO:        2,
  TripAdvisor: 3,
  Expedia:     4,
  Google:      5,
  "Szallas.hu": 6,
};

function deriveStatus(checkin: Date, checkout: Date, today: Date): BookingStatus {
  if (today.getTime() === checkin.getTime()) return "arriving";
  if (today.getTime() === checkout.getTime()) return "departing";
  if (today > checkin && today < checkout)    return "staying";
  return "staying";
}

function normalizeEvent(
  feed: FeedConfig,
  uid: string,
  dtstart: string,
  dtend: string,
  summary: string,
  today: Date,
  firstCheckins: Record<string, string>,
): Booking | null {
  const stableKey = `${feed.apartment}::${dtend}::${feed.source}`;
  const effectiveStart = firstCheckins[stableKey] ?? dtstart;

  const checkin  = parseIcalDate(effectiveStart);
  const checkout = parseIcalDate(dtend);
  const nights   = daysBetween(checkin, checkout);

  const isKnownBooking  = stableKey in firstCheckins;
  const isArrivingToday = checkin.getTime() === today.getTime();

  if (feed.source === "szallas" && !isKnownBooking && !isArrivingToday) return null;

  if (nights <= 0) return null;
  const isActive        = checkin <= today && today < checkout;
  const isCheckoutToday = today.getTime() === checkout.getTime();
  if (!isActive && !isCheckoutToday) return null;

  const source = SOURCE_MAP[feed.source];
  const status = deriveStatus(checkin, checkout, today);

  return {
    id:               `ical-${stableKey}`,
    apartment:        feed.apartment,
    accent:           feed.accent,
    status,
    source,
    arrival:          formatHu(checkin),
    departure:        formatHu(checkout),
    nights,
    isTodayArrival:   status === "arriving",
    isTodayDeparture: status === "departing",
    paymentStatus:    "pending" as const,
    hasSourceConflict: false,
    _uid:          uid,
    _summary:      summary,
    _checkinRaw:   effectiveStart,
    _checkoutRaw:  dtend,
    _isActiveRaw:  isActive,
    _stableKey:    stableKey,
  } as Booking;
}

function rangesOverlap(a: Booking, b: Booking): boolean {
  if (a.source === b.source) return false;
  const aStart = parseIcalDate(a._checkinRaw!);
  const aEnd   = parseIcalDate(a._checkoutRaw!);
  const bStart = parseIcalDate(b._checkinRaw!);
  const bEnd   = parseIcalDate(b._checkoutRaw!);
  return aStart < bEnd && bStart < aEnd;
}

const CONFLICT_THRESHOLD_DAYS = 999;

function resolveCrossSourceOverlaps(bookings: Booking[]): Booking[] {
  const byApartment = new Map<string, Booking[]>();
  for (const b of bookings) {
    if (!byApartment.has(b.apartment)) byApartment.set(b.apartment, []);
    byApartment.get(b.apartment)!.push(b);
  }

  const result: Booking[] = [];

  for (const list of byApartment.values()) {
    const toKeep = new Set<number>();
    const trueConflicts = new Set<number>();

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (!rangesOverlap(list[i], list[j])) continue;

        const sameCheckout = list[i]._checkoutRaw === list[j]._checkoutRaw;
        if (!sameCheckout) {
          toKeep.add(i);
          toKeep.add(j);
          trueConflicts.add(i);
          trueConflicts.add(j);
        } else {
          const iPrio = SOURCE_PRIORITY[list[i].source] ?? 99;
          const jPrio = SOURCE_PRIORITY[list[j].source] ?? 99;
          if (iPrio <= jPrio) {
            toKeep.add(i);
          } else {
            toKeep.add(j);
          }
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      let hasAnyOverlap = false;
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        if (rangesOverlap(list[i], list[j])) { hasAnyOverlap = true; break; }
      }
      if (!hasAnyOverlap) toKeep.add(i);
    }

    for (const i of toKeep) {
      const b = trueConflicts.has(i)
        ? { ...list[i], hasSourceConflict: true }
        : list[i];
      result.push(b);
    }
  }

  return result;
}

export async function fetchFeed(
  feed: FeedConfig,
  firstCheckins: Record<string, string>,
): Promise<Booking[]> {
  const today = todayUTC();
  try {
    const res = await fetch(feed.url, {
      headers: { Accept: "text/calendar" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const events = parseIcal(text);

    return events
      .map((e) => normalizeEvent(feed, e.uid, e.dtstart, e.dtend, e.summary ?? "", today, firstCheckins))
      .filter((b): b is Booking => b !== null);
  } catch (err) {
    console.warn(`[iCal] Failed to fetch ${feed.apartment} (${feed.source}):`, err);
    return [];
  }
}

export async function fetchAllBookings(
  feeds: FeedConfig[],
  firstCheckins: Record<string, string> = {},
  knownBookings: Record<string, { firstCheckin: string; lastCheckout: string; apartment: string; accent: string; source: string }> = {},
): Promise<{
  bookings: Booking[];
  errors:   string[];
}> {
  const results = await Promise.allSettled(
    feeds.map((f) => fetchFeed(f, firstCheckins)),
  );

  let bookings: Booking[] = [];
  const errors:   string[]  = [];
  const seen = new Set<string>();
  const seenStableKeys = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      errors.push(`${feeds[i].apartment} (${feeds[i].source}): ${r.reason}`);
      continue;
    }
    for (const b of r.value) {
      const key = `${b.apartment}::${b._checkinRaw}::${b.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if ((b as any)._stableKey) seenStableKeys.add((b as any)._stableKey);
      bookings.push(b);
    }
  }

  /* ── 1. Kereszt-forrás ütközés-feloldás ELŐSZÖR ── */
  bookings = resolveCrossSourceOverlaps(bookings);

  /* ── 2. Konfliktust jelző apartmanok listája ── */
  const conflictedApartments = new Set(
    bookings.filter(b => b.hasSourceConflict).map(b => b.apartment)
  );

  /* ── 3. Feltámasztás a feedből eltűnt, de ma még távozó foglalásoknak ── */
  const today = todayUTC();
  for (const stableKey in knownBookings) {
    if (seenStableKeys.has(stableKey)) continue;
    const kb = knownBookings[stableKey];
    if (!kb.lastCheckout) continue;
    const checkout = parseIcalDate(kb.lastCheckout);
    const checkin  = parseIcalDate(kb.firstCheckin);
    if (checkout.getTime() !== today.getTime()) continue;
    const nights = daysBetween(checkin, checkout);

    bookings.push({
      id:               `ical-${stableKey}`,
      apartment:        kb.apartment,
      accent:           kb.accent as Booking["accent"],
      status:           "departing",
      source:           (SOURCE_MAP[kb.source as FeedSource] ?? "Szallas.hu") as Booking["source"],
      arrival:          formatHu(checkin),
      departure:        formatHu(checkout),
      nights:           nights > 0 ? nights : 1,
      isTodayArrival:   false,
      isTodayDeparture: true,
      paymentStatus:    "pending",
      hasSourceConflict: conflictedApartments.has(kb.apartment),
      _uid:          stableKey,
      _summary:      "",
      _checkinRaw:   kb.firstCheckin,
      _checkoutRaw:  kb.lastCheckout,
      _isActiveRaw:  false,
      _stableKey:    stableKey,
    } as Booking);
  }

  const ORDER: BookingStatus[] = ["arriving", "staying", "departing"];
  bookings.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  return { bookings, errors };
}

export async function fetchFutureBookings(feeds: FeedConfig[]): Promise<import("./mockData").FutureBooking[]> {
  const today  = todayUTC();
  const cutoff = new Date(today.getTime() + 60 * 86_400_000);

  const results = await Promise.allSettled(feeds.map((f) => fetchFeedRaw(f)));
  const seen    = new Set<string>();
  const future: import("./mockData").FutureBooking[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "fulfilled") continue;

    for (const e of r.value) {
      const checkin  = parseIcalDate(e.dtstart);
      const checkout = parseIcalDate(e.dtend);
      if (checkin <= today || checkin > cutoff) continue;
      const nights = daysBetween(checkin, checkout);
      if (nights <= 0) continue;
      const feed = feeds[i];
      const key  = `${feed.apartment}::${e.dtstart}`;
      if (seen.has(key)) continue;
      seen.add(key);

      future.push({
        id:           `ical-${feed.apartment}::${e.dtend}::${feed.source}`,
        apartment:    feed.apartment,
        accent:       feed.accent,
        arrival:      formatHu(checkin),
        nights,
        source:       SOURCE_MAP[feed.source],
        _checkinRaw:  e.dtstart,
        _checkoutRaw: e.dtend,
      });
    }
  }

  future.sort((a, b) => a._checkinRaw.localeCompare(b._checkinRaw));
  return future;
}

async function fetchFeedRaw(feed: FeedConfig) {
  try {
    const res = await fetch(feed.url, { cache: "no-store" });
    if (!res.ok) return [];
    const text = await res.text();
    return parseIcal(text);
  } catch {
    return [];
  }
}
