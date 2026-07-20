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
  hasApartments: boolean;
  onAddDemo: () => void;
}
export function HomeScreen({ onNavigate, appState, ical, hasApartments, onAddDemo }: HomeScreenProps) {
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

  // Naponta EGYEDI apartman-neveket gyűjtünk (Set), nem foglalásokat
  // számolunk. Így ha egy apartmannak két forrásból (pl. Airbnb és
  // Szállás.hu) is van egymást átfedő bejegyzése ugyanarra az időszakra,
  // az az egy apartman csak egyszer számít bele az adott nap
  // érkezés/foglaltság/távozás értékébe — nem kétszer.
  const arrivalApartmentsByDay: Set<string>[] = weekDays.map(() => new Set());
  const occupiedApartmentsByDay: Set<string>[] = weekDays.map(() => new Set());
  const departureApartmentsByDay: Set<string>[] = weekDays.map(() => new Set());

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
        arrivalApartmentsByDay[index].add(booking.apartment);
      }

      if (dayStart >= arrivalDate && dayStart < departureDate) {
        occupiedApartmentsByDay[index].add(booking.apartment);
      }

      if (
        departureDate.getFullYear() === dayStart.getFullYear() &&
        departureDate.getMonth() === dayStart.getMonth() &&
        departureDate.getDate() === dayStart.getDate()
      ) {
        departureApartmentsByDay[index].add(booking.apartment);
      }
    });
  });

  weekOverview.forEach((day, index) => {
    day.arrivals = arrivalApartmentsByDay[index].size;
    day.occupied = occupiedApartmentsByDay[index].size;
    day.departures = departureApartmentsByDay[index].size;
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

  if (!hasApartments) {
    return (
      <div className="flex flex-col gap-6 pb-2">
        <TodayHero ical={ical} userName={userName} />
        <section className="card-elevated rounded-2xl px-5 py-8 text-center flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgb(99 190 162 / 0.12)", outline: "1px solid rgb(99 190 162 / 0.22)" }}>
            <span className="text-[26px]" aria-hidden>🏠</span>
          </span>
          <h2 className="text-[17px] font-bold text-text-primary">
            Üdv az Apartman Assistantban!
          </h2>
          <p className="text-[13px] text-text-secondary max-w-xs leading-relaxed">
            Kezdésként add hozzá az első apartmanod, és kösd hozzá a naptáradat
            (Szállás.hu, Airbnb, Booking.com). A foglalásaid ezután automatikusan megjelennek itt.
          </p>
          <button type="button" onClick={() => onNavigate("apartments")}
            className="pressable mt-2 rounded-xl px-6 py-3 text-[13px] font-semibold"
            style={{ background: "rgb(86 176 187 / 0.20)", color: "#56b0bb", outline: "1px solid rgb(86 176 187 / 0.30)" }}>
            Első apartman hozzáadása →
          </button>
          <button type="button" onClick={onAddDemo}
            className="pressable text-[13px] font-bold text-white underline underline-offset-2">
            Inkább kipróbálom demo adatokkal
          </button>
          <p className="text-[11px] text-text-muted max-w-xs mt-1">
            Az iCal naptárlinket a foglalási oldal beállításaiban találod
            („Naptár szinkronizálás" vagy „iCal export" néven).
          </p>
        </section>
      </div>
    );
  }

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

