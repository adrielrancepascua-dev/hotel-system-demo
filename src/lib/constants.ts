import type { RequestStatus, RequestType, RoomStatus } from "@/lib/types";

export const roomStatusStyles: Record<
  RoomStatus,
  { card: string; badge: string; label: string }
> = {
  ready: {
    card: "bg-emerald-100 border-emerald-400",
    badge: "bg-emerald-600 text-white",
    label: "Ready",
  },
  occupied: {
    card: "bg-rose-100 border-rose-400",
    badge: "bg-rose-600 text-white",
    label: "Occupied",
  },
  cleaning: {
    card: "bg-amber-100 border-amber-400",
    badge: "bg-amber-600 text-white",
    label: "Cleaning",
  },
  needs_cleaning: {
    card: "bg-orange-100 border-orange-400",
    badge: "bg-orange-600 text-white",
    label: "Needs Cleaning",
  },
  maintenance: {
    card: "bg-sky-100 border-sky-400",
    badge: "bg-sky-600 text-white",
    label: "Maintenance",
  },
};

export const requestTypeLabels: Record<RequestType, string> = {
  towels: "Towels Requested",
  housekeeping: "Housekeeping Request",
  late_checkout: "Late Checkout",
  food: "Food Order",
  hotel_services: "View Hotel Services",
};

export const requestStatusStyles: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border border-amber-300",
  completed: "bg-emerald-100 text-emerald-900 border border-emerald-300",
};
