/**
 * icalFeeds.ts — feed registry and pure iCal parser.
 *
 * READ-ONLY. This module NEVER writes to any external platform.
 * It only consumes calendar data.
 */

import type { ApartmentAccent } from "./mockData";

/* ── Feed registry ───────────────────────────────────────────────── */
export type FeedSource = "szallas" | "airbnb" | "booking" | "google" | "vrbo" | "tripadvisor" | "expedia";

export interface FeedConfig {
  apartment: string;          /* Display name */
  accent: ApartmentAccent;
  source: FeedSource;
  url: string;
}

/** Wrap an external iCal URL through the local/Vercel proxy to avoid CORS. */
function proxy(url: string): string {
  return `/api/ical?url=${encodeURIComponent(url)}`;
}

export const FEEDS: FeedConfig[] = [
  /* Kalóz */
  {
    apartment: "Kalóz",
    accent: "coral",
    source: "szallas",
    url: proxy("https://szallas.hu/ical-sync/export/get-calendar?token=22936353ad6073e2f00d178e6673aa24469aeea76a254e10ec833c13f233f461"),
  },
  {
    apartment: "Kalóz",
    accent: "coral",
    source: "airbnb",
    url: proxy("https://www.airbnb.hu/calendar/ical/1593554080580747375.ics?t=4c13cbc7331c445a9045e83bf6b21e1d"),
  },
  /* Dingi */
  {
    apartment: "Dingi",
    accent: "sky",
    source: "szallas",
    url: proxy("https://szallas.hu/ical-sync/export/get-calendar?token=96e065ec3af6f01043b432ae3209d67501d2fd22da7f9839172f298c5e95fd9d"),
  },
  {
    apartment: "Dingi",
    accent: "sky",
    source: "airbnb",
    url: proxy("https://www.airbnb.hu/calendar/ical/1486079672099298069.ics?t=a3ba0097f370489da1fd4930bd45e127"),
  },
  /* Fregatt */
  {
    apartment: "Fregatt",
    accent: "sage",
    source: "szallas",
    url: proxy("https://szallas.hu/ical-sync/export/get-calendar?token=cc6242ab3972233cb8bb243c1c08104b5cd39fcc97afb38e8ff1236347d502f1"),
  },
  {
    apartment: "Fregatt",
    accent: "sage",
    source: "airbnb",
    url: proxy("https://www.airbnb.hu/calendar/ical/1595715014963692300.ics?t=d9a07a1d342c43faad4d6497097b58bb"),
  },
  /* Korvett */
  {
    apartment: "Korvett",
    accent: "lavender",
    source: "szallas",
    url: proxy("https://szallas.hu/ical-sync/export/get-calendar?token=19c67fb842ff840c127463c7ed91e4496cc9cb9eb524e7da8038de31d88f0a78"),
  },
  {
    apartment: "Korvett",
    accent: "lavender",
    source: "airbnb",
    url: proxy("https://www.airbnb.hu/calendar/ical/1594258848235738212.ics?t=d437bfed178045f79f8d635de9a83e09"),
  },
  /* Schooner */
  {
    apartment: "Schooner",
    accent: "amber",
    source: "szallas",
    url: proxy("https://szallas.hu/ical-sync/export/get-calendar?token=fb909c220a55d128b9cacd4552a66bf2f5b87d524fa1bc77d60390bb97c84147"),
  },
  {
    apartment: "Schooner",
    accent: "amber",
    source: "airbnb",
    url: proxy("https://www.airbnb.hu/calendar/ical/1597866548803099081.ics?t=2b15b0d43d7144efb6d782fc2c7bca1c"),
  },
];

/* ── Parsed iCal event (raw, before normalization) ───────────────── */
interface RawEvent {
  uid:       string;
  dtstart:   string;   /* "20260528" or "20260528T140000Z" */
  dtend:     string;
  summary:   string;
  dtstamp:   string;
}

/* ── Pure iCal text parser ───────────────────────────────────────── */
export function parseIcal(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  /* Unfold lines: iCal wraps long lines with \r\n + space/tab */
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  let current: Partial<RawEvent> | null = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.uid && current.dtstart && current.dtend) {
        events.push(current as RawEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    /* Property name may have parameters: "DTSTART;VALUE=DATE:20260528" */
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const propRaw = line.slice(0, colonIdx).toUpperCase();
    const value   = line.slice(colonIdx + 1).trim();

    /* Strip parameters — "DTSTART;VALUE=DATE" → "DTSTART" */
    const prop = propRaw.split(";")[0];

    switch (prop) {
      case "UID":     current.uid     = value; break;
      case "DTSTART": current.dtstart = value; break;
      case "DTEND":   current.dtend   = value; break;
      case "SUMMARY": current.summary = value.replace(/\\,/g, ",").replace(/\\n/g, " "); break;
      case "DTSTAMP": current.dtstamp = value; break;
    }
  }

  return events;
}

/* ── Date helpers ────────────────────────────────────────────────── */

/** "20260528" or "20260528T140000Z" → Date at midnight UTC */
export function parseIcalDate(s: string): Date {
  const d = s.replace(/T.*$/, ""); /* strip time component */
  return new Date(
    Date.UTC(
      parseInt(d.slice(0, 4), 10),
      parseInt(d.slice(4, 6), 10) - 1,
      parseInt(d.slice(6, 8), 10),
    ),
  );
}

/** Format Date as "máj. 28." in hu locale */
export function formatHu(d: Date): string {
  return d.toLocaleDateString("hu-HU", {
    month: "short",
    day:   "numeric",
    timeZone: "UTC",
  });
}

/** Days between two dates (integer) */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Today at midnight UTC */
export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
