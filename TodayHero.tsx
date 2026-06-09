import { Sun, CloudSun, Moon, KeyRound, DoorOpen, ListChecks } from "lucide-react";
import type { IcalState } from "../data/useIcalBookings";

function formatToday(): string {
  return new Intl.DateTimeFormat("hu-HU", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getGreeting(): { text: string; Icon: typeof Sun } {
  const h = new Date().getHours();
  if (h < 11) return { text: "Jó reggelt",  Icon: Sun      };
  if (h < 18) return { text: "Jó napot",    Icon: CloudSun };
  return         { text: "Jó estét",    Icon: Moon     };
}


export function TodayHero({
  ical,
  userName,
}: {
  ical: IcalState;
  userName: string;
}) {

  const { text, Icon } = getGreeting();

  const arrivals   = ical.bookings.filter((b) => b.isTodayArrival).length;
const departures = ical.bookings.filter((b) => b.isTodayDeparture).length;
const tasks      = ical.bookings.filter((b) => b.status === "departing").length;

  return (
    <section
      className="gradient-hero glow-card relative overflow-hidden rounded-2xl border border-[#63bea218] px-5 py-4"
      aria-label="Mai összefoglaló"
    >
      {/* Ambient sage glow — barely visible, just lifts the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-[0.065]"
        style={{ background: "radial-gradient(circle, #63bea2 0%, transparent 68%)" }}
      />

      <div className="relative space-y-3">
        {/* Row 1: greeting label + date */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#63bea2]/70">
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            {`${text}, ${userName}!`}
          </span>
          <span className="text-[11px] capitalize text-text-muted">
            {formatToday()}
          </span>
        </div>

        {/* Row 2: compact three-stat summary */}
        <div className="flex items-center gap-0">
          {/* Arrivals */}
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#df876520] bg-[#df876510] py-2.5">
            <KeyRound className="h-3.5 w-3.5 shrink-0" style={{ color: "#df8765" }} aria-hidden />
            <span className="text-[13px] font-semibold leading-none" style={{ color: "#df8765" }}>
              {arrivals}&thinsp;érkezés
            </span>
          </span>

          {/* Separator */}
          <span className="mx-1.5 h-5 w-px bg-border-faint/60 shrink-0" aria-hidden />

          {/* Departures */}
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#58b3be20] bg-[#58b3be10] py-2.5">
            <DoorOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "#58b3be" }} aria-hidden />
            <span className="text-[13px] font-semibold leading-none" style={{ color: "#58b3be" }}>
              {departures}&thinsp;távozás
            </span>
          </span>

          {/* Separator */}
          <span className="mx-1.5 h-5 w-px bg-border-faint/60 shrink-0" aria-hidden />

          {/* Tasks */}
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-faint/50 bg-surface-inset/60 py-2.5">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
            <span className="text-[13px] font-medium leading-none text-text-secondary">
              {tasks}&thinsp;feladat
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
