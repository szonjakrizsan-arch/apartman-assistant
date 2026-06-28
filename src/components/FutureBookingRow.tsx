import { Moon } from "lucide-react";
import type { FutureBooking } from "../data/mockData";
import { accentStyles, sourceStyles } from "../lib/theme";

interface FutureBookingRowProps {
  booking: FutureBooking;
  onOpen?: () => void;
}

/*
 * Compact future booking row.
 *
 * Design principles:
 * - Apartment identity is primary: large coloured avatar with initials
 * - Guest name is secondary and optional (iCal may not supply it)
 * - One horizontal row — fast to scan vertically on mobile
 * - Same accent colour system as BookingCard — consistent apartment identity
 * - No payment info (irrelevant for future planning context)
 */
export function FutureBookingRow({ booking, onOpen }: FutureBookingRowProps) {
  const accent = accentStyles[booking.accent];
  const source = sourceStyles[booking.source];

  // Avatar always uses apartment initials — guest names intentionally omitted
  // from this section (presentation-safe, iCal-safe, visually cleaner)
  const avatarLabel = booking.apartment.slice(0, 2).toUpperCase();

  return (
    <article onClick={onOpen} role="button" tabIndex={0}
      className="pressable flex w-full cursor-pointer items-center gap-2.5 bg-surface-card/30 px-3 py-2.5 text-left transition-soft">
      {/* Apartment colour avatar — smaller in secondary section */}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white/85 ${accent.avatar}`}
        aria-hidden
      >
        {avatarLabel}
      </span>

      {/* Main content — apartment name only, no guest names in this section */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold leading-snug text-text-primary">
          {booking.apartment}
        </p>
      </div>

      {/* Right side: single horizontal strip — arrival · nights · platform */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Arrival date — accent-tinted, apartment identity */}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${accent.icon}`}>
          {booking.arrival}
        </span>
        {/* Nights — amber duration indicator */}
        <span
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            background: "rgb(217 171 78 / 0.10)",
            color: "#ddb055",
            outline: "1px solid rgb(217 171 78 / 0.18)",
          }}
        >
          <Moon className="h-2.5 w-2.5" style={{ color: "#ddb055" }} aria-hidden />
          {booking.nights}
        </span>
        {/* Platform badge */}
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${source.badge}`}>
          {source.label}
        </span>
        {/* Conflict badge */}
{booking.hasSourceConflict && (
  <span
    className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
    style={{
      background: "rgb(217 171 78 / 0.15)",
      color: "#f0c040",
      boxShadow: "0 0 0 1px rgb(217 171 78 / 0.55)",
    }}
  >
    ⚠
  </span>
)}
      </div>

    </article>
  );
}
