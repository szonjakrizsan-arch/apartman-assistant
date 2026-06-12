import { useState } from "react";
import { KeyRound, Home, DoorOpen, CalendarClock, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { BookingCard }        from "../components/BookingCard";
import { FutureBookingRow }   from "../components/FutureBookingRow";
import { BookingDetailDrawer } from "../components/BookingDetailDrawer";
import type { AppState, AppStateActions } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";
import type { Booking, BookingStatus } from "../data/mockData";

/* ─── types ─────────────────────────────────────────────────────── */
type FilterId = "all" | BookingStatus;

interface BookingsScreenProps {
  appState: AppState & AppStateActions;
  ical:     IcalState;
}

const FUTURE_PREVIEW = 3;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Jó reggelt";
  if (h < 18) return "Jó napot";
  return "Jó estét";
}

type FilterConfig = {
  id: FilterId; label: string;
  inactiveBg: string; inactiveText: string; inactiveRing: string; inactiveBadgeBg: string; inactiveBadgeText: string;
  activeBg: string;   activeText: string;   activeRing: string;   activeBadgeBg: string;   activeBadgeText: string;
};

const FILTERS: FilterConfig[] = [
  { id: "all",       label: "Összes",   inactiveBg: "bg-surface-card", inactiveText: "text-text-secondary", inactiveRing: "ring-border-subtle",    inactiveBadgeBg: "bg-border-subtle/70",    inactiveBadgeText: "text-text-secondary", activeBg: "bg-surface-raised", activeText: "text-text-primary", activeRing: "ring-border-subtle",   activeBadgeBg: "bg-border-subtle",     activeBadgeText: "text-text-primary" },
  { id: "arriving",  label: "Érkező",  inactiveBg: "bg-[#dc84601e]",  inactiveText: "text-[#dc8460]",      inactiveRing: "ring-[#dc846035]",      inactiveBadgeBg: "bg-[#dc846032]",         inactiveBadgeText: "text-[#dc8460]",      activeBg: "bg-[#dc846030]",    activeText: "text-[#dc8460]",    activeRing: "ring-[#dc846055]", activeBadgeBg: "bg-[#dc846050]",       activeBadgeText: "text-[#dc8460]" },
  { id: "staying",   label: "Bent van", inactiveBg: "bg-[#60bc9e1e]",  inactiveText: "text-[#60bc9e]",      inactiveRing: "ring-[#60bc9e35]",      inactiveBadgeBg: "bg-[#60bc9e32]",         inactiveBadgeText: "text-[#60bc9e]",      activeBg: "bg-[#60bc9e30]",    activeText: "text-[#60bc9e]",    activeRing: "ring-[#60bc9e55]", activeBadgeBg: "bg-[#60bc9e50]",       activeBadgeText: "text-[#60bc9e]" },
  { id: "departing", label: "Távozó",  inactiveBg: "bg-[#56b0bb1e]",  inactiveText: "text-[#56b0bb]",      inactiveRing: "ring-[#56b0bb35]",      inactiveBadgeBg: "bg-[#56b0bb32]",         inactiveBadgeText: "text-[#56b0bb]",      activeBg: "bg-[#56b0bb30]",    activeText: "text-[#56b0bb]",    activeRing: "ring-[#56b0bb55]", activeBadgeBg: "bg-[#56b0bb50]",       activeBadgeText: "text-[#56b0bb]" },
];

function filterCount(bookings: Booking[], id: FilterId): number {
  if (id === "all") return bookings.length;
  return bookings.filter((b) => b.status === id).length;
}

