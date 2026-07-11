import type { RequestRecord, RoomRecord, RoomStatus } from "@/lib/types";

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

export function guestNameForRoom(roomNumber: string): string {
  const numeric = Number(roomNumber.replace(/\D/g, ""));
  return guestNames[numeric % guestNames.length] ?? "Guest";
}

export function buildDemoRooms(): RoomRecord[] {
  return Array.from({ length: 20 }, (_, idx) => {
    const roomNumber = String(101 + idx);

    return {
      id: idx + 1,
      room_number: roomNumber,
      status: statusCycle[idx % statusCycle.length],
      last_updated: new Date(Date.now() - idx * 30 * 60 * 1000).toISOString(),
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
    },
    {
      id: 2,
      room_number: "118",
      request_type: "late_checkout",
      status: "pending",
      created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      room_number: "115",
      request_type: "housekeeping",
      status: "pending",
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ];
}
