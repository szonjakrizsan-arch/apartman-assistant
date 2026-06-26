import { ArrowRight } from "lucide-react";
import type { Booking } from "../data/mockData";
import { BookingCard } from "./BookingCard";
import { SectionHeader } from "./SectionHeader";
interface TodayMovementsProps {
  movements: Booking[];
  onSeeAll?: () => void;
  isPaymentPaid: (id: string) => boolean;
  onPaymentToggle: (id: string) => void;
}
export function TodayMovements({
  movements,
  onSeeAll,
  isPaymentPaid,
  onPaymentToggle,
}: TodayMovementsProps) {
const arriving = movements.filter((m) => m.isTodayArrival);
const departing = movements.filter((m) => m.isTodayDeparture);
const staying = movements.filter(
  (m) => !m.isTodayArrival && !m.isTodayDeparture
);
  return (
    <section>
      <SectionHeader
        title="Ma a házban"
        subtitle="Érkezések és távozások"
        action={
          onSeeAll ? (
            <button
              type="button"
              onClick={onSeeAll}
              className="pressable flex items-center gap-0.5 rounded-lg px-1 py-0.5 text-[13px] font-medium text-navy transition-soft"
            >
              Foglalások
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : undefined
        }
      />
<div className="card-elevated mb-3 rounded-xl px-4 py-3 border border-[#63bea230]">
  <div className="grid grid-cols-3 gap-4">
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#df8765]">
        Érkező
      </div>
      <div
  className={
    arriving.length
      ? "text-[18px] font-semibold text-text-primary"
      : "text-[15px] font-medium text-text-secondary"
  }
>
        {arriving.map((b) => b.apartment).join(", ") || "Nincs ma"}
      </div>
    </div>
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#63bea2]">
        Bent van
      </div>
      <div
  className={
    staying.length
      ? "text-[18px] font-semibold text-text-primary"
      : "text-[15px] font-medium text-text-secondary"
  }
>
        {staying.map((b) => b.apartment).join(", ") || "Nincs ma"}
      </div>
    </div>
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#58b3be]">
        Távozó
      </div>
      <div
  className={
    departing.length
      ? "text-[18px] font-semibold text-text-primary"
      : "text-[15px] font-medium text-text-secondary"
  }
>
        {departing.map((b) => b.apartment).join(", ") || "Nincs ma"}
      </div>
    </div>
  </div>
</div>
      <ul className="flex flex-col gap-3">
        {movements.map((booking) => (
          <li key={booking.id}>
            <BookingCard
              booking={booking}
              compact
              paymentChecked={isPaymentPaid(booking.id)}
              onPaymentToggle={() => onPaymentToggle(booking.id)}
              onOpen={() => {}}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
