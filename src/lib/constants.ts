import type { RequestStatus, RequestType, RoomStatus } from "@/lib/types";

export const roomStatusStyles: Record<
  RoomStatus,
  { card: string; badge: string; label: string; dot: string }
> = {
  ready: {
    card: "bg-emerald-50/80 border-emerald-300/70 dark:bg-emerald-950/25 dark:border-emerald-700/50",
    badge: "bg-emerald-600/90 text-white dark:bg-emerald-700",
    label: "Ready",
    dot: "bg-emerald-500",
  },
  occupied: {
    card: "bg-rose-50/80 border-rose-300/70 dark:bg-rose-950/25 dark:border-rose-700/50",
    badge: "bg-rose-600/90 text-white dark:bg-rose-700",
    label: "Occupied",
    dot: "bg-rose-500",
  },
  cleaning: {
    card: "bg-amber-50/80 border-amber-300/70 dark:bg-amber-950/25 dark:border-amber-700/50",
    badge: "bg-amber-600/90 text-white dark:bg-amber-700",
    label: "Cleaning",
    dot: "bg-amber-500",
  },
  needs_cleaning: {
    card: "bg-orange-50/80 border-orange-300/70 dark:bg-orange-950/25 dark:border-orange-700/50",
    badge: "bg-orange-600/90 text-white dark:bg-orange-700",
    label: "Needs Cleaning",
    dot: "bg-orange-500",
  },
  maintenance: {
    card: "bg-sky-50/80 border-sky-300/70 dark:bg-sky-950/25 dark:border-sky-700/50",
    badge: "bg-sky-600/90 text-white dark:bg-sky-700",
    label: "Maintenance",
    dot: "bg-sky-500",
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
  pending: "bg-amber-100/80 text-amber-900 border border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50",
  completed: "bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/50",
};
