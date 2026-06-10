/**
 * DiagScreen — IDEIGLENES DIAGNOSZTIKA
 * Feed-szintű ellenőrzés: minden iCal URL-t külön tesztel.
 */

import { Component, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { FEEDS } from "../data/icalFeeds";
import { parseIcal, parseIcalDate, todayUTC, daysBetween } from "../data/icalFeeds";
import type { IcalState } from "../data/useIcalBookings";

/* ── Error boundary ─────────────────────────────────────────────── */
interface EBState { error: string | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: unknown) { return { error: String(e) }; }
  render() {
    if (this.state.error) return (
      <div style={{ background: "#fee2e2", padding: 16, borderRadius: 8, fontFamily: "monospace" }}>
        <strong>💥 Render hiba:</strong>
        <pre style={{ marginTop: 8, fontSize: 11, whiteSpace: "pre-wrap" }}>{this.state.error}</pre>
      </div>
    );
    return this.props.children;
  }
}

/* ── Types ──────────────────────────────────────────────────────── */
type FeedResult =
  | { state: "pending" }
  | { state: "loading" }
  | { state: "ok";    totalEvents: number; todayEvents: number; summary: string[] }
  | { state: "error"; httpStatus?: number; message: string };

/* ── Feed tester ────────────────────────────────────────────────── */
async function probeFeed(url: string): Promise<FeedResult> {
  const today = todayUTC();
  try {
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "text/calendar" } });
    if (!res.ok) return { state: "error", httpStatus: res.status, message: `HTTP ${res.status} ${res.statusText}` };
    const text = await res.text();

    if (!text.includes("BEGIN:VCALENDAR")) {
      return { state: "error", message: `Nem iCal formátum. Első 200 karakter: ${text.slice(0, 200)}` };
    }

    const events = parseIcal(text);
    const today0 = today.getTime();

    const todayEvents = events.filter(e => {
      try {
        const ci = parseIcalDate(e.dtstart);
        const co = parseIcalDate(e.dtend);
        const nights = daysBetween(ci, co);
        if (nights <= 0) return false;
        // include: active (ci <= today < co) OR checkout today
        return (ci.getTime() <= today0 && today0 < co.getTime()) ||
               co.getTime() === today0;
      } catch { return false; }
    });

    return {
      state: "ok",
      totalEvents: events.length,
      todayEvents: todayEvents.length,
      summary: todayEvents.map(e => {
        const ci = parseIcalDate(e.dtstart);
        const co = parseIcalDate(e.dtend);
        return `${e.dtstart}→${e.dtend} | "${e.summary}" | ${daysBetween(ci,co)} éj`;
      }),
    };
  } catch (err) {
    return { state: "error", message: String(err) };
  }
}

/* ── State colour helpers ───────────────────────────────────────── */
const STATE_BG: Record<string, string> = {
  pending: "#f1f5f9",
  loading: "#fef9c3",
  ok:      "#f0fdf4",
  error:   "#fef2f2",
};
const STATE_LABEL: Record<string, string> = {
  pending: "⏳ várakozás",
  loading: "⏳ töltés…",
  ok:      "✅ OK",
  error:   "❌ HIBA",
};

