/**
 * functions/api/cleaning/[token].ts
 *
 * Nyilvános, token-alapú takarítói oldal — bejelentkezés nélkül használható.
 * Minden apartmannak van egy saját, titkos linkje
 * (apartments.cleaning_token), amit a szállásadó a takarítónak
 * ad oda. Ezen az oldalon a takarító csak az adott apartman
 * soron következő takarításait látja, és egy kattintással
 * jelölheti "Elvégezve"-ként — a szállásadó a Supabase Realtime miatt
 * azonnal látja a változást a saját műszerfalán.
 *
 * Ez a function a Supabase SERVICE ROLE KEY-t használja (szerver-titkos,
 * soha nincs a kliens-bundle-ban), mert a takarító nincs bejelentkezve,
 * ist und die normalen RLS-Policies (an auth.uid() gebunden) hier nicht
 * érvényesülnének.
 */

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const SUPABASE_URL = "https://iptsxjlrqjbgealxgbux.supabase.co";
const CLEANING_WINDOW_DAYS = 14; // mennyire visszamenőleg keressünk el nem végzett takarításokat

/* ── Minimaler, in sich geschlossener iCal-Parser (Server-Seite) ──── */
interface RawEvent {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
}

function parseIcal(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  let current: Partial<RawEvent> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") { current = {}; continue; }
    if (line === "END:VEVENT") {
      if (current?.uid && current.dtstart && current.dtend) events.push(current as RawEvent);
      current = null;
      continue;
    }
    if (!current) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const propRaw = line.slice(0, colonIdx).toUpperCase();
    const value = line.slice(colonIdx + 1).trim();
    const prop = propRaw.split(";")[0];
    switch (prop) {
      case "UID":     current.uid = value; break;
      case "DTSTART": current.dtstart = value; break;
      case "DTEND":   current.dtend = value; break;
      case "SUMMARY": current.summary = value.replace(/\\,/g, ",").replace(/\\n/g, " "); break;
    }
  }
  return events;
}

