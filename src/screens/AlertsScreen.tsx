import {
  CalendarHeart,
  Wallet,
  Wrench,
  UserRound,
} from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { alerts } from "../data/mockData";

const alertIcons = {
  booking: CalendarHeart,
  payment: Wallet,
  maintenance: Wrench,
  guest: UserRound,
} as const;

const alertColors = {
  booking: "bg-sky-soft text-sky ring-1 ring-sky/35",
  payment: "bg-amber-soft text-amber ring-1 ring-amber/35",
  maintenance: "bg-lavender-soft text-lavender ring-1 ring-lavender/35",
  guest: "bg-navy-soft text-navy ring-1 ring-navy/35",
} as const;

export function AlertsScreen() {
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <SectionHeader
        title="Értesítések"
        subtitle={unread > 0 ? `${unread} olvasatlan` : "Minden elolvasva"}
      />
      <ul className="flex flex-col gap-3">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const colors = alertColors[alert.type];
          return (
            <li key={alert.id}>
              <article
                className={`flex gap-3.5 rounded-2xl p-4 ${
                  alert.read
                    ? "card-elevated opacity-75"
                    : "card-elevated border-navy/22 bg-gradient-to-r from-navy-soft/25 to-surface-card"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colors}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{alert.title}</h3>
                    {!alert.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {alert.message}
                  </p>
                  <p className="mt-2 text-xs font-medium text-text-muted">
                    {alert.time}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
