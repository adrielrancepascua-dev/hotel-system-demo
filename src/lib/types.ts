export const ROOM_STATUSES = [
  "occupied",
  "needs_cleaning",
  "cleaning",
  "ready",
  "maintenance",
] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const REQUEST_TYPES = [
  "towels",
  "housekeeping",
  "late_checkout",
  "food",
  "hotel_services",
  "digital_checkout",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ["pending", "completed"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STAFF_ROLES = ["frontdesk", "housekeeping", "manager"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const RESERVATION_SOURCES = ["walk_in", "ota", "phone"] as const;

export type ReservationSource = (typeof RESERVATION_SOURCES)[number];

export const RESERVATION_STATUSES = [
  "booked",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const FOLIO_STATUSES = ["open", "closed"] as const;

export type FolioStatus = (typeof FOLIO_STATUSES)[number];

export const CHARGE_CATEGORIES = ["room", "fnb", "service", "other"] as const;

export type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];

export const PAYMENT_METHODS = ["cash", "card", "gcash", "maya", "transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type OpsFilter = "all" | "frontdesk" | "housekeeping";

export interface RoomTypeRecord {
  id: number;
  name: string;
  capacity: number;
  base_rate: number;
}

export interface RoomRecord {
  id: number;
  room_number: string;
  status: RoomStatus;
  last_updated: string;
  room_type_id: number;
  floor: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
}

export interface ReservationRecord {
  id: number;
  room_id: number;
  guest_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  source: ReservationSource;
  status: ReservationStatus;
  nightly_rate: number;
  created_at: string;
}

export interface FolioRecord {
  id: number;
  reservation_id: number;
  status: FolioStatus;
  created_at: string;
  closed_at: string | null;
}

export interface FolioCharge {
  id: number;
  folio_id: number;
  description: string;
  amount: number;
  category: ChargeCategory;
  created_at: string;
}

export interface PaymentRecord {
  id: number;
  folio_id: number;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
}

export interface RequestRecord {
  id: number;
  room_number: string;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
  notes: string | null;
  photo_url: string | null;
  completed_by_staff_id: number | null;
  completed_at: string | null;
}

export interface RoomStatusEvent {
  id: number;
  room_id: number;
  from_status: RoomStatus;
  to_status: RoomStatus;
  staff_id: number | null;
  at: string;
}

export interface HotelState {
  roomTypes: RoomTypeRecord[];
  rooms: RoomRecord[];
  staff: StaffMember[];
  reservations: ReservationRecord[];
  folios: FolioRecord[];
  charges: FolioCharge[];
  payments: PaymentRecord[];
  requests: RequestRecord[];
  statusEvents: RoomStatusEvent[];
  activeStaffId: number | null;
}

export interface CheckInInput {
  roomId: number;
  guestName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  source: ReservationSource;
  nightlyRate?: number;
}