function parseIcalDate(s: string): Date {
  const d = s.replace(/T.*$/, "");
  return new Date(Date.UTC(
    parseInt(d.slice(0, 4), 10),
    parseInt(d.slice(4, 6), 10) - 1,
    parseInt(d.slice(6, 8), 10),
  ));
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("hu-HU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/* ── Supabase REST helpers (service role — full access, used server-side only) ── */
async function sbSelect(env: Env, table: string, query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

async function sbUpsert(env: Env, table: string, body: unknown, onConflict: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

/* ── Lookup: token → apartment ──────────────────────────────────── */
async function findApartment(env: Env, token: string) {
  const rows = await sbSelect(
    env,
    "apartments",
    `cleaning_token=eq.${encodeURIComponent(token)}&select=id,name,user_id&limit=1`,
  );
  return rows[0] ?? null;
}

/* ── Pending cleaning items for one apartment ───────────────────── */
interface PendingItem {
  bookingId: string;
  checkoutDate: Date;
  source: string;
}

// Ugyanaz a prioritási sorrend, mint a fő alkalmazásban (icalBookings.ts) —
// ha ugyanaz a kijelentkezés (checkout) két forrásból is megjelenik
// (mert a foglalás mindkét platformra szinkronizálva van), csak a
// magasabb prioritású forrás tételét tartjuk meg, hogy a takarító
// ne lássa kétszer ugyanazt a takarítási feladatot.
const SOURCE_PRIORITY: Record<string, number> = {
  airbnb: 0, booking: 1, vrbo: 2, tripadvisor: 3, expedia: 4, google: 5, szallas: 6,
};

async function getPendingCleanings(env: Env, apartmentId: string, apartmentName: string, userId: string): Promise<PendingItem[]> {
  const feeds = await sbSelect(env, "ical_feeds", `apartment_id=eq.${apartmentId}&select=source,url`);
  const today = todayUTC();
  const windowStart = new Date(today);
  windowStart.setUTCDate(windowStart.getUTCDate() - CLEANING_WINDOW_DAYS);

  const candidates: PendingItem[] = [];

  for (const feed of feeds) {
    let text: string;
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ApartmentAssistant/1.0)" } });
      if (!res.ok) continue;
      text = await res.text();
    } catch {
      continue;
    }

    for (const ev of parseIcal(text)) {
      if (/not available/i.test(ev.summary ?? "")) continue; // blokkoló bejegyzés (Airbnb, Szállás.hu stb.)
      const checkout = parseIcalDate(ev.dtend);
      if (checkout > today || checkout < windowStart) continue;

      const stableKey = `${apartmentName}::${ev.dtend.replace(/T.*$/, "")}::${feed.source}`;
      candidates.push({ bookingId: `ical-${stableKey}`, checkoutDate: checkout, source: feed.source });
    }
  }

  if (candidates.length === 0) return [];

  // Több forrásból (pl. Airbnb ÉS Szállás.hu) ugyanarra a napra eső
  // kijelentkezést csak egyszer tartjuk meg — a magasabb prioritású
  // forrásét —, hogy ne jelenjen meg duplikált takarítási tétel.
  const byCheckoutDate = new Map<string, PendingItem>();
  for (const c of candidates) {
    const dayKey = c.checkoutDate.toISOString().slice(0, 10);
    const existing = byCheckoutDate.get(dayKey);
    if (!existing) {
      byCheckoutDate.set(dayKey, c);
      continue;
    }
    const myPrio = SOURCE_PRIORITY[c.source] ?? 99;
    const otherPrio = SOURCE_PRIORITY[existing.source] ?? 99;
    if (myPrio < otherPrio) byCheckoutDate.set(dayKey, c);
  }
  const dedupedCandidates = Array.from(byCheckoutDate.values());

  const ids = dedupedCandidates.map((c) => `"${c.bookingId}"`).join(",");
  const details = await sbSelect(
    env,
    "detail_states",
    `user_id=eq.${userId}&booking_id=in.(${ids})&select=booking_id,cleaning_done`,
  );
  const doneSet = new Set(details.filter((d) => d.cleaning_done).map((d) => d.booking_id));

  return dedupedCandidates
    .filter((c) => !doneSet.has(c.bookingId))
    .sort((a, b) => a.checkoutDate.getTime() - b.checkoutDate.getTime());
}

/* ── HTML rendering ──────────────────────────────────────────────── */
function page(title: string, body: string, token?: string): string {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${token ? `<link rel="manifest" href="/api/cleaning/${token}/manifest.json">` : ""}
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${title}">
<link rel="apple-touch-icon" href="https://app.apartmanassistant.hu/icon-192.png">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px 16px 48px; min-height: 100dvh;
    background: #1C2422; color: #F4F0E8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .wrap { max-width: 480px; margin: 0 auto; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .sub { font-size: 13px; color: #C8D4D0; margin: 0 0 24px; }
  .card {
    background: rgb(38 46 44 / 0.6); border: 1px solid rgb(86 176 187 / 0.25);
    border-radius: 16px; padding: 18px; margin-bottom: 12px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .card .date { font-size: 14px; font-weight: 600; }
  .card .label { font-size: 12px; color: #C8D4D0; margin-top: 2px; }
  button {
    background: rgb(86 176 187 / 0.20); color: #7dd4dd;
    border: 1px solid rgb(86 176 187 / 0.45); border-radius: 10px;
    padding: 10px 18px; font-size: 14px; font-weight: 700;
    cursor: pointer;
  }
  button:active { background: rgb(86 176 187 / 0.35); }
  .empty {
    text-align: center; padding: 48px 16px; color: #C8D4D0; font-size: 14px;
  }
  .empty .check { font-size: 32px; margin-bottom: 12px; }
  .error { text-align: center; padding: 64px 16px; color: #F0D4C0; }
  .install-tip {
    background: rgb(217 171 78 / 0.10); border: 1px solid rgb(217 171 78 / 0.30);
    border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px;
  }
  .install-tip summary { color: #ddb055; font-weight: 700; cursor: pointer; list-style: none; }
  .install-tip summary::-webkit-details-marker { display: none; }
  .install-tip summary::after { content: " ▾"; }
  .install-tip[open] summary::after { content: " ▴"; }
  .install-tip p { color: #C8D4D0; margin: 10px 0 0; line-height: 1.6; }
  .install-tip strong { color: #F4F0E8; }
</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

function installTip(): string {
  return `
    <details class="install-tip">
      <summary>📲 Ez az oldal mentése a telefonra</summary>
      <p><strong>Android (Chrome):</strong> jobb felül a három pontra koppintva válaszd a „Hozzáadás a kezdőképernyőhöz" opciót.</p>
      <p><strong>iPhone (Safari):</strong> lent a megosztás ikonra koppintva válaszd a „Kezdőképernyőhöz adás" opciót.</p>
      <p>Ezután egy saját ikon jelenik meg az apartman nevével — nem kell többé WhatsAppban keresgélni.</p>
    </details>`;
}

function renderList(apartmentName: string, items: PendingItem[]): string {
  if (items.length === 0) {
    return `
      ${installTip()}
      <h1>${apartmentName}</h1>
      <p class="sub">Takarítás</p>
      <div class="empty">
        <div class="check">✓</div>
        Jelenleg nincs takarítanivaló.
      </div>`;
  }
  const cards = items.map((it) => `
    <form method="POST" class="card">
      <input type="hidden" name="bookingId" value="${it.bookingId}">
      <div>
        <div class="date">Távozás: ${fmtDate(it.checkoutDate)}</div>
        <div class="label">Takarítás szükséges</div>
      </div>
      <button type="submit">Elvégezve</button>
    </form>`).join("");
  return `
    ${installTip()}
    <h1>${apartmentName}</h1>
    <p class="sub">${items.length} ${items.length === 1 ? "takarítás van hátra" : "takarítás van hátra"}</p>
    ${cards}`;
}

/* ── Request handlers ────────────────────────────────────────────── */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const token = params.token as string;
  const apt = await findApartment(env, token);
  if (!apt) {
    return new Response(page("Érvénytelen link", `<div class="error">Ez a link érvénytelen vagy törölve lett.</div>`), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const items = await getPendingCleanings(env, apt.id, apt.name, apt.user_id);
  return new Response(page(apt.name, renderList(apt.name, items), token), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request }) => {
  const token = params.token as string;
  const apt = await findApartment(env, token);
  if (!apt) {
    return new Response(page("Érvénytelen link", `<div class="error">Ez a link érvénytelen vagy törölve lett.</div>`), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const form = await request.formData();
  const bookingId = String(form.get("bookingId") ?? "");

  // Sicherheitscheck: die booking_id muss zu dieser Ferienwohnung gehören.
  if (bookingId.startsWith(`ical-${apt.name}::`)) {
    await sbUpsert(env, "detail_states", {
      user_id: apt.user_id,
      booking_id: bookingId,
      cleaning_done: true,
    }, "user_id,booking_id");
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/api/cleaning/${token}` },
  });
};
