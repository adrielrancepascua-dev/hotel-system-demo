"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildInitialHotelState, nightsForStay } from "@/lib/demo";
import { folioBalance } from "@/lib/metrics";
import type {
  CheckInInput,
  ChargeCategory,
  HotelState,
  OpsFilter,
  PaymentMethod,
  RequestType,
  ReservationSource,
  RoomStatus,
} from "@/lib/types";

const STORAGE_KEY = "demo-hotel-ph-state-v1";

type DemoStoreValue = {
  state: HotelState;
  hydrated: boolean;
  setActiveStaff: (staffId: number) => void;
  updateRoomStatus: (roomId: number, nextStatus: RoomStatus) => void;
  checkInGuest: (input: CheckInInput) => { reservationId: number; folioId: number } | null;
  checkOutGuest: (roomId: number, closeFolio: boolean) => void;
  createReservation: (input: CheckInInput & { status?: "booked" | "checked_in" }) => number | null;
  activateBookedReservation: (reservationId: number) => boolean;
  addCharge: (
    folioId: number,
    description: string,
    amount: number,
    category: ChargeCategory,
  ) => void;
  addPayment: (folioId: number, amount: number, method: PaymentMethod) => void;
  closeFolio: (folioId: number) => void;
  createRequest: (input: {
    roomNumber: string;
    requestType: RequestType;
    notes?: string | null;
    photoUrl?: string | null;
  }) => void;
  completeRequest: (requestId: number) => void;
  resetDemo: () => void;
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function nextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function loadState(): HotelState {
  if (typeof window === "undefined") {
    return buildInitialHotelState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildInitialHotelState();
    }
    const parsed = JSON.parse(raw) as HotelState;
    if (!parsed.rooms?.length || !parsed.roomTypes?.length) {
      return buildInitialHotelState();
    }
    return parsed;
  } catch {
    return buildInitialHotelState();
  }
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HotelState>(buildInitialHotelState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const setActiveStaff = useCallback((staffId: number) => {
    setState((prev) => ({ ...prev, activeStaffId: staffId }));
  }, []);

  const updateRoomStatus = useCallback((roomId: number, nextStatus: RoomStatus) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room || room.status === nextStatus) return prev;

      const now = new Date().toISOString();
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId ? { ...r, status: nextStatus, last_updated: now } : r,
        ),
        statusEvents: [
          {
            id: nextId(prev.statusEvents),
            room_id: roomId,
            from_status: room.status,
            to_status: nextStatus,
            staff_id: prev.activeStaffId,
            at: now,
          },
          ...prev.statusEvents,
        ],
      };
    });
  }, []);

  const checkInGuest = useCallback(
    (input: CheckInInput): { reservationId: number; folioId: number } | null => {
      const holder: { value: { reservationId: number; folioId: number } | null } = {
        value: null,
      };

      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === input.roomId);
        if (!room || (room.status !== "ready" && room.status !== "maintenance")) {
          return prev;
        }

        const roomType = prev.roomTypes.find((t) => t.id === room.room_type_id);
        const nightlyRate = input.nightlyRate ?? roomType?.base_rate ?? 0;
        const nights = nightsForStay(input.checkInDate, input.checkOutDate);
        const now = new Date().toISOString();
        const reservationId = nextId(prev.reservations);
        const folioId = nextId(prev.folios);
        const chargeId = nextId(prev.charges);

        holder.value = { reservationId, folioId };

        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === input.roomId
              ? { ...r, status: "occupied" as const, last_updated: now }
              : r,
          ),
          reservations: [
            {
              id: reservationId,
              room_id: input.roomId,
              guest_name: input.guestName.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              check_in_date: input.checkInDate,
              check_out_date: input.checkOutDate,
              source: input.source,
              status: "checked_in",
              nightly_rate: nightlyRate,
              created_at: now,
            },
            ...prev.reservations,
          ],
          folios: [
            {
              id: folioId,
              reservation_id: reservationId,
              status: "open",
              created_at: now,
              closed_at: null,
            },
            ...prev.folios,
          ],
          charges: [
            {
              id: chargeId,
              folio_id: folioId,
              description: `Room ${room.room_number} · ${nights} night${nights > 1 ? "s" : ""}`,
              amount: nightlyRate * nights,
              category: "room",
              created_at: now,
            },
            ...prev.charges,
          ],
          statusEvents: [
            {
              id: nextId(prev.statusEvents),
              room_id: input.roomId,
              from_status: room.status,
              to_status: "occupied",
              staff_id: prev.activeStaffId,
              at: now,
            },
            ...prev.statusEvents,
          ],
        };
      });

      return holder.value;
    },
    [],
  );

  const createReservation = useCallback(
    (input: CheckInInput & { status?: "booked" | "checked_in" }) => {
      if (input.status === "checked_in") {
        const result = checkInGuest(input);
        return result?.reservationId ?? null;
      }

      let reservationId: number | null = null;

      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === input.roomId);
        if (!room || room.status !== "ready") return prev;

        const roomType = prev.roomTypes.find((t) => t.id === room.room_type_id);
        const nightlyRate = input.nightlyRate ?? roomType?.base_rate ?? 0;
        const now = new Date().toISOString();
        reservationId = nextId(prev.reservations);

        return {
          ...prev,
          reservations: [
            {
              id: reservationId,
              room_id: input.roomId,
              guest_name: input.guestName.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              check_in_date: input.checkInDate,
              check_out_date: input.checkOutDate,
              source: input.source,
              status: "booked",
              nightly_rate: nightlyRate,
              created_at: now,
            },
            ...prev.reservations,
          ],
        };
      });

      return reservationId;
    },
    [checkInGuest],
  );

  const checkOutGuest = useCallback((roomId: number, closeFolio: boolean) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room || room.status !== "occupied") return prev;

      const reservation = prev.reservations.find(
        (r) => r.room_id === roomId && r.status === "checked_in",
      );
      const now = new Date().toISOString();

      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, status: "needs_cleaning" as const, last_updated: now }
            : r,
        ),
        reservations: reservation
          ? prev.reservations.map((r) =>
              r.id === reservation.id ? { ...r, status: "checked_out" as const } : r,
            )
          : prev.reservations,
        folios:
          reservation && closeFolio
            ? prev.folios.map((f) =>
                f.reservation_id === reservation.id
                  ? { ...f, status: "closed" as const, closed_at: now }
                  : f,
              )
            : prev.folios,
        statusEvents: [
          {
            id: nextId(prev.statusEvents),
            room_id: roomId,
            from_status: room.status,
            to_status: "needs_cleaning",
            staff_id: prev.activeStaffId,
            at: now,
          },
          ...prev.statusEvents,
        ],
      };
    });
  }, []);

  const activateBookedReservation = useCallback((reservationId: number) => {
    let ok = false;

    setState((prev) => {
      const reservation = prev.reservations.find((r) => r.id === reservationId);
      if (!reservation || reservation.status !== "booked") return prev;

      const room = prev.rooms.find((r) => r.id === reservation.room_id);
      if (!room || room.status !== "ready") return prev;

      const nights = nightsForStay(reservation.check_in_date, reservation.check_out_date);
      const now = new Date().toISOString();
      const folioId = nextId(prev.folios);
      const chargeId = nextId(prev.charges);
      ok = true;

      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === room.id ? { ...r, status: "occupied" as const, last_updated: now } : r,
        ),
        reservations: prev.reservations.map((r) =>
          r.id === reservationId ? { ...r, status: "checked_in" as const } : r,
        ),
        folios: [
          {
            id: folioId,
            reservation_id: reservationId,
            status: "open",
            created_at: now,
            closed_at: null,
          },
          ...prev.folios,
        ],
        charges: [
          {
            id: chargeId,
            folio_id: folioId,
            description: `Room ${room.room_number} · ${nights} night${nights > 1 ? "s" : ""}`,
            amount: reservation.nightly_rate * nights,
            category: "room",
            created_at: now,
          },
          ...prev.charges,
        ],
        statusEvents: [
          {
            id: nextId(prev.statusEvents),
            room_id: room.id,
            from_status: room.status,
            to_status: "occupied",
            staff_id: prev.activeStaffId,
            at: now,
          },
          ...prev.statusEvents,
        ],
      };
    });

    return ok;
  }, []);

  const addCharge = useCallback(
    (folioId: number, description: string, amount: number, category: ChargeCategory) => {
      setState((prev) => {
        const folio = prev.folios.find((f) => f.id === folioId);
        if (!folio || folio.status === "closed") return prev;

        return {
          ...prev,
          charges: [
            {
              id: nextId(prev.charges),
              folio_id: folioId,
              description,
              amount,
              category,
              created_at: new Date().toISOString(),
            },
            ...prev.charges,
          ],
        };
      });
    },
    [],
  );

  const addPayment = useCallback(
    (folioId: number, amount: number, method: PaymentMethod) => {
      setState((prev) => {
        const folio = prev.folios.find((f) => f.id === folioId);
        if (!folio) return prev;

        return {
          ...prev,
          payments: [
            {
              id: nextId(prev.payments),
              folio_id: folioId,
              amount,
              method,
              paid_at: new Date().toISOString(),
            },
            ...prev.payments,
          ],
        };
      });
    },
    [],
  );

  const closeFolio = useCallback((folioId: number) => {
    setState((prev) => ({
      ...prev,
      folios: prev.folios.map((f) =>
        f.id === folioId
          ? { ...f, status: "closed" as const, closed_at: new Date().toISOString() }
          : f,
      ),
    }));
  }, []);

  const createRequest = useCallback(
    (input: {
      roomNumber: string;
      requestType: RequestType;
      notes?: string | null;
      photoUrl?: string | null;
    }) => {
      setState((prev) => ({
        ...prev,
        requests: [
          {
            id: nextId(prev.requests),
            room_number: input.roomNumber,
            request_type: input.requestType,
            status: "pending",
            created_at: new Date().toISOString(),
            notes: input.notes ?? null,
            photo_url: input.photoUrl ?? null,
            completed_by_staff_id: null,
            completed_at: null,
          },
          ...prev.requests,
        ],
      }));
    },
    [],
  );

  const completeRequest = useCallback((requestId: number) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "completed" as const,
              completed_by_staff_id: prev.activeStaffId,
              completed_at: new Date().toISOString(),
            }
          : r,
      ),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildInitialHotelState();
    setState(fresh);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo<DemoStoreValue>(
    () => ({
      state,
      hydrated,
      setActiveStaff,
      updateRoomStatus,
      checkInGuest,
      checkOutGuest,
      createReservation,
      activateBookedReservation,
      addCharge,
      addPayment,
      closeFolio,
      createRequest,
      completeRequest,
      resetDemo,
    }),
    [
      state,
      hydrated,
      setActiveStaff,
      updateRoomStatus,
      checkInGuest,
      checkOutGuest,
      createReservation,
      activateBookedReservation,
      addCharge,
      addPayment,
      closeFolio,
      createRequest,
      completeRequest,
      resetDemo,
    ],
  );

  return (
    <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return ctx;
}

export function useActiveStaff() {
  const { state } = useDemoStore();
  return state.staff.find((s) => s.id === state.activeStaffId) ?? null;
}

export function useFolioBalance(folioId: number): number {
  const { state } = useDemoStore();
  return folioBalance(folioId, state.charges, state.payments);
}

export function filterRoomsByOps(rooms: HotelState["rooms"], filter: OpsFilter) {
  if (filter === "frontdesk") {
    return rooms.filter((r) => r.status === "ready" || r.status === "occupied");
  }
  if (filter === "housekeeping") {
    return rooms.filter(
      (r) =>
        r.status === "needs_cleaning" ||
        r.status === "cleaning" ||
        r.status === "maintenance",
    );
  }
  return rooms;
}

export type { ReservationSource };
