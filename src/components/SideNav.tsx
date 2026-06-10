import { Home, CalendarRange, ListChecks, Receipt, Users, Building2 } from "lucide-react";
import type { TabId } from "../types/navigation";
import { supabase } from "../supabaseClient";

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home",       label: "Kezdőlap",    icon: Home },
  { id: "bookings",   label: "Foglalások",  icon: CalendarRange },
  { id: "tasks",      label: "Feladatok",   icon: ListChecks },
  { id: "invoices",   label: "Számlák",     icon: Receipt },
  { id: "contacts",   label: "Kapcsolatok", icon: Users },
  { id: "apartments", label: "Apartmanok",  icon: Building2 },
];

interface SideNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function SideNav({ active, onChange }: SideNavProps) {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-dvh border-r sticky top-0"
      style={{
        background: "var(--color-surface-raised)",
        borderColor: "var(--color-border-faint)",
      }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-border-faint)" }}>
        <p className="text-[13px] font-bold text-text-primary">Apartman Assistant</p>
        <p className="text-[11px] text-text-muted mt-0.5">Kezelőfelület</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="pressable flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-soft w-full"
              style={{
                background: isActive ? "rgb(86 176 187 / 0.12)" : "transparent",
                color: isActive ? "#56b0bb" : "var(--color-text-secondary)",
                outline: isActive ? "1px solid rgb(86 176 187 / 0.20)" : "1px solid transparent",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[13px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t flex flex-col gap-2" style={{ borderColor: "var(--color-border-faint)" }}>
        <p className="text-[10px] text-text-muted">v1.0 · Apartman Assistant</p>
        <button type="button"
          onClick={() => supabase.auth.signOut()}
          className="pressable text-left text-[11px] font-medium transition-soft"
          style={{ color: "rgb(207 102 85 / 0.7)" }}>
          Kijelentkezés
        </button>
      </div>
    </aside>
  );
}