import { Home, CalendarRange, ListChecks, Receipt, Users, Building2 } from "lucide-react";
import type { TabId } from "../types/navigation";

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home",       label: "Kezdőlap",   icon: Home },
  { id: "bookings",   label: "Foglalások", icon: CalendarRange },
  { id: "tasks",      label: "Feladatok",  icon: ListChecks },
  { id: "invoices",   label: "Számlák",    icon: Receipt },
  { id: "contacts",   label: "Kapcsolatok", icon: Users },
  { id: "apartments", label: "Apartmanok", icon: Building2 },
];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount?: number;
}

export function BottomNav({ active, onChange, alertCount = 0 }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border-faint/80 bg-surface-raised/92 shadow-[0_-2px_16px_rgb(0_0_0_/_0.08)] backdrop-blur-md"
      aria-label="Fő navigáció"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`pressable relative flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 py-1 transition-soft ${
                isActive ? "text-navy" : "text-text-muted"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-soft ${
                  isActive
                    ? "bg-navy-soft/90 ring-1 ring-navy/25"
                    : "bg-transparent ring-1 ring-transparent"
                }`}
              >
                <Icon
                  className={`h-[1.125rem] w-[1.125rem] transition-soft ${
                    isActive ? "opacity-100" : "opacity-75"
                  }`}
                  strokeWidth={isActive ? 2.15 : 1.85}
                />
              </span>
              <span
                className={`max-w-full truncate text-[10px] leading-none tracking-wide ${
                  isActive ? "font-semibold text-navy" : "font-medium text-text-muted"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}