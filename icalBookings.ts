/**
 * icalBookings.ts — normalize raw iCal events into the app's Booking shape.
 *
 * READ-ONLY. No external writes. No OTA sync.
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
): Booking | null {
  const checkin  = parseIcalDate(dtstart);
  const checkout = parseIcalDate(dtend);
  const nights   = daysBetween(checkin, checkout);

  if (summary.toLowerCase().includes("not available")) return null;
  if (nights <= 0) return null;

  const isActive        = checkin <= today && today < checkout;
  const isCheckoutToday = today.getTime() === checkout.getTime();
  if (!isActive && !isCheckoutToday) return null;

  const source = SOURCE_MAP[feed.source];
  const status = deriveStatus(checkin, checkout, today);

  return {
    id:               `ical-${uid}`,
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
    _checkinRaw:   dtstart,
    _checkoutRaw:  dtend,
    _isActiveRaw:  isActive,
  };
}

/* ── Fetch + parse one feed (browser only) ───────────────────────── */
export async function fetchFeed(feed: FeedConfig): Promise<Booking[]> {
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
      .map((e) => normalizeEvent(feed, e.uid, e.dtstart, e.dtend, e.summary ?? "", today))
      .filter((b): b is Booking => b !== null);
  } catch (err) {
    console.warn(`[iCal] Failed to fetch ${feed.apartment} (${feed.source}):`, err);
    return [];
  }
}

/* ── Fetch all feeds, merge, deduplicate ─────────────────────────── */
export async function fetchAllBookings(feeds: FeedConfig[]): Promise<{
  bookings: Booking[];
  errors:   string[];
}> {
  const results = await Promise.allSettled(
    feeds.map((f) => fetchFeed(f)),
  );

  const bookings: Booking[] = [];
  const errors:   string[]  = [];
  const seen = new Set<string>();

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
      bookings.push(b);
    }
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
        id:           `future-${e.uid}`,
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

  future.sort((a, b) => a.arrival.localeCompare(b.arrival));
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