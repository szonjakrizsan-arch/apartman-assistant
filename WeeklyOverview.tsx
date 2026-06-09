import type { CSSProperties } from "react";
import type { WeekDay } from "../data/mockData";
import { SectionHeader } from "./SectionHeader";

interface WeeklyOverviewProps {
  days: WeekDay[];
  compact?: boolean;
}

function tileStyle(
  occupied: number,
  max: number,
  isToday: boolean,
): CSSProperties {
  const norm = max > 0 ? occupied / max : 0;

  let tier: "low" | "medium" | "high";
  if (norm < 0.40)      tier = "low";
  else if (norm < 0.75) tier = "medium";
  else                  tier = "high";

  if (isToday) {
    const a      = { low: 0.25, medium: 0.40, high: 0.60 }[tier];
    const border = { low: 0.20, medium: 0.30, high: 0.45 }[tier];
    return {
      background:    `rgb(107 158 200 / ${a})`,
      outline:       `1px solid rgb(107 158 200 / ${border})`,
      outlineOffset: "-1px",
    };
  }

  const alpha       = { low: 0.08, medium: 0.30, high: 0.55 }[tier];
  const borderAlpha = { low: 0.08, medium: 0.22, high: 0.40 }[tier];
  return {
    background:    `rgb(99 190 162 / ${alpha})`,
    outline:       `1px solid rgb(99 190 162 / ${borderAlpha})`,
    outlineOffset: "-1px",
    ...(tier === "high" && {
      boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
    }),
  };
}

export function WeeklyOverview({ days, compact = false }: WeeklyOverviewProps) {
  if (!compact) return null;

  const maxVal = Math.max(...days.map((d) => d.occupied), 1);
  const BAR_MAX_PX = 56;

  return (
    <section>
      <SectionHeader title="Heti foglaltság" subtitle="Egységek naponta" />

      <div className="card-elevated rounded-2xl px-4 py-4">
        <div className="flex gap-1.5">
          {days.map((day) => {
            const norm = day.occupied / maxVal;
            const tier: "low" | "medium" | "high" =
              norm < 0.40 ? "low" : norm < 0.75 ? "medium" : "high";
            const barHeight = day.occupied === 0 ? 3 : Math.max(10, norm * BAR_MAX_PX);

            return (
              <div
                key={day.dayLabel + day.date}
                className="flex flex-1 flex-col items-center gap-1"
              >
                {/* Day label — always top */}
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  day.isToday ? "text-navy" : "text-text-muted"
                }`}>
                  {day.dayLabel}
                </span>

                {/* Number */}
                <span className={`text-[13px] font-bold tabular-nums leading-none ${
                  day.isToday
                    ? "text-navy"
                    : tier === "high"
                      ? "text-text-primary"
                      : tier === "medium"
                        ? "text-text-secondary"
                        : "text-text-muted"
                }`}>
                  {day.occupied}
                </span>

                {/* Bar container — fixed height, bar grows from bottom */}
                <div className="flex w-full items-end" style={{ height: `${BAR_MAX_PX}px` }}>
                  <div
                    className="w-full rounded-lg transition-all duration-300"
                    style={{
                      height: `${barHeight}px`,
                      ...tileStyle(day.occupied, maxVal, day.isToday),
                    }}
                  />
                </div>

                {/* Date — always bottom */}
                <span className={`text-[10px] tabular-nums leading-none ${
                  day.isToday ? "font-bold text-navy" : "text-text-muted"
                }`}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}