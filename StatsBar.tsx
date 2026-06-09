import { KeyRound, Home, Luggage } from "lucide-react";
import type { StatItem } from "../data/mockData";

const iconMap = {
  arrivals:   KeyRound,
  staying:    Home,
  departures: Luggage,
} as const;

const styles = {
  arrivals: {
    icon:  "bg-[#df876514] text-[#df8765]",
    ring:  "ring-[#df876526]",
    value: "#df8765",
  },
  staying: {
    icon:  "bg-[#63bea216] text-[#63bea2]",
    ring:  "ring-[#63bea226]",
    value: "#63bea2",
  },
  departures: {
    icon:  "bg-[#58b3be14] text-[#58b3be]",
    ring:  "ring-[#58b3be26]",
    value: "#58b3be",
  },
} as const;

export function StatsBar({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const Icon  = iconMap[item.icon];
        const style = styles[item.icon];
        return (
          <article
            key={item.id}
            className={`card-elevated pressable flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center ring-1 ${style.ring}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${style.icon}`}
              aria-hidden
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
            </span>
            <p
              className="text-[22px] font-bold leading-none tracking-tight"
              style={{ color: style.value }}
            >
              {item.value}
            </p>
            <p className="text-[10px] font-medium leading-none text-text-muted">
              {item.label}
            </p>
          </article>
        );
      })}
    </div>
  );
}
