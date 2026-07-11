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
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ["pending", "completed"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type StaffRole = "frontdesk" | "housekeeping";

export interface RoomRecord {
  id: number;
  room_number: string;
  status: RoomStatus;
  last_updated: string;
}

export interface RequestRecord {
  id: number;
  room_number: string;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
}
