import type {
  FolioCharge,
  FolioRecord,
  HotelState,
  PaymentRecord,
  ReservationRecord,
  RoomRecord,
  RoomTypeRecord,
} from "@/lib/types";

export interface HotelMetrics {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  revenueToday: number;
  revenueMtd: number;
  adr: number;
  revpar: number;
  openFolioBalance: number;
  pendingRequests: number;
  byRoomType: Array<{ name: string; occupied: number; total: number; revenue: number }>;
  bySource: Array<{ source: string; count: number; revenue: number }>;
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function paymentRevenueInRange(
  payments: PaymentRecord[],
  predicate: (d: Date) => boolean,
): number {
  return payments.reduce((sum, payment) => {
    const paidAt = new Date(payment.paid_at);
    return predicate(paidAt) ? sum + payment.amount : sum;
  }, 0);
}

function folioTotalCharges(folioId: number, charges: FolioCharge[]): number {
  return charges
    .filter((c) => c.folio_id === folioId)
    .reduce((sum, c) => sum + c.amount, 0);
}

function folioTotalPayments(folioId: number, payments: PaymentRecord[]): number {
  return payments
    .filter((p) => p.folio_id === folioId)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function folioBalance(
  folioId: number,
  charges: FolioCharge[],
  payments: PaymentRecord[],
): number {
  return folioTotalCharges(folioId, charges) - folioTotalPayments(folioId, payments);
}

export function computeMetrics(state: HotelState): HotelMetrics {
  const { rooms, roomTypes, reservations, folios, charges, payments, requests } = state;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

  const today = new Date();
  const monthStart = startOfMonth(today);

  const revenueToday = paymentRevenueInRange(payments, (d) => isSameDay(d, today));
  const revenueMtd = paymentRevenueInRange(payments, (d) => d >= monthStart);

  const checkedIn = reservations.filter((r) => r.status === "checked_in");
  const adrBase =
    checkedIn.length === 0
      ? 0
      : checkedIn.reduce((sum, r) => sum + r.nightly_rate, 0) / checkedIn.length;
  const adr = Math.round(adrBase);
  const revpar = Math.round((adrBase * occupiedRooms) / Math.max(totalRooms, 1));

  const openFolioBalance = folios
    .filter((f) => f.status === "open")
    .reduce((sum, f) => sum + folioBalance(f.id, charges, payments), 0);

  const byRoomType = roomTypes.map((type) => {
    const typeRooms = rooms.filter((r) => r.room_type_id === type.id);
    const occupied = typeRooms.filter((r) => r.status === "occupied").length;
    const revenue = reservations
      .filter((res) => {
        const room = rooms.find((r) => r.id === res.room_id);
        return room?.room_type_id === type.id && res.status !== "cancelled";
      })
      .reduce((sum, res) => {
        const folio = folios.find((f) => f.reservation_id === res.id);
        if (!folio) return sum;
        return sum + folioTotalPayments(folio.id, payments);
      }, 0);

    return {
      name: type.name,
      occupied,
      total: typeRooms.length,
      revenue,
    };
  });

  const sources = ["walk_in", "ota", "phone"] as const;
  const bySource = sources.map((source) => {
    const matching = reservations.filter(
      (r) => r.source === source && r.status !== "cancelled",
    );
    const revenue = matching.reduce((sum, res) => {
      const folio = folios.find((f) => f.reservation_id === res.id);
      if (!folio) return sum;
      return sum + folioTotalPayments(folio.id, payments);
    }, 0);

    return { source, count: matching.length, revenue };
  });

  return {
    totalRooms,
    occupiedRooms,
    occupancyRate,
    revenueToday,
    revenueMtd,
    adr,
    revpar,
    openFolioBalance,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    byRoomType,
    bySource,
  };
}

export function getRoomType(
  room: RoomRecord,
  roomTypes: RoomTypeRecord[],
): RoomTypeRecord | undefined {
  return roomTypes.find((t) => t.id === room.room_type_id);
}

export function getActiveReservation(
  roomId: number,
  reservations: ReservationRecord[],
): ReservationRecord | undefined {
  return reservations.find(
    (r) => r.room_id === roomId && (r.status === "checked_in" || r.status === "booked"),
  );
}

export function getFolioForReservation(
  reservationId: number,
  folios: FolioRecord[],
): FolioRecord | undefined {
  return folios.find((f) => f.reservation_id === reservationId);
}
