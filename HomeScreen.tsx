import { TodayHero }      from "../components/TodayHero";
import { StatsBar }       from "../components/StatsBar";
import { TodayMovements } from "../components/TodayMovements";
import { WeeklyOverview } from "../components/WeeklyOverview";
import type { AppState, AppStateActions } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";
import type { TabId } from "../types/navigation";

interface HomeScreenProps {
  onNavigate: (tab: TabId) => void;
  appState: AppState & AppStateActions;
  ical: IcalState;
}

export function HomeScreen({ onNavigate, appState, ical }: HomeScreenProps) {
  const { isPaymentPaid, togglePaymentStatus, userName } = appState;

  const taskCount = ical.bookings.filter((b) => b.status === "departing").length;

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const weekOverview = weekDays.map((date) => ({
    date: String(date.getDate()),
    dayLabel: ["V", "H", "K", "Sze", "Cs", "P", "Szo"][date.getDay()],
    isToday: date.toDateString() === today.toDateString(),
    arrivals: 0,
    departures: 0,
    occupied: 0,
  }));

  [...ical.bookings, ...ical.futureBookings].forEach((booking) => {
    if (!booking._checkinRaw || !booking._checkoutRaw) return;

    const arrivalDate = new Date(
      Number(booking._checkinRaw.slice(0, 4)),
      Number(booking._checkinRaw.slice(4, 6)) - 1,
      Number(booking._checkinRaw.slice(6, 8))
    );
    const departureDate = new Date(
      Number(booking._checkoutRaw.slice(0, 4)),
      Number(booking._checkoutRaw.slice(4, 6)) - 1,
      Number(booking._checkoutRaw.slice(6, 8))
    );

    weekDays.forEach((currentDay, index) => {
      const dayStart = new Date(currentDay);
      dayStart.setHours(0, 0, 0, 0);

      if (
        arrivalDate.getFullYear() === dayStart.getFullYear() &&
        arrivalDate.getMonth() === dayStart.getMonth() &&
        arrivalDate.getDate() === dayStart.getDate()
      ) {
        weekOverview[index].arrivals++;
      }

      if (dayStart >= arrivalDate && dayStart < departureDate) {
        weekOverview[index].occupied++;
      }

      if (
        departureDate.getFullYear() === dayStart.getFullYear() &&
        departureDate.getMonth() === dayStart.getMonth() &&
        departureDate.getDate() === dayStart.getDate()
      ) {
        weekOverview[index].departures++;
      }
    });
  });

  const stats = [
    {
      id: "1",
      label: "Érkezés ma",
      value: ical.bookings.filter((b) => b.isTodayArrival).length,
      icon: "arrivals" as const,
    },
    {
      id: "2",
      label: "Vendég bent",
      value: ical.bookings.filter((b) => b.status === "staying").length,
      icon: "staying" as const,
    },
    {
      id: "3",
      label: "Távozás ma",
      value: ical.bookings.filter((b) => b.isTodayDeparture).length,
      icon: "departures" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-2">
      <TodayHero ical={ical} userName={userName} />
      <StatsBar items={stats} />
      <div className="section-rule" aria-hidden />
      <section className="card-elevated rounded-2xl px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          Mai feladatok
        </p>
        <p className="mt-1 text-[15px] font-semibold text-text-primary">
          {taskCount} aktív feladat
        </p>
      </section>
      <TodayMovements
        movements={ical.bookings.filter(
          (b) => b.isTodayArrival || b.isTodayDeparture || b.status === "staying"
        )}
        onSeeAll={() => onNavigate("bookings")}
        isPaymentPaid={isPaymentPaid}
        onPaymentToggle={togglePaymentStatus}
      />
      <div className="section-rule" aria-hidden />
      <WeeklyOverview days={weekOverview} compact />
    </div>
  );
}