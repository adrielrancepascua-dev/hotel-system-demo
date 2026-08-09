import type {
  RequestStatus,
  RequestType,
  ReservationStatus,
  RoomStatus,
} from "@/lib/types";

/** Desk-facing status labels — notebook language, not task-dispatch */
export const roomStatusStyles: Record<
  RoomStatus,
  { card: string; badge: string; label: string; shortLabel: string; dot: string }
> = {
  ready: {
    card: "bg-emerald-50/80 border-emerald-300/70 dark:bg-emerald-950/25 dark:border-emerald-700/50",
    badge: "bg-emerald-600/90 text-white dark:bg-emerald-700",
    label: "Ready to sell",
    shortLabel: "Ready",
    dot: "bg-emerald-500",
  },
  occupied: {
    card: "bg-rose-50/80 border-rose-300/70 dark:bg-rose-950/25 dark:border-rose-700/50",
    badge: "bg-rose-600/90 text-white dark:bg-rose-700",
    label: "Occupied",
    shortLabel: "In",
    dot: "bg-rose-500",
  },
  cleaning: {
    card: "bg-amber-50/80 border-amber-300/70 dark:bg-amber-950/25 dark:border-amber-700/50",
    badge: "bg-amber-600/90 text-white dark:bg-amber-700",
    label: "Being cleaned",
    shortLabel: "Cleaning",
    dot: "bg-amber-500",
  },
  needs_cleaning: {
    card: "bg-orange-50/80 border-orange-300/70 dark:bg-orange-950/25 dark:border-orange-700/50",
    badge: "bg-orange-600/90 text-white dark:bg-orange-700",
    label: "Dirty — radio HK",
    shortLabel: "Dirty",
    dot: "bg-orange-500",
  },
  maintenance: {
    card: "bg-sky-50/80 border-sky-300/70 dark:bg-sky-950/25 dark:border-sky-700/50",
    badge: "bg-sky-600/90 text-white dark:bg-sky-700",
    label: "Broken / can't sell",
    shortLabel: "Broken",
    dot: "bg-sky-500",
  },
};

export const roomStatusLabels: Record<RoomStatus, string> = {
  ready: "Ready to sell",
  occupied: "Occupied",
  cleaning: "Being cleaned",
  needs_cleaning: "Dirty",
  maintenance: "Broken",
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  booked: "Booked",
  checked_in: "In-house",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "Waiting",
  completed: "Done",
};

export const requestTypeLabels: Record<RequestType, string> = {
  towels: "Extra towels",
  housekeeping: "Room tidy-up",
  late_checkout: "Late checkout",
  food: "Food order",
  hotel_services: "Hotel info",
  digital_checkout: "Checkout request",
};

export const requestStatusStyles: Record<RequestStatus, string> = {
  pending:
    "bg-amber-100/80 text-amber-900 border border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50",
  completed:
    "bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/50",
};

export const reservationSourceLabels = {
  walk_in: "Walk-in",
  ota: "Agoda / Booking",
  phone: "Phone / Viber",
} as const;

export const paymentMethodLabels = {
  cash: "Cash",
  card: "Card",
  gcash: "GCash",
  maya: "Maya",
  transfer: "Bank transfer",
} as const;

export const staffRoleLabels = {
  frontdesk: "Front Desk",
  housekeeping: "Housekeeping",
  manager: "Manager",
} as const;
