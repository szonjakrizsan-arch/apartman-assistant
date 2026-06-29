import { useState, useEffect, useRef } from "react";
import {
  X, CalendarDays, ArrowRight, Moon, Check, AlertTriangle,
  Sparkles, StickyNote, Phone, User, Plus, Pencil,
  ClipboardCheck, Mail,
} from "lucide-react";
import type { Booking } from "../data/mockData";
import { accentStyles, sourceStyles } from "../lib/theme";
import type { PaymentData, PaymentMethod } from "../data/appState";
import { methodLabel, parseAmount, remainingAmount, formatFt } from "../data/appState";


/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  primary:     "#F4F0E8",
  secondary:   "#C8D4D0",
  placeholder: "#8FA89E",
} as const;

const TEAL = {
  line:   "rgb(86 176 187 / 0.35)",
  border: "rgb(86 176 187 / 0.22)",
  glow:   "rgb(86 176 187 / 0.45)",
  dim:    "rgb(86 176 187 / 0.12)",
} as const;

const CORAL = {
  bg:   "rgb(220 132 96 / 0.16)",
  ring: "rgb(220 132 96 / 0.35)",
  text: "#F0D4C0",
  glow: "0 0 0 1px rgb(220 132 96 / 0.35), 0 0 8px rgb(220 132 96 / 0.12)",
} as const;

const GREEN = {
  bg:     "rgb(90 191 138 / 0.08)",
  border: "rgb(90 191 138 / 0.28)",
  text:   "#5abf8a",
  ring:   "rgb(90 191 138 / 0.55)",
} as const;

/* ─── Per-booking detail state ─────────────────────────────────── */
export interface BookingDetailState {
  cleaningDone: boolean;
  note: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactNote: string;
  /* arrival prep checklist — manual items */
  keyReady:    boolean;
  checkinSent: boolean;
  ntakDone:    boolean;
}

export function makeEmptyDetailState(): BookingDetailState {
  return {
    cleaningDone: false,
    note: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactNote: "",
    keyReady:     false,
    checkinSent:  false,
    ntakDone:     false,
  };
}

interface Props {
  booking: Booking | null;
  onClose: () => void;
  payment: PaymentData;
  onPaymentChange: (next: PaymentData) => void;
  detail: BookingDetailState;
  onDetailChange: (next: BookingDetailState) => void;
  prevCleaningDone?: boolean;
}

/* ─── DrawerSection header ──────────────────────────────────────── */
function DrawerSection({
  label, icon, allDone = false,
}: {
  label: string;
  icon: React.ReactNode;
  allDone?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span style={{ color: allDone ? GREEN.text : T.secondary }}>{icon}</span>
      <span
        className="text-[11px] font-bold uppercase tracking-widest transition-soft"
        style={{ color: allDone ? GREEN.text : T.secondary }}
      >
        {label}
      </span>
      {allDone && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: "rgb(90 191 138 / 0.14)", color: GREEN.text }}
        >
          Kész
        </span>
      )}
      <div
        className="flex-1"
        style={{
          height: "1px",
          background: allDone
            ? `linear-gradient(90deg, ${GREEN.ring}, transparent)`
            : `linear-gradient(90deg, ${TEAL.line}, transparent)`,
        }}
        aria-hidden
      />
    </div>
  );
}

