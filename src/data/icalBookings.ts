/**
 * icalBookings.ts — normalize raw iCal events into the app's Booking shape.
 *
 * READ-ONLY. No external writes. No OTA sync.
 *
 * Megjegyzés: a Szállás.hu feed naponta "levágja" a múltbeli napokat
 * (a DTSTART előre csúszik), ezért stabil kulcsot használunk
 * (apartman + távozás + forrás), és az először látott érkezési
 * dátumot vesszük figyelembe (firstCheckins).
 */

import type { Booking, BookingStatus, BookingSource } from "./mockData";
import type { FeedConfig, FeedSource } from "./icalFeeds";
import { parseIcal, parseIcalDate, formatHu, daysBetween, todayUTC } from "./icalFeeds";

/* ── Source mapping ──────────────────────────────────────────────── */
const SOURCE_MAP: Record<FeedSource, BookingSource> = {
  szallas:     "Szallas.hu",
  airbnb:      "Airbnb",
  booking:     "Booking",
  google:      "Google",
  vrbo:        "VRBO",
  tripadvisor: "TripAdvisor",
  expedia:     "Expedia",
};

/* ── Derive BookingStatus from dates ─────────────────────────────── */
function deriveStatus(checkin: Date, checkout: Date, today: Date): BookingStatus {
  if (today.getTime() === checkin.getTime()) return "arriving";
  if (today.getTime() === checkout.getTime()) return "departing";
  if (today > checkin && today < checkout)    return "staying";
  return "staying";
}

/* ── Normalise one raw iCal event into a Booking ─────────────────── */
function normalizeEvent(
  feed: FeedConfig,
  uid: string,
  dtstart: string,
  dtend: string,
  summary: string,
  today: Date,
  firstCheckins: Record<string, string>,
): Booking | null {
  /* Stabil kulcs: nem változik akkor sem, ha a feed levágja a múltat */
  const stableKey = `${feed.apartment}::${dtend}::${feed.source}`;
  /* Az először látott érkezési dátum számít, nem a feed mai állapota */
  const effectiveStart = firstCheckins[stableKey] ?? dtstart;

  const checkin  = parseIcalDate(effectiveStart);
  const checkout = parseIcalDate(dtend);
  const nights   = daysBetween(checkin, checkout);

  const isKnownBooking = stableKey in firstCheckins;
  const startsToday     = checkin.getTime() === today.getTime();
  if (!isKnownBooking && !startsToday && summary.toLowerCase().includes("not available")) return null;
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
    _uid:          uid,
    _summary:      summary,
    _checkinRaw:   effectiveStart,
    _checkoutRaw:  dtend,
    _isActiveRaw:  isActive,
    _stableKey:    stableKey,
  } as Booking;
}

/* ── Fetch + parse one feed (browser only) ───────────────────────── */
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

/* ── Fetch all feeds, merge, deduplicate ─────────────────────────── */
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

  const bookings: Booking[] = [];
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

  /* ── "Feltámasztás": a feedből eltűnt, de ma még távozó foglalások ──
     A Szállás.hu a checkout napján kiveszi a foglalást a feedből.
     Ha a mentett checkout ma vagy a jövőben van, újrateremtjük "Távozik"-ként. */
  const today = todayUTC();
  for (const stableKey in knownBookings) {
    if (seenStableKeys.has(stableKey)) continue; /* még a feedben van, nem kell */
    const kb = knownBookings[stableKey];
    if (!kb.lastCheckout) continue;
    const checkout = parseIcalDate(kb.lastCheckout);
    const checkin  = parseIcalDate(kb.firstCheckin);
    /* Csak akkor mutatjuk, ha a checkout MA van (vagy ma még nem múlt el) */
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

/* ── Fetch future bookings (next 60 days, not today) ─────────────── */
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
