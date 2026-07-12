import type {
  FolioCharge,
  FolioRecord,
  HotelState,
  PaymentRecord,
  RequestRecord,
  ReservationRecord,
  RoomRecord,
  RoomStatus,
  RoomStatusEvent,
  RoomTypeRecord,
  StaffMember,
} from "@/lib/types";

export const ROOM_TYPES: RoomTypeRecord[] = [
  { id: 1, name: "Standard", capacity: 2, base_rate: 89 },
  { id: 2, name: "Deluxe", capacity: 3, base_rate: 129 },
  { id: 3, name: "Suite", capacity: 4, base_rate: 189 },
];

export const STAFF_MEMBERS: StaffMember[] = [
  { id: 1, name: "Maya Chen", role: "frontdesk" },
  { id: 2, name: "Jordan Blake", role: "frontdesk" },
  { id: 3, name: "Sofia Rivera", role: "housekeeping" },
  { id: 4, name: "Sam Okonkwo", role: "housekeeping" },
  { id: 5, name: "Alex Morgan", role: "manager" },
];

const statusCycle: RoomStatus[] = [
  "ready",
  "occupied",
  "needs_cleaning",
  "cleaning",
  "maintenance",
];

const guestNames = [
  "Alex Rivera",
  "Maya Thompson",
  "Noah Patel",
  "Zoe Kim",
  "Omar Hassan",
  "Emma Brooks",
  "Liam Chen",
  "Sofia Martin",
];

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function guestNameForRoom(roomNumber: string): string {
  const numeric = Number(roomNumber.replace(/\D/g, ""));
  return guestNames[numeric % guestNames.length] ?? "Guest";
}

export function buildDemoRooms(): RoomRecord[] {
  return Array.from({ length: 20 }, (_, idx) => {
    const roomNumber = String(101 + idx);
    const floor = Math.floor((101 + idx) / 100);
    const roomTypeId = (idx % 3) + 1;

    return {
      id: idx + 1,
      room_number: roomNumber,
      status: statusCycle[idx % statusCycle.length],
      last_updated: new Date(Date.now() - idx * 30 * 60 * 1000).toISOString(),
      room_type_id: roomTypeId,
      floor,
    };
  });
}

export function buildDemoRequests(): RequestRecord[] {
  return [
    {
      id: 1,
      room_number: "104",
      request_type: "towels",
      status: "pending",
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      notes: "Extra bath towels for two guests",
      photo_url: null,
      completed_by_staff_id: null,
      completed_at: null,
    },
    {
      id: 2,
      room_number: "118",
      request_type: "late_checkout",
      status: "pending",
      created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      notes: "Requesting 2pm checkout",
      photo_url: null,
      completed_by_staff_id: null,
      completed_at: null,
    },
    {
      id: 3,
      room_number: "115",
      request_type: "housekeeping",
      status: "pending",
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      notes: null,
      photo_url: null,
      completed_by_staff_id: null,
      completed_at: null,
    },
  ];
}

function buildOccupiedReservations(rooms: RoomRecord[]): {
  reservations: ReservationRecord[];
  folios: FolioRecord[];
  charges: FolioCharge[];
  payments: PaymentRecord[];
} {
  const occupied = rooms.filter((r) => r.status === "occupied");
  const reservations: ReservationRecord[] = [];
  const folios: FolioRecord[] = [];
  const charges: FolioCharge[] = [];
  const payments: PaymentRecord[] = [];

  occupied.forEach((room, idx) => {
    const roomType = ROOM_TYPES.find((t) => t.id === room.room_type_id)!;
    const checkIn = isoDaysFromNow(-1 - (idx % 2));
    const checkOut = isoDaysFromNow(1 + (idx % 3));
    const nights = nightsBetween(checkIn, checkOut);
    const reservationId = idx + 1;
    const folioId = idx + 1;
    const sources = ["walk_in", "ota", "phone"] as const;

    reservations.push({
      id: reservationId,
      room_id: room.id,
      guest_name: guestNameForRoom(room.room_number),
      email: `guest${room.room_number}@example.com`,
      phone: `+1-555-01${String(room.room_number).slice(-2)}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      source: sources[idx % 3],
      status: "checked_in",
      nightly_rate: roomType.base_rate,
      created_at: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
    });

    folios.push({
      id: folioId,
      reservation_id: reservationId,
      status: "open",
      created_at: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
      closed_at: null,
    });

    charges.push({
      id: folioId,
      folio_id: folioId,
      description: `Room ${room.room_number} · ${nights} night${nights > 1 ? "s" : ""}`,
      amount: roomType.base_rate * nights,
      category: "room",
      created_at: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
    });

    if (idx % 2 === 0) {
      payments.push({
        id: payments.length + 1,
        folio_id: folioId,
        amount: Math.round(roomType.base_rate * 0.5),
        method: "card",
        paid_at: new Date(Date.now() - idx * 1800 * 1000).toISOString(),
      });
    }
  });

  // One checked-out historical stay for reports
  const readyRoom = rooms.find((r) => r.status === "ready");
  if (readyRoom) {
    const roomType = ROOM_TYPES.find((t) => t.id === readyRoom.room_type_id)!;
    const reservationId = reservations.length + 1;
    const folioId = folios.length + 1;
    const checkIn = isoDaysFromNow(-5);
    const checkOut = isoDaysFromNow(-3);
    const nights = nightsBetween(checkIn, checkOut);

    reservations.push({
      id: reservationId,
      room_id: readyRoom.id,
      guest_name: "Harper Lane",
      email: "harper@example.com",
      phone: "+1-555-0199",
      check_in_date: checkIn,
      check_out_date: checkOut,
      source: "ota",
      status: "checked_out",
      nightly_rate: roomType.base_rate,
      created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    });

    folios.push({
      id: folioId,
      reservation_id: reservationId,
      status: "closed",
      created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    });

    const roomCharge = roomType.base_rate * nights;
    charges.push({
      id: charges.length + 1,
      folio_id: folioId,
      description: `Room ${readyRoom.room_number} · ${nights} nights`,
      amount: roomCharge,
      category: "room",
      created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    });

    payments.push({
      id: payments.length + 1,
      folio_id: folioId,
      amount: roomCharge,
      method: "card",
      paid_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    });
  }

  return { reservations, folios, charges, payments };
}

export function buildInitialHotelState(): HotelState {
  const rooms = buildDemoRooms();
  const { reservations, folios, charges, payments } = buildOccupiedReservations(rooms);
  const statusEvents: RoomStatusEvent[] = rooms.slice(0, 5).map((room, idx) => ({
    id: idx + 1,
    room_id: room.id,
    from_status: "cleaning",
    to_status: room.status,
    staff_id: 3,
    at: new Date(Date.now() - idx * 45 * 60 * 1000).toISOString(),
  }));

  return {
    roomTypes: ROOM_TYPES,
    rooms,
    staff: STAFF_MEMBERS,
    reservations,
    folios,
    charges,
    payments,
    requests: buildDemoRequests(),
    statusEvents,
    activeStaffId: 1,
  };
}

export function nightsForStay(checkIn: string, checkOut: string): number {
  return nightsBetween(checkIn, checkOut);
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