function FilterChip({ config, active, count, onClick }: { config: FilterConfig; active: boolean; count: number; onClick: () => void }) {
  const bg = active ? config.activeBg : config.inactiveBg;
  const text = active ? config.activeText : config.inactiveText;
  const ring = active ? config.activeRing : config.inactiveRing;
  const bbg = active ? config.activeBadgeBg : config.inactiveBadgeBg;
  const bt = active ? config.activeBadgeText : config.inactiveBadgeText;
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`pressable flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-soft ring-1 ${bg} ${text} ${ring} ${active ? "shadow-[0_1px_4px_rgb(0_0_0_/0.14)]" : ""}`}>
      {config.label}
      <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none tabular-nums ${bbg} ${bt}`}>{count}</span>
    </button>
  );
}

function GroupLabel({ status, count }: { status: BookingStatus; count: number }) {
  const cfg: Record<BookingStatus, { label: string; color: string; Icon: typeof KeyRound; badgeBg: string }> = {
    arriving:  { label: "Érkezők",  color: "#dc8460", Icon: KeyRound, badgeBg: "rgb(220 132 96 / 0.16)" },
    staying:   { label: "Bent van", color: "#60bc9e", Icon: Home,     badgeBg: "rgb(96 188 158 / 0.16)" },
    departing: { label: "Távozók",  color: "#56b0bb", Icon: DoorOpen, badgeBg: "rgb(86 176 187 / 0.16)" },
  };
  const { label, color, Icon, badgeBg } = cfg[status];
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} aria-hidden />
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
        style={{ background: badgeBg, color, outline: `1px solid ${color}28` }}>{count}</span>
      <div className="flex-1" style={{ height: "1px", background: `linear-gradient(90deg, ${color}18, transparent)` }} aria-hidden />
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────── */
function BookingSkeleton() {
  return (
    <div className="card-elevated rounded-2xl px-4 py-4 animate-pulse">
      <div className="flex gap-3.5 pl-4">
        <div className="h-11 w-11 rounded-2xl bg-border-subtle/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-border-subtle/40" />
          <div className="h-3 w-1/2 rounded bg-border-subtle/30" />
        </div>
      </div>
    </div>
  );
}

export function BookingsScreen({ appState, ical }: BookingsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [showAllFuture, setShowAllFuture] = useState(false);
  const [openBooking, setOpenBooking] = useState<Booking | null>(null);

  const { isPaymentPaid, getPayment, setPayment, togglePaymentStatus,
          getDetail, setDetail, prevCleaningFor } = appState;

  const { bookings, futureBookings, status: icalStatus, errors, refetch, lastFetched } = ical;

  const filtered = activeFilter === "all" ? bookings
    : bookings.filter((b) => b.status === activeFilter);
  const groups: BookingStatus[] = ["arriving", "staying", "departing"];
  const visibleFuture = showAllFuture ? futureBookings : futureBookings.slice(0, FUTURE_PREVIEW);
  const hasMoreFuture = futureBookings.length > FUTURE_PREVIEW;

  const countArriving  = bookings.filter((b) => b.status === "arriving").length;
  const countStaying   = bookings.filter((b) => b.status === "staying").length;
  const countDeparting = bookings.filter((b) => b.status === "departing").length;

  return (
    <>
      <div className="flex flex-col gap-0 pb-2">

        {/* ── Greeting hero ── */}
        <section className="gradient-hero glow-card relative overflow-hidden rounded-2xl border border-[#60bc9e18] px-5 py-4" aria-label="Napi összefoglaló">
          <div aria-hidden className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 opacity-[0.065]"
            style={{ background: "radial-gradient(circle, #60bc9e 0%, transparent 68%)" }} />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60bc9e]/70">
              Mai áttekintés
            </p>
            <p className="mt-1 text-[15px] font-semibold text-text-primary">
              {icalStatus === "loading"
                ? "Foglalások betöltése…"
                : `Ma ${bookings.length} aktív foglalás.`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 shrink-0" style={{ color: "#dc8460" }} aria-hidden />
                <span className="text-[13px] font-semibold" style={{ color: "#dc8460" }}>{countArriving} érkezés</span>
              </span>
              <span className="h-3.5 w-px bg-border-faint" aria-hidden />
              <span className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 shrink-0" style={{ color: "#60bc9e" }} aria-hidden />
                <span className="text-[13px] font-semibold" style={{ color: "#60bc9e" }}>{countStaying} bent</span>
              </span>
              <span className="h-3.5 w-px bg-border-faint" aria-hidden />
              <span className="flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "#56b0bb" }} aria-hidden />
                <span className="text-[13px] font-semibold" style={{ color: "#56b0bb" }}>{countDeparting} távozás</span>
              </span>
              {/* Refresh button */}
              <button type="button" onClick={refetch}
                className="pressable ml-auto flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] transition-soft"
                style={{ color: "rgb(86 176 187 / 0.70)", background: "rgb(86 176 187 / 0.08)" }}
                aria-label="Frissítés">
                <RefreshCw className={`h-3 w-3 ${icalStatus === "loading" ? "animate-spin" : ""}`} aria-hidden />
                {lastFetched ? lastFetched.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" }) : ""}
              </button>
            </div>
          </div>
        </section>

        {/* ── iCal error banner ── */}
        {errors.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5"
            style={{ background: "rgb(220 132 96 / 0.08)", borderColor: "rgb(220 132 96 / 0.25)" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e08060]" aria-hidden />
            <div>
              <p className="text-[12px] font-semibold text-[#e08060]">Néhány naptár nem töltődött be</p>
              <p className="text-[11px] text-text-secondary">{errors.length} forrás hibás · Az adatok részlegesek lehetnek</p>
            </div>
          </div>
        )}

        {/* ── Filter chips ── */}
        <div className="mt-5">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <FilterChip key={f.id} config={f} active={activeFilter === f.id}
                count={filterCount(bookings, f.id)} onClick={() => setActiveFilter(f.id)} />
            ))}
          </div>
        </div>

        {/* ── Booking list ── */}
        <div className="mt-5">
          {icalStatus === "loading" && bookings.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => <BookingSkeleton key={n} />)}
            </div>
          ) : activeFilter === "all" ? (
            <div className="flex flex-col gap-6">
              {groups.map((status) => {
                const group = filtered.filter((b) => b.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status} className="flex flex-col gap-3">
                    <GroupLabel status={status} count={group.length} />
                    <ul className="flex flex-col gap-3">
                      {group.map((booking) => (
                        <li key={booking.id}>
                          <BookingCard booking={booking}
                            paymentChecked={isPaymentPaid(booking.id)}
                            onPaymentToggle={() => togglePaymentStatus(booking.id)}
                            onOpen={() => setOpenBooking(booking)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {bookings.length === 0 && icalStatus === "success" && (
                <p className="py-10 text-center text-sm text-text-muted">
                  Ma nincs aktív foglalás.
                </p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.length === 0
                ? <li className="py-10 text-center text-sm text-text-muted">Nincs találat</li>
                : filtered.map((booking) => (
                    <li key={booking.id}>
                      <BookingCard booking={booking}
                        paymentChecked={isPaymentPaid(booking.id)}
                        onPaymentToggle={() => togglePaymentStatus(booking.id)}
                        onOpen={() => setOpenBooking(booking)} />
                    </li>
                  ))}
            </ul>
          )}
        </div>

        {/* ── Future bookings ── */}
        {activeFilter === "all" && futureBookings.length > 0 && (
          <>
            <div className="section-rule my-7" aria-hidden />
            <section aria-labelledby="future-bookings-heading">
              <div className="mb-3.5 flex items-center gap-2.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
                <h2 id="future-bookings-heading" className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Közelgő foglalások
                </h2>
                <div className="flex-1 border-t border-dashed border-border-faint/50" aria-hidden />
                <span className="text-[11px] text-text-muted">{futureBookings.length} db</span>
              </div>
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgb(56 66 63 / 0.40)" }}>
                <ul className="flex flex-col">
                  {visibleFuture.map((booking, idx) => (
                    <li key={booking.id} style={idx > 0 ? { borderTop: "1px solid rgba(186,154,112,0.18)" } : undefined}>
                      <FutureBookingRow booking={booking} onOpen={() => setOpenBooking(booking as any)} />
                    </li>
                  ))}
                </ul>
                {hasMoreFuture && !showAllFuture && (
                  <button type="button" onClick={() => setShowAllFuture(true)}
                    className="pressable flex w-full items-center justify-between transition-soft"
                    style={{ background: "linear-gradient(180deg, rgb(38 46 44 / 0.0) 0%, rgb(42 52 50 / 0.70) 100%)", borderTop: "1px solid rgb(56 66 63 / 0.22)", padding: "6px 12px 10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "rgb(107 103 99 / 0.80)" }}>
                      További {futureBookings.length - FUTURE_PREVIEW} foglalás
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: "rgb(158 152 146 / 0.90)" }} aria-hidden />
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {openBooking && (
        <BookingDetailDrawer
          booking={{ status: "staying", isTodayArrival: false, isTodayDeparture: false, departure: "", ...openBooking } as any}
          onClose={() => setOpenBooking(null)}
          payment={getPayment(openBooking.id)}
          onPaymentChange={(next) => setPayment(openBooking.id, next)}
          detail={getDetail(openBooking.id)}
          onDetailChange={(next) => setDetail(openBooking.id, next)}
          prevCleaningDone={prevCleaningFor(openBooking.id, bookings)}
        />
      )}
    </>
  );
}
