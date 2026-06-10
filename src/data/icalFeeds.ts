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
export function proxy(url: string): string {
  return `/api/ical?url=${encodeURIComponent(url)}`;
}

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
