/**
 * api/ical.ts — Vercel serverless proxy
 *
 * Fetches an iCal URL server-side (no CORS) and returns the raw text.
 * Usage: GET /api/ical?url=https%3A%2F%2Fszallas.hu%2F...
 *
 * Security: only szallas.hu and airbnb.hu origins are allowed.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "szallas.hu",
  "airbnb.com",
  "airbnb.hu",
  "booking.com",
  "google.com",       // Google Naptár
  "calendar.google.com",
  "vrbo.com",
  "homeaway.com",
  "tripadvisor.com",
  "expedia.com",
  "githubusercontent.com",
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_ORIGINS.some((o) => hostname === o || hostname.endsWith(`.${o}`));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query["url"];
  const targetUrl = Array.isArray(raw) ? raw[0] : raw;

  if (!targetUrl) {
    return res.status(400).send("Missing ?url= parameter");
  }
  if (!isAllowed(targetUrl)) {
    return res.status(403).send("Domain not allowed");
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ApartmanAssistant/1.0)",
        "Accept": "text/calendar, */*",
      },
    });

    const text = await upstream.text();

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=5");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(502).send(`Upstream fetch failed: ${String(err)}`);
  }
}
