import { Receipt, AlertCircle, CheckCircle2, Banknote } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, AppStateActions } from "../data/appState";
import { deriveInvoices, methodLabel, parseAmount, formatFt } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";

interface InvoicesScreenProps {
  appState: AppState & AppStateActions;
  ical?: IcalState;  /* optional — invoices show all time, not just today */
}

const displayConfig = {
  paid: {
    label: "Fizetve",
    color: "#5abf8a",
    bg: "rgb(90 191 138 / 0.12)",
    border: "rgb(90 191 138 / 0.28)",
    Icon: CheckCircle2,
  },
  pending: {
    label: "Függőben",
    color: "#ddb055",
    bg: "rgb(217 171 78 / 0.12)",
    border: "rgb(217 171 78 / 0.28)",
    Icon: Receipt,
  },
  overdue: {
    label: "Lejárt",
    color: "#e08060",
    bg: "rgb(220 132 96 / 0.12)",
    border: "rgb(220 132 96 / 0.30)",
    Icon: AlertCircle,
  },
  partial: {
    label: "Részben",
    color: "#e8a84a",
    bg: "rgb(232 168 74 / 0.15)",
    border: "rgb(232 168 74 / 0.45)",
    Icon: Banknote,
  },
} as const;

export function InvoicesScreen({ appState, ical }: InvoicesScreenProps) {
  const { paymentData, setPayment, getPayment } = appState;
  const liveBookings = ical?.bookings ?? [];
  const invoices = deriveInvoices(liveBookings, paymentData);

  const paidCount    = invoices.filter((i) => i.displayStatus === "paid").length;
  const pendingCount = invoices.filter((i) => i.displayStatus !== "paid").length;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <SectionHeader
        title="Számlák"
        subtitle={pendingCount > 0 ? `${pendingCount} nyitott` : "Minden rendezve"}
      />

      {invoices.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center"
          style={{ borderColor: "rgb(86 176 187 / 0.18)" }}
        >
          <Banknote className="h-8 w-8 text-text-muted" />
          <p className="text-[13px] text-text-secondary">
            Nincs számlázható foglalás.
          </p>
          <p className="text-[11px] text-text-muted">
            Adjon meg összeget a foglalás részleteinél.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {invoices.map((inv) => {
            const cfg = displayConfig[inv.displayStatus];
            const StatusIcon = cfg.Icon;
            return (
              <li key={inv.bookingId}>
                <article
                  className="card-elevated rounded-2xl p-4"
                  style={inv.displayStatus === "overdue"
                    ? { borderColor: "rgb(220 132 96 / 0.35)", background: "linear-gradient(135deg, rgb(220 132 96 / 0.06), #2a3230)" }
                    : {}}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14px] font-semibold" style={{ color: "#F4F0E8" }}>
                        {inv.apartment}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-text-secondary">
                      {methodLabel(inv.method)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                      {inv.arrival} → {inv.departure}
                      </p>
                    </div>
                    {/* Status badge — tappable to toggle paid/pending */}
                    <button
                      type="button"
                      onClick={() => {
                        const current = getPayment(inv.bookingId);
                        setPayment(inv.bookingId, {
                          ...current,
                          status: current.status === "paid" ? "pending" : "paid",
                        });
                      }}
                      className="pressable shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-soft"
                      style={{ background: cfg.bg, color: cfg.color, outline: `1px solid ${cfg.border}` }}
                      aria-label={`Státusz: ${cfg.label} — koppints a váltáshoz`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                      {cfg.label}
                    </button>
                  </div>

                  {/* Amount row */}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">Összeg</p>
                      <p className="text-[20px] font-bold" style={{ color: "#7dd4dd" }}>
                        {inv.amount}
                      </p>
                      {parseAmount(inv.deposit) > 0 && inv.displayStatus !== "paid" && (
                        <p className="mt-1 text-[11px]" style={{ color: "#ddb055" }}>
                          Előleg: {inv.deposit} · Még fizetendő: <span className="font-bold">{formatFt(inv.remaining)}</span>
                        </p>
                      )}
                    </div>
                    {inv.displayStatus === "overdue" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#e08060" }}>
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                        Fizetés szükséges
                      </span>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {invoices.length > 0 && (
        <p className="text-center text-[11px] text-text-muted">
          {paidCount} / {invoices.length} rendezve · Számlák a foglalásokból deriválva
        </p>
      )}
    </div>
  );
}