/* ─── CoralBtn ──────────────────────────────────────────────────── */
function CoralBtn({ onClick, children, className = "" }: {
  onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-soft ${className}`}
      style={{ background: CORAL.bg, color: CORAL.text, boxShadow: CORAL.glow }}
    >
      {children}
    </button>
  );
}

/* ─── Arrival checklist row ─────────────────────────────────────── */
interface CheckRowProps {
  done: boolean;
  label: string;
  sublabel: string;
  readOnly?: boolean;       // derived from parent state — no toggle
  onToggle?: () => void;
  isLast?: boolean;
}

function ArrivalCheckRow({ done, label, sublabel, readOnly = false, onToggle, isLast = false }: CheckRowProps) {
  const inner = (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={isLast ? {} : { borderBottom: `1px solid ${TEAL.dim}` }}
    >
      {/* Checkbox circle */}
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-soft"
        style={
          done
            ? { background: "rgb(90 191 138 / 0.20)", outline: `1.5px solid ${GREEN.ring}` }
            : { background: "transparent", outline: `1.5px solid ${TEAL.border}` }
        }
        aria-hidden
      >
        {done && <Check className="h-3 w-3" style={{ color: GREEN.text }} strokeWidth={2.5} />}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium leading-snug transition-soft"
          style={{
            color: done ? GREEN.text : T.primary,
            opacity: done ? 0.75 : 1,
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: "rgb(90 191 138 / 0.35)",
          }}
        >
          {label}
        </p>
        <p className="text-[11px] leading-tight mt-0.5" style={{ color: T.secondary }}>
          {sublabel}
        </p>
      </div>

      {/* Right badge */}
      {readOnly ? (
        <span
          className="shrink-0 text-[10px] font-semibold"
          style={{ color: done ? GREEN.text : "rgb(86 176 187 / 0.50)" }}
          title="Automatikusan szinkronizált"
        >
          {done ? "✓" : "—"}
        </span>
      ) : (
        done && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgb(90 191 138 / 0.14)", color: GREEN.text }}
          >
            Kész
          </span>
        )
      )}
    </div>
  );

  if (readOnly) {
    return (
      <div
        role="status"
        aria-label={`${label}: ${done ? "teljesítve" : "nincs teljesítve"}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="pressable w-full text-left transition-soft"
      aria-label={`${label} — ${done ? "kész, koppints a visszaállításhoz" : "koppints a teljesítéshez"}`}
    >
      {inner}
    </button>
  );
}

/* ─── Input style ───────────────────────────────────────────────── */
const inputCls = "w-full rounded-lg border px-3 py-2 text-[13px] bg-[#1a2220] transition-soft focus:outline-none";
const inputStyle = { color: T.primary, borderColor: TEAL.border } as React.CSSProperties;

/* ─── Main component ────────────────────────────────────────────── */
export function BookingDetailDrawer({
  booking, onClose, payment, onPaymentChange, detail, onDetailChange, prevCleaningDone,
}: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [contactEditMode, setContactEditMode] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booking) { setNoteOpen(detail.note.length > 0); setContactEditMode(false); }
  }, [booking?.id]);

useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
 
  if (!booking) return null;

  const accent = accentStyles[booking.accent];
  const source = sourceStyles[booking.source];
  const isArriving  = booking.status === "arriving";
  const isDeparting = booking.status === "departing";
  const hasContact  = detail.contactName || detail.contactPhone;

  const stripeColor =
    booking.isTodayArrival    ? "#dc8460"
    : booking.isTodayDeparture ? "#56b0bb"
    : undefined;

  /* ── Arrival prep derived state ── */
  // cleaningSync: if a linked departing booking exists, use its cleaningDone
  // (prevCleaningDone). Falls back to this booking's own cleaningDone (e.g. same
  // booking is both departing today and arriving — edge case).
  const cleaningSync = prevCleaningDone !== undefined ? prevCleaningDone : detail.cleaningDone;
  const paymentPaid  = payment.status === "paid";

  const arrivalItems = [
    { done: cleaningSync,       readOnly: true  },
    { done: paymentPaid,        readOnly: true  },
    { done: detail.keyReady,    readOnly: false },
    { done: detail.checkinSent, readOnly: false },
  ];
  const arrivalAllDone = arrivalItems.every((i) => i.done);
  const arrivalDoneCount = arrivalItems.filter((i) => i.done).length;

  return (
 <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:px-4"
      style={{
        background: "rgb(0 0 0 / 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      aria-modal="true"
      role="dialog"
      aria-label={`${booking.apartment} részletei`}
    >
      <div
        ref={drawerRef}
        className="relative flex w-full flex-col rounded-t-3xl sm:max-w-lg sm:rounded-3xl"
        style={{
          background: "#1C2422",
          boxShadow: [
            "0 -8px 48px rgb(0 0 0 / 0.60)",
            "0 0 0 1px rgb(86 176 187 / 0.18)",
            "0 0 32px rgb(86 176 187 / 0.06)",
          ].join(", "),
          maxHeight: "90dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Pinned header ── */}
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1" aria-hidden>
            <div className="h-1 w-10 rounded-full" style={{ background: TEAL.border }} />
          </div>
          <div className="flex items-start justify-between px-5 pt-2 pb-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[13px] font-bold text-white/90 ${accent.avatar}`}
                aria-hidden
              >
                {booking.apartment.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2 className="text-[16px] font-semibold leading-snug" style={{ color: T.primary }}>
                  {booking.apartment}
                </h2>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${source.badge}`}>
                  {source.label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pressable flex h-8 w-8 items-center justify-center rounded-full transition-soft"
              style={{ background: CORAL.bg, boxShadow: CORAL.glow }}
              aria-label="Bezárás"
            >
              <X className="h-4 w-4" style={{ color: CORAL.text }} />
            </button>
          </div>
          <div
            className="mx-5 mb-4 h-[2px] rounded-full"
            style={{
              background: stripeColor
                ? `linear-gradient(90deg, ${stripeColor}90, ${stripeColor}14)`
                : `linear-gradient(90deg, ${TEAL.line}, transparent)`,
            }}
            aria-hidden
          />
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="overflow-y-auto overscroll-contain drawer-scroll"
          style={{ maxHeight: "calc(80vh - 112px)" }}
        >
          <div className="flex flex-col gap-6 px-5 pb-8">

            {/* 1 ── Dates ─────────────────────────────────────────── */}
            <section aria-label="Dátumok">
              <DrawerSection label="Tartózkodás" icon={<CalendarDays className="h-3.5 w-3.5" />} />
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgb(38 46 44 / 0.50)", border: `1px solid ${TEAL.border}` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.secondary }}>Érkezés</span>
                  <span className={`rounded-md px-2 py-0.5 text-[13px] font-semibold ${accent.icon}`}>{booking.arrival}</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-center gap-1">
                    <div className="h-px flex-1" style={{ background: TEAL.dim }} aria-hidden />
                    <ArrowRight className="h-3 w-3" style={{ color: T.secondary }} aria-hidden />
                    <div className="h-px flex-1" style={{ background: TEAL.dim }} aria-hidden />
                  </div>
                  <span
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: "rgb(217 171 78 / 0.14)", color: "#ddb055", outline: "1px solid rgb(217 171 78 / 0.28)" }}
                  >
                    <Moon className="h-2.5 w-2.5" style={{ color: "#ddb055" }} aria-hidden />
                    {booking.nights} éj
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.secondary }}>Távozás</span>
                  <span className="rounded-md px-2 py-0.5 text-[13px] font-medium"
                    style={{ background: "rgb(56 66 63 / 0.55)", color: T.primary }}>
                    {booking.departure}
                  </span>
                </div>
              </div>
            </section>

            {/* 2 ── Payment block ─────────────────────────────────── */}
            <section aria-label="Fizetés">
              <DrawerSection
                label="Fizetés"
                icon={paymentPaid
                  ? <Check className="h-3.5 w-3.5" style={{ color: GREEN.text }} />
                  : <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#e08060" }} />}
              />
              <div
                className="flex flex-col gap-3 rounded-xl p-4"
                style={{ background: "#1a2220", border: `1px solid ${TEAL.border}` }}
              >
                {/* Amount */}
                <div className="flex gap-3">
                  <label className="flex flex-1 flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                      Teljes összeg
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={payment.amount}
                      onChange={(e) => onPaymentChange({ ...payment, amount: e.target.value })}
                      placeholder="pl. 30 000"
                      className="w-full rounded-lg border px-3 py-2 text-[13px] bg-[#1a2220] input-teal transition-soft focus:outline-none"
                      style={{ color: T.primary, borderColor: TEAL.border }}
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                      Előleg / foglaló
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={payment.deposit}
                      onChange={(e) => onPaymentChange({ ...payment, deposit: e.target.value })}
                      placeholder="pl. 10 000"
                      className="w-full rounded-lg border px-3 py-2 text-[13px] bg-[#1a2220] input-teal transition-soft focus:outline-none"
                      style={{ color: T.primary, borderColor: TEAL.border }}
                    />
                  </label>
                </div>

                {parseAmount(payment.deposit) > 0 && parseAmount(payment.amount) > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "rgb(217 171 78 / 0.10)", outline: "1px solid rgb(217 171 78 / 0.22)" }}>
                    <span className="text-[12px] font-medium" style={{ color: "#ddb055" }}>
                      Még fizetendő
                    </span>
                    <span className="text-[14px] font-bold" style={{ color: "#ddb055" }}>
                      {formatFt(remainingAmount(payment))}
                    </span>
                  </div>
                )}

                {/* Method pills */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                    Fizetési mód
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(["cash","transfer","szep","booking","airbnb"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onPaymentChange({ ...payment, method: m })}
                        className="pressable rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-soft"
                        style={payment.method === m
                          ? { background: "rgb(86 176 187 / 0.22)", color: "#7dd4dd", outline: `1px solid ${TEAL.glow}` }
                          : { background: "rgb(42 52 50 / 0.80)", color: T.secondary, outline: `1px solid ${TEAL.border}` }
                        }
                      >
                        {methodLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status toggle */}
                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: `1px solid ${TEAL.dim}` }}
                >
                  <span className="text-[12px] font-medium" style={{ color: T.secondary }}>
                    Státusz
                  </span>
                  <button
                    type="button"
                    onClick={() => onPaymentChange({ ...payment, status: payment.status === "paid" ? "pending" : "paid" })}
                    className="pressable flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-soft"
                    style={paymentPaid
  ? { background: "rgb(90 191 138 / 0.16)", color: GREEN.text, outline: `1px solid ${GREEN.border}` }
  : parseAmount(payment.deposit) > 0 && parseAmount(payment.amount) > 0
    ? { background: "rgb(232 168 74 / 0.15)", color: "#e8a84a", outline: "1px solid rgb(232 168 74 / 0.45)" }
    : { background: CORAL.bg, color: CORAL.text, boxShadow: CORAL.glow }
}
                    aria-label={paymentPaid ? "Fizetve — koppints a visszaállításhoz" : "Függőben — koppints a megerősítéshez"}
                  >
                    {paymentPaid
  ? <><Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> Fizetve</>
  : parseAmount(payment.deposit) > 0 && parseAmount(payment.amount) > 0
    ? <><AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Részben fizetve</>
    : <><AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Függőben</>
}
                  </button>
                </div>
              </div>
            </section>

            {/* 3 ── Arrival Preparation (arriving only) ───────────── */}
            {isArriving && (
              <section aria-label="Érkezési előkészületek">
                <DrawerSection
                  label="Érkezési előkészület"
                  icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                  allDone={arrivalAllDone}
                />

                {/* Progress hint */}
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <span className="text-[11px]" style={{ color: T.secondary }}>
                    {arrivalDoneCount} / {arrivalItems.length} teljesítve
                  </span>
                  {/* Thin progress bar */}
                  <div
                    className="h-0.5 w-24 overflow-hidden rounded-full"
                    style={{ background: "rgb(86 176 187 / 0.12)" }}
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(arrivalDoneCount / arrivalItems.length) * 100}%`,
                        background: arrivalAllDone
                          ? `linear-gradient(90deg, ${GREEN.text}, #4dd9a0)`
                          : `linear-gradient(90deg, rgb(86 176 187 / 0.80), rgb(86 176 187 / 0.50))`,
                      }}
                    />
                  </div>
                </div>

                {/* Checklist card */}
                <div
                  className="overflow-hidden rounded-xl"
                  style={{
                    border: arrivalAllDone ? `1px solid ${GREEN.border}` : `1px solid ${TEAL.border}`,
                    background: arrivalAllDone ? "rgb(90 191 138 / 0.04)" : "rgb(28 36 34 / 0.80)",
                    transition: "border-color 400ms ease, background 400ms ease",
                  }}
                >
                  {/* Row 1 — Cleaning: auto-synced from linked departing booking's task */}
                  <ArrivalCheckRow
                    done={cleaningSync}
                    label="Takarítás elvégezve"
                    sublabel={prevCleaningDone !== undefined
                      ? "Szinkronizálva — előző vendég takarítási feladatából"
                      : "Automatikus — takarítási feladatból"}
                    readOnly
                  />

                  {/* Row 2 — Payment (read-only, derived) */}
                  <ArrivalCheckRow
                    done={paymentPaid}
                    label="Fizetés ellenőrizve"
                    sublabel={paymentPaid ? "Fizetés megerősítve" : "Fizetési blokk — Függőben"}
                    readOnly
                  />

                  {/* Row 3 — Key prepared (manual) */}
                  <ArrivalCheckRow
                    done={detail.keyReady}
                    label="Kulcs előkészítve"
                    sublabel="Koppints a teljesítéshez"
                    onToggle={() => onDetailChange({ ...detail, keyReady: !detail.keyReady })}
                  />

                  {/* Row 4 — Check-in info sent (manual) */}
                  <ArrivalCheckRow
                  done={detail.checkinSent}
                  label="Check-in info elküldve"
                  sublabel="Érkezési instrukciók, belépési kód"
                  onToggle={() => onDetailChange({ ...detail, checkinSent: !detail.checkinSent })}
                  />

                  {/* Row 5 — NTAK/VIZA (manual) */}
                  <ArrivalCheckRow
                  done={detail.ntakDone}
                  label="NTAK/VIZA ellenőrzés"
                  sublabel="Regisztráció és bejelentés"
                  onToggle={() => onDetailChange({ ...detail, ntakDone: !detail.ntakDone })}
                  isLast
                  />
                </div>

                {/* All-done celebration line */}
                {arrivalAllDone && (
                  <p
                    className="mt-2 text-center text-[11px] font-medium"
                    style={{ color: GREEN.text, opacity: 0.85 }}
                  >
                    Minden előkészület kész · Vendég érkezhet ✓
                  </p>
                )}
              </section>
            )}

            {/* 4 ── Cleaning task (departing only) ─────────────────── */}
            {isDeparting && (
              <section aria-label="Takarítási feladat">
                <DrawerSection label="Takarítás" icon={<Sparkles className="h-3.5 w-3.5" />} />
                <button
                  type="button"
                  onClick={() => onDetailChange({ ...detail, cleaningDone: !detail.cleaningDone })}
                  className="pressable flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-soft"
                  style={
                    detail.cleaningDone
                      ? { background: GREEN.bg, borderColor: GREEN.border }
                      : { background: "rgb(30 40 38 / 0.70)", borderColor: TEAL.border }
                  }
                  aria-label={detail.cleaningDone ? "Takarítás kész" : "Takarítás jelölése kész-ként"}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-soft"
                    style={
                      detail.cleaningDone
                        ? { background: "rgb(90 191 138 / 0.22)", outline: `2px solid ${GREEN.ring}` }
                        : { background: "transparent", outline: `2px solid ${TEAL.border}` }
                    }
                    aria-hidden
                  >
                    {detail.cleaningDone && <Check className="h-3.5 w-3.5" style={{ color: GREEN.text }} strokeWidth={2.5} />}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-[13px] font-medium leading-snug"
                      style={{
                        color: detail.cleaningDone ? GREEN.text : T.primary,
                        opacity: detail.cleaningDone ? 0.6 : 1,
                        textDecoration: detail.cleaningDone ? "line-through" : "none",
                        textDecorationColor: "rgb(90 191 138 / 0.4)",
                      }}
                    >
                      Takarítás — {booking.apartment}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: T.secondary }}>
                      Távozás utáni takarítás · Feladat
                    </p>
                  </div>
                  {detail.cleaningDone && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "rgb(90 191 138 / 0.16)", color: GREEN.text, outline: `1px solid ${GREEN.border}` }}
                    >
                      Kész
                    </span>
                  )}
                </button>
              </section>
            )}

            {/* 5 ── Notes ──────────────────────────────────────────── */}
            <section aria-label="Megjegyzések">
              <DrawerSection label="Megjegyzés" icon={<StickyNote className="h-3.5 w-3.5" />} />
              {!noteOpen ? (
                <button
                  type="button"
                  onClick={() => { setNoteOpen(true); setTimeout(() => noteRef.current?.focus(), 120); }}
                  className="pressable flex w-full items-center gap-2.5 rounded-xl border border-dashed px-4 py-3 transition-soft"
                  style={{ borderColor: CORAL.ring, background: CORAL.bg, color: CORAL.text, boxShadow: CORAL.glow }}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  <span className="text-[13px] font-medium">Megjegyzés hozzáadása…</span>
                </button>
              ) : (
                <div
                  className="overflow-hidden rounded-xl"
                  style={{ border: `1px solid ${TEAL.border}`, background: "#1a2220" }}
                >
                  <textarea
                    ref={noteRef}
                    value={detail.note}
                    onChange={(e) => onDetailChange({ ...detail, note: e.target.value })}
                    placeholder="Megjegyzések, instrukciók, különleges kérések…"
                    rows={4}
                    className="w-full resize-none bg-transparent px-4 py-3 text-[13px] input-teal focus:outline-none"
                    style={{ color: T.primary, fontFamily: "inherit" }}
                  />
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderTop: `1px solid ${TEAL.line}` }}
                  >
                    <span className="text-[11px]" style={{ color: T.secondary }}>
                      {detail.note.length > 0 ? `${detail.note.length} karakter` : "Üres"}
                    </span>
                    <CoralBtn onClick={() => { if (!detail.note.trim()) setNoteOpen(false); }}>
                      Bezár
                    </CoralBtn>
                  </div>
                </div>
              )}
            </section>

            {/* 6 ── Contact ─────────────────────────────────────────── */}
            <section aria-label="Kapcsolattartó">
              <div className="mb-3 flex items-center justify-between">
                <DrawerSection label="Kapcsolat" icon={<Phone className="h-3.5 w-3.5" />} />
                <button
                  type="button"
                  onClick={() => setContactEditMode((v) => !v)}
                  className="pressable -mt-3 flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-soft"
                  style={
                    contactEditMode
                      ? { background: "rgb(90 191 138 / 0.14)", color: GREEN.text, boxShadow: `0 0 0 1px ${GREEN.border}` }
                      : { background: CORAL.bg, color: CORAL.text, boxShadow: CORAL.glow }
                  }
                  aria-label={contactEditMode ? "Szerkesztés befejezése" : "Kapcsolat szerkesztése"}
                >
                  <Pencil className="h-3 w-3" aria-hidden />
                  {contactEditMode ? "Kész" : "Szerkeszt"}
                </button>
              </div>

              {contactEditMode ? (
                <div className="flex flex-col gap-3 rounded-xl p-4"
                  style={{ background: "#1a2220", border: `1px solid ${TEAL.border}` }}>
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                      <User className="h-3 w-3" aria-hidden /> Név
                    </span>
                    <input type="text" value={detail.contactName}
                      onChange={(e) => onDetailChange({ ...detail, contactName: e.target.value })}
                      placeholder="Vendég neve…" className={inputCls + " input-teal"} style={inputStyle} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                      <Phone className="h-3 w-3" aria-hidden /> Telefonszám
                    </span>
                    <input type="tel" value={detail.contactPhone}
                      onChange={(e) => onDetailChange({ ...detail, contactPhone: e.target.value })}
                      placeholder="+36 30 000 0000" className={inputCls + " input-teal"} style={inputStyle} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                  Email cím
                  </span>
                  <input type="email" value={detail.contactEmail}
                  onChange={(e) => onDetailChange({ ...detail, contactEmail: e.target.value })}
                  placeholder="vendeg@email.com" className={inputCls + " input-teal"} style={inputStyle} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.secondary }}>
                  Megjegyzés (opcionális)
                  </span>
                    <input type="text" value={detail.contactNote}
                      onChange={(e) => onDetailChange({ ...detail, contactNote: e.target.value })}
                      placeholder="Pl. késői érkezés, kisgyerek…" className={inputCls + " input-teal"} style={inputStyle} />
                  </label>
                </div>
              ) : hasContact ? (
                <div className="flex flex-col gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgb(38 46 44 / 0.55)", border: `1px solid ${TEAL.border}` }}>
                  {detail.contactName && (
                    <div className="flex items-center gap-2.5">
                      <User className="h-3.5 w-3.5 shrink-0" style={{ color: T.secondary }} aria-hidden />
                      <span className="text-[13px] font-medium" style={{ color: T.primary }}>{detail.contactName}</span>
                    </div>
                  )}

                 {detail.contactEmail && (
                 <a href={`mailto:${detail.contactEmail}`} className="flex items-center gap-2.5"
                 onClick={(e) => e.stopPropagation()}>
                 <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: T.secondary }} aria-hidden />
                 <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{detail.contactEmail}</span>
                 </a>
                 )}
                {detail.contactPhone && (
                <a href={`tel:${detail.contactPhone}`} className="flex items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}>
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: T.secondary }} aria-hidden />
                <span className="text-[13px] font-medium" style={{ color: "#6abccc" }}>{detail.contactPhone}</span>
                </a>
                )}

                  {detail.contactNote && (
                    <p className="pl-6 text-[12px]" style={{ color: T.secondary }}>{detail.contactNote}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-dashed px-4 py-3"
                  style={{ borderColor: TEAL.border, background: "rgb(30 40 38 / 0.35)" }}>
                  <Phone className="h-3.5 w-3.5" style={{ color: T.secondary }} aria-hidden />
                  <span className="text-[12px]" style={{ color: T.secondary }}>
                    Nincs kapcsolati adat — koppints a „Szerkeszt" gombra
                  </span>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