/* ── Main content ───────────────────────────────────────────────── */
function DiagContent({ ical }: { ical: IcalState }) {
  const [results, setResults] = useState<FeedResult[]>(
    FEEDS.map(() => ({ state: "pending" as const }))
  );
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults(FEEDS.map(() => ({ state: "loading" as const })));
    const out: FeedResult[] = await Promise.all(FEEDS.map(f => probeFeed(f.url)));
    setResults(out);
    setRunning(false);
  }

  useEffect(() => { runAll(); }, []);

  const okCount    = results.filter(r => r.state === "ok").length;
  const errorCount = results.filter(r => r.state === "error").length;
  const totalToday = results.reduce((s, r) => s + (r.state === "ok" ? r.todayEvents : 0), 0);

  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{ background: "#0f172a", color: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>🔬 DIAGNOSZTIKA — Feed teszt</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          App státusz: <strong style={{ color: ical.status === "success" ? "#86efac" : "#fde68a" }}>{ical.status}</strong>
          {"  |  "}
          App rekord: <strong style={{ color: "#fff" }}>{ical.bookings.length}</strong>
          {"  |  "}
          Feed: {running
            ? <span style={{ color: "#fde68a" }}>futás…</span>
            : <span><span style={{ color: "#86efac" }}>{okCount} OK</span> / <span style={{ color: "#f87171" }}>{errorCount} hiba</span></span>
          }
          {"  |  "}
          Mai rekord összesen: <strong style={{ color: totalToday > 0 ? "#86efac" : "#f87171" }}>{totalToday}</strong>
        </div>
        <button
          onClick={runAll}
          disabled={running}
          style={{ marginTop: 8, background: "#334155", color: "#f8fafc", border: "none", borderRadius: 4, padding: "3px 12px", cursor: "pointer", fontSize: 12 }}
        >
          {running ? "⏳ Fut…" : "↻ Újra tesztel"}
        </button>
      </div>

      {/* ── App-level errors from useIcalBookings ── */}
      {ical.errors.length > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, padding: "8px 10px", marginBottom: 12 }}>
          <strong>App-szintű hibák (useIcalBookings.errors):</strong>
          <ul style={{ margin: "4px 0 0 16px" }}>
            {ical.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── Per-feed rows ── */}
      {FEEDS.map((feed, i) => {
        const r = results[i];
        return (
          <div key={i} style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 8,
            overflow: "hidden",
          }}>
            {/* row header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              padding: "6px 10px",
              background: STATE_BG[r.state] ?? "#f1f5f9",
              borderBottom: r.state === "pending" || r.state === "loading" ? "none" : "1px solid #e2e8f0",
            }}>
              <span style={{ fontWeight: 700 }}>{feed.apartment}</span>
              <span style={{ color: "#64748b", fontSize: 11 }}>{feed.source}</span>
              <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: 12 }}>{STATE_LABEL[r.state]}</span>
            </div>

            {/* detail */}
            {r.state === "ok" && (
              <div style={{ padding: "6px 10px", fontSize: 12, lineHeight: 1.8 }}>
                <div>
                  Összes esemény a feedben: <strong>{r.totalEvents}</strong>
                  {"  |  "}
                  Mai dátumot érintő: <strong style={{ color: r.todayEvents > 0 ? "#16a34a" : "#dc2626" }}>
                    {r.todayEvents}
                  </strong>
                </div>
                {r.todayEvents === 0 && (
                  <div style={{ color: "#92400e", background: "#fef3c7", padding: "3px 6px", borderRadius: 4, marginTop: 4 }}>
                    ⚠ Nincs mai esemény — vagy nincs aktív foglalás, vagy a dátumszűrő kizárja őket.
                  </div>
                )}
                {r.summary.map((s, j) => (
                  <div key={j} style={{ color: "#475569", paddingLeft: 8, borderLeft: "2px solid #86efac", marginTop: 3 }}>
                    {s}
                  </div>
                ))}
              </div>
            )}

            {r.state === "error" && (
              <div style={{ padding: "6px 10px", fontSize: 12 }}>
                {r.httpStatus && (
                  <div>HTTP státusz: <strong style={{ color: "#dc2626" }}>{r.httpStatus}</strong></div>
                )}
                <div style={{ color: "#dc2626", wordBreak: "break-all", marginTop: 2 }}>
                  {r.message}
                </div>
                <div style={{ color: "#64748b", marginTop: 4, fontSize: 11 }}>
                  URL: <span style={{ wordBreak: "break-all" }}>{feed.url}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}


      {/* ── Status debug table ── */}
      <StatusDebugTable bookings={ical.bookings} />

      <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 16 }}>
        ⚠️ Ideiglenes diagnosztikai képernyő.
      </p>
    </div>
  );
}

/* ── Status debug table ─────────────────────────────────────────── */
import type { Booking } from "../data/mockData";

const STATUS_COLOR: Record<string, string> = {
  arriving:  "#fde68a",
  departing: "#99f6e4",
  staying:   "#bbf7d0",
};

function recomputeStatus(
  checkinRaw: string,
  checkoutRaw: string,
): { checkin: Date; checkout: Date; today: Date; status: string; isActive: boolean; isCheckoutToday: boolean } {
  const today    = todayUTC();
  const checkin  = parseIcalDate(checkinRaw);
  const checkout = parseIcalDate(checkoutRaw);
  const t = today.getTime();
  const ci = checkin.getTime();
  const co = checkout.getTime();
  const isActive        = ci <= t && t < co;
  const isCheckoutToday = t === co;
  let status = "outside";
  if (t === ci)          status = "arriving";
  else if (t === co)     status = "departing";
  else if (ci < t && t < co) status = "staying";
  return { checkin, checkout, today, status, isActive, isCheckoutToday };
}

function fmt(d: Date): string {
  return d.toISOString().replace("T00:00:00.000Z", "");
}

