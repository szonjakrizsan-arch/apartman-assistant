import { CalendarDays, ArrowRight, KeyRound, DoorOpen, Moon, Check, AlertTriangle, Home } from "lucide-react";
import type { Booking } from "../data/mockData";
import { accentStyles, sourceStyles } from "../lib/theme";

interface BookingCardProps {
  booking: Booking;
  compact?: boolean;
  paymentChecked: boolean;
  onPaymentToggle: () => void;
  onOpen: () => void;
}

export function BookingCard({
  booking,
  compact = false,
  paymentChecked,
  onPaymentToggle,
  onOpen,
}: BookingCardProps) {
  const accent = accentStyles[booking.accent];
  const source = sourceStyles[booking.source];

  const stripeClass =
    booking.isTodayArrival
      ? "from-[#dc8460] to-[#c56d4a]"
      : booking.isTodayDeparture
        ? "from-[#56b0bb] to-[#3d9baa]"
        : accent.stripe;

  const ringClass =
    booking.isTodayArrival
      ? "ring-1 ring-[#dc84602c]"
      : booking.isTodayDeparture
        ? "ring-1 ring-[#56b0bb2c]"
        : "";

  return (
    <article
      className={`card-elevated relative overflow-hidden rounded-2xl ${ringClass} ${
        compact ? "px-4 py-4" : "px-4 py-4.5"
      } cursor-pointer`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      aria-label={`${booking.apartment} részletei`}
    >
      {/* Left accent stripe */}
      <div
        className={`absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b ${stripeClass}`}
        aria-hidden
      />

      {/* Today badge row */}
      {(booking.isTodayArrival || booking.isTodayDeparture || (!booking.isTodayArrival && !booking.isTodayDeparture) || booking.hasSourceConflict) && (
        <div className="mb-3 flex flex-wrap gap-2 pl-4">
          {booking.isTodayArrival && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgb(220 132 96 / 0.13)",
                color: "#dc8460",
                boxShadow: "0 0 0 1px rgb(220 132 96 / 0.26)",
              }}
            >
              <KeyRound className="h-2.5 w-2.5" aria-hidden />
              Ma érkezik
            </span>
          )}
          {booking.isTodayDeparture && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgb(86 176 187 / 0.13)",
                color: "#56b0bb",
                boxShadow: "0 0 0 1px rgb(86 176 187 / 0.26)",
              }}
            >
              <DoorOpen className="h-2.5 w-2.5" aria-hidden />
              Ma távozik
            </span>
          )}
          {!booking.isTodayArrival && !booking.isTodayDeparture && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgb(99 190 162 / 0.13)",
                color: "#63bea2",
                boxShadow: "0 0 0 1px rgb(99 190 162 / 0.26)",
              }}
            >
              <Home className="h-2.5 w-2.5" aria-hidden />
              Bent van
            </span>
          )}
        {booking.hasSourceConflict && (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
    style={{
  background: "rgb(86 176 187 / 0.13)",
  color: "#56b0bb",
  boxShadow: "0 0 0 1px rgb(86 176 187 / 0.45)",
}}
  >
    <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
    Eltérő dátum — ellenőrizd
  </span>
)}
        </div>
      )}

      <div className="flex gap-3.5 pl-4">
        {/* Avatar */}
        <span
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[13px] font-semibold text-white/90 ${
            compact ? "h-10 w-10" : "h-11 w-11"
          } ${accent.avatar}`}
          aria-hidden
        >
          {booking.apartment.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          {/* Apartment + platform badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold leading-snug tracking-tight text-text-primary">
                {booking.apartment}
              </h3>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${source.badge}`}>
              {source.label}
            </span>
          </div>

          {/* Date row */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-faint/70 bg-surface-raised/40 px-3 py-2">
            <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium ${accent.icon}`}>
              <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
              {booking.arrival}
            </span>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-navy-soft/70" aria-hidden>
              <ArrowRight className="h-2.5 w-2.5 text-navy/80" />
            </span>
            <span className="text-[12px] font-medium text-text-primary">{booking.departure}</span>
            <span
              className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                background: "rgb(217 171 78 / 0.12)",
                color: "#ddb055",
                outline: "1px solid rgb(217 171 78 / 0.22)",
              }}
            >
              <Moon className="h-2.5 w-2.5" style={{ color: "#ddb055" }} aria-hidden />
              {booking.nights}
            </span>
          </div>

          {/* Payment reminder */}
          {!compact && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPaymentToggle(); }}
              className="pressable mt-2.5 flex w-full items-center justify-between rounded-xl border px-3 py-2 transition-soft"
              style={
                paymentChecked
                  ? { background: "rgb(90 191 138 / 0.07)", borderColor: "rgb(90 191 138 / 0.20)" }
                  : { background: "rgb(210 100 70 / 0.07)", borderColor: "rgb(210 100 70 / 0.22)" }
              }
              aria-label={paymentChecked ? "Fizetés rendben" : "Fizetés ellenőrizendő"}
            >
              <span
                className="flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: paymentChecked ? "#5abf8a" : "#d26448" }}
              >
                {paymentChecked
                  ? <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  : <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden />}
                Fizetési emlékeztető
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={
                  paymentChecked
                    ? { background: "rgb(90 191 138 / 0.14)", color: "#5abf8a", outline: "1px solid rgb(90 191 138 / 0.24)" }
                    : { background: "rgb(210 100 70 / 0.14)", color: "#d26448", outline: "1px solid rgb(210 100 70 / 0.26)" }
                }
              >
                {paymentChecked ? "Rendben" : "Ellenőrizendő"}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
