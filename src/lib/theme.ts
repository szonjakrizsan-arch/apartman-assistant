import type { ApartmentAccent, BookingSource, PaymentStatus } from "../data/mockData";

export const accentStyles: Record<
  ApartmentAccent,
  { stripe: string; avatar: string; icon: string }
> = {
  coral: {
    stripe: "from-[#7ba3d4] to-[#6eceaa]",
    avatar: "from-[#7ba3d4] to-[#5a8fc4]",
    icon: "text-navy bg-navy-soft ring-1 ring-navy/22",
  },
  sage: {
    stripe: "from-[#6eceaa] to-[#52b090]",
    avatar: "from-[#6eceaa] to-[#45a080]",
    icon: "text-[#6eceaa] bg-[#6eceaa28] ring-1 ring-[#6eceaa30]",
  },
  sky: {
    stripe: "from-[#75b8de] to-[#5a9fc8]",
    avatar: "from-[#75b8de] to-[#4d8ab5]",
    icon: "text-[#75b8de] bg-[#75b8de30] ring-1 ring-[#75b8de40]",
  },
  lavender: {
    stripe: "from-[#a99fd4] to-[#8e84c0]",
    avatar: "from-[#a99fd4] to-[#7a70b0]",
    icon: "text-[#a99fd4] bg-[#a99fd430] ring-1 ring-[#a99fd440]",
  },
  amber: {
    stripe: "from-[#e8bc5a] to-[#d4a048]",
    avatar: "from-[#e8bc5a] to-[#c9a03d]",
    icon: "text-[#e8bc5a] bg-[#e8bc5a30] ring-1 ring-[#e8bc5a40]",
  },
};

export const sourceStyles: Record<
  BookingSource,
  { badge: string; label: string }
> = {
  Airbnb: {
    badge: "bg-[#ff5a5f1a] text-[#e8a0a3] ring-1 ring-[#ff5a5f30]",
    label: "Airbnb",
  },
  Booking: {
    badge: "bg-[#4f6f9a35] text-[#9bb8e0] ring-1 ring-[#7ba3d450]",
    label: "Booking",
  },
  "Szallas.hu": {
    badge: "bg-navy-soft text-navy/90 ring-1 ring-navy/20",
    label: "Szallas.hu",
  },
  Google: {
    badge: "bg-[#4285f41a] text-[#8ab4f8] ring-1 ring-[#4285f430]",
    label: "Google",
  },
  VRBO: {
    badge: "bg-[#3b5ca01a] text-[#8fa8d8] ring-1 ring-[#3b5ca030]",
    label: "VRBO",
  },
  TripAdvisor: {
    badge: "bg-[#34e0a11a] text-[#7fe0bc] ring-1 ring-[#34e0a130]",
    label: "TripAdvisor",
  },
  Expedia: {
    badge: "bg-[#f9c0001a] text-[#e0c060] ring-1 ring-[#f9c00030]",
    label: "Expedia",
  },
};

export const paymentLabels: Record<PaymentStatus, string> = {
  paid:    "Rendben",
  pending: "Ellenőrizendő",
  partial: "Előleg",
};

export const paymentStyles: Record<PaymentStatus, string> = {
  paid:    "bg-[#5abf8a14] text-[#5abf8a] ring-1 ring-[#5abf8a28]",
  pending: "bg-[#d9ab4e14] text-[#d9ab4e] ring-1 ring-[#d9ab4e28]",
  partial: "bg-[#6aa6cc14] text-[#6aa6cc] ring-1 ring-[#6aa6cc28]",
};

export function guestInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