function StatusDebugTable({ bookings }: { bookings: Booking[] }) {
  const today = todayUTC();

  return (
    <div style={{ marginTop: 16, borderTop: "2px solid #334155", paddingTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        📋 Státusz debug — {bookings.length} rekord
      </div>
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 12 }}>
        <strong>today (todayUTC):</strong> {fmt(today)}
        {"  |  "}
        <strong>Local time:</strong> {new Date().toLocaleString("hu-HU")}
        {"  |  "}
        <strong>UTC now:</strong> {new Date().toUTCString()}
      </div>

      {bookings.length === 0 && (
        <div style={{ color: "#dc2626" }}>⚠ Nincs rekord az app memóriában.</div>
      )}

      {bookings.map((b, i) => {
        const raw = b._checkinRaw && b._checkoutRaw
          ? recomputeStatus(b._checkinRaw, b._checkoutRaw)
          : null;

        const statusMatch = raw ? raw.status === b.status : null;

        return (
          <div key={i} style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 8,
            overflow: "hidden",
            fontSize: 12,
          }}>
            {/* header */}
            <div style={{
              display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
              padding: "5px 10px",
              background: STATUS_COLOR[b.status] ?? "#f1f5f9",
            }}>
              <strong>#{i+1} {b.apartment}</strong>
              <span style={{ color: "#64748b" }}>{b.source}</span>
              <span style={{
                fontWeight: 700,
                color: b.status === "arriving" ? "#78350f" : b.status === "staying" ? "#14532d" : "#134e4a",
              }}>
                APP STATUS: {b.status}
              </span>
              {statusMatch === false && (
                <span style={{ background: "#dc2626", color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>
                  ⚠ ELTÉRÉS
                </span>
              )}
            </div>

            {/* grid */}
            <div style={{ padding: "6px 10px", display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 2 }}>
              <span style={{ color: "#64748b" }}>checkinRaw:</span>
              <span style={{ fontWeight: 600 }}>{b._checkinRaw ?? "—"}</span>

              <span style={{ color: "#64748b" }}>checkoutRaw:</span>
              <span style={{ fontWeight: 600 }}>{b._checkoutRaw ?? "—"}</span>

              {raw && (<>
                <span style={{ color: "#64748b" }}>checkin (parsed):</span>
                <span>{fmt(raw.checkin)}</span>

                <span style={{ color: "#64748b" }}>checkout (parsed):</span>
                <span>{fmt(raw.checkout)}</span>

                <span style={{ color: "#64748b" }}>today:</span>
                <span>{fmt(raw.today)}</span>

                <span style={{ color: "#64748b" }}>today == checkin:</span>
                <span style={{ color: raw.today.getTime() === raw.checkin.getTime() ? "#16a34a" : "#94a3b8", fontWeight: raw.today.getTime() === raw.checkin.getTime() ? 700 : 400 }}>
                  {String(raw.today.getTime() === raw.checkin.getTime())}
                </span>

                <span style={{ color: "#64748b" }}>today == checkout:</span>
                <span style={{ color: raw.isCheckoutToday ? "#0891b2" : "#94a3b8", fontWeight: raw.isCheckoutToday ? 700 : 400 }}>
                  {String(raw.isCheckoutToday)}
                </span>

                <span style={{ color: "#64748b" }}>isActive (ci&lt;=t&lt;co):</span>
                <span style={{ color: raw.isActive ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                  {String(raw.isActive)}
                  {!raw.isActive && !raw.isCheckoutToday && " ← MIÉRT LÁTSZIK?"}
                </span>

                <span style={{ color: "#64748b" }}>recomputed status:</span>
                <span style={{
                  fontWeight: 700,
                  color: statusMatch ? "#16a34a" : "#dc2626",
                }}>
                  {raw.status} {statusMatch ? "✓" : `← APP: ${b.status}`}
                </span>
              </>)}

              <span style={{ color: "#64748b" }}>summary:</span>
              <span style={{ color: "#475569" }}>{b._summary || "(üres)"}</span>

              <span style={{ color: "#64748b" }}>isTodayArrival:</span>
              <span style={{ color: b.isTodayArrival ? "#16a34a" : "#94a3b8" }}>{String(b.isTodayArrival)}</span>

              <span style={{ color: "#64748b" }}>isTodayDeparture:</span>
              <span style={{ color: b.isTodayDeparture ? "#0891b2" : "#94a3b8" }}>{String(b.isTodayDeparture)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DiagScreen({ ical }: { ical: IcalState }) {
  return (
    <ErrorBoundary>
      <DiagContent ical={ical} />
    </ErrorBoundary>
  );
}
