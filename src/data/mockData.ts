export type PaymentStatus  = "paid" | "pending" | "partial";
export type BookingSource  = "Airbnb" | "Booking" | "Szallas.hu" | "Google" | "VRBO" | "TripAdvisor" | "Expedia";
export type ApartmentAccent = "coral" | "sage" | "sky" | "lavender" | "amber";
export type BookingStatus  = "arriving" | "staying" | "departing";

export interface FutureBooking {
  id: string;
  apartment: string;
  arrival: string;          /* display string, e.g. "jún. 3." */
  nights: number;
  source: BookingSource;
  guestName?: string;       /* optional — may not exist from iCal */
  accent: ApartmentAccent;
_checkinRaw?:  string;
  _checkoutRaw?: string;
  hasSourceConflict?: boolean;
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  icon: "arrivals" | "staying" | "departures";
}

export interface Booking {
  id: string;
  apartment: string;
  arrival: string;
  departure: string;
  nights: number;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  guestName?: string;      /* iCal bookings may not have this */
  accent: ApartmentAccent;
  status: BookingStatus;
  isTodayArrival?: boolean;
  isTodayDeparture?: boolean;
  hasSourceConflict?: boolean;
  singleSourceRisk?: boolean;
  
  /* diagnostic fields — raw iCal data */
  _uid?: string;
  _summary?: string;
  _checkinRaw?: string;
  _checkoutRaw?: string;
  _isActiveRaw?: boolean;
}

export interface WeekDay {
  date: string;
  dayLabel: string;
  isToday: boolean;
  arrivals: number;
  departures: number;
  occupied: number;
}


export interface Alert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "booking" | "payment" | "maintenance" | "guest";
  read: boolean;
}

export const stats: StatItem[] = [
  { id: "1", label: "Érkezés ma",  value: 3,  icon: "arrivals"   },
  { id: "2", label: "Vendég bent", value: 12, icon: "staying"    },
  { id: "3", label: "Távozás ma",  value: 2,  icon: "departures" },
];

/** Fallback empty array — real bookings come from useIcalBookings hook */
export const bookings: Booking[] = [];

export const todayMovements = bookings.filter(
  (b) => b.isTodayArrival || b.isTodayDeparture,
);

export const weekOverview: WeekDay[] = [
  { date: "12", dayLabel: "H",   isToday: false, arrivals: 1, departures: 0, occupied: 9  },
  { date: "13", dayLabel: "K",   isToday: false, arrivals: 2, departures: 1, occupied: 10 },
  { date: "14", dayLabel: "Sze", isToday: false, arrivals: 0, departures: 2, occupied: 8  },
  { date: "15", dayLabel: "Cs",  isToday: false, arrivals: 1, departures: 1, occupied: 8  },
  { date: "16", dayLabel: "P",   isToday: true,  arrivals: 3, departures: 2, occupied: 12 },
  { date: "17", dayLabel: "Szo", isToday: false, arrivals: 2, departures: 1, occupied: 13 },
  { date: "18", dayLabel: "V",   isToday: false, arrivals: 1, departures: 0, occupied: 14 },
];


export const alerts: Alert[] = [
  {
    id: "1",
    title: "Új foglalás",
    message: "Horváth Gábor — Belváros Loft, máj. 17-től",
    time: "8 perce",
    type: "booking",
    read: false,
  },
  {
    id: "2",
    title: "Fizetés függőben",
    message: "Németh Zsuzsa részleges befizetése hiányzik",
    time: "1 órája",
    type: "payment",
    read: false,
  },
  {
    id: "3",
    title: "Kulcsátadás ma",
    message: "Schmidt Anna 15:00 körül érkezik — Panoráma Studio",
    time: "Ma",
    type: "guest",
    read: false,
  },
  {
    id: "4",
    title: "Mosógép karbantartás",
    message: "Kertész Premium — szerviz jövő héten",
    time: "Tegnap",
    type: "maintenance",
    read: true,
  },
];

/** Fallback empty array — real future bookings come from useIcalBookings hook */
export const futureBookings: FutureBooking[] = [];
