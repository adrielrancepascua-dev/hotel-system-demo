"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { roomStatusStyles } from "@/lib/constants";
import { buildDemoRequests, buildDemoRooms, guestNameForRoom } from "@/lib/demo";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import type { RoomRecord, RoomStatus, StaffRole } from "@/lib/types";

type BoardMode = "manager" | StaffRole;

type RoomAction = {
  label: string;
  nextStatus: RoomStatus;
};

const actionsByRole: Record<StaffRole, RoomAction[]> = {
  frontdesk: [
    { label: "Check In Guest", nextStatus: "occupied" },
    { label: "Check Out Guest", nextStatus: "needs_cleaning" },
    { label: "Mark Reserved", nextStatus: "occupied" },
    { label: "Report Maintenance", nextStatus: "maintenance" },
  ],
  housekeeping: [
    { label: "Start Cleaning", nextStatus: "cleaning" },
    { label: "Mark as Cleaned", nextStatus: "ready" },
    { label: "Report Issue", nextStatus: "maintenance" },
  ],
};

const summaryLabels: Array<{ key: RoomStatus; label: string }> = [
  { key: "occupied", label: "Occupied" },
  { key: "ready", label: "Ready" },
  { key: "cleaning", label: "Cleaning" },
  { key: "maintenance", label: "Maintenance" },
  { key: "needs_cleaning", label: "Needs Cleaning" },
];

export function RoomOperationsBoard({ mode }: { mode: BoardMode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const actionsPanelRef = useRef<HTMLElement | null>(null);

  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [activeRole, setActiveRole] = useState<StaffRole>(
    mode === "housekeeping" ? "housekeeping" : "frontdesk",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setErrorMessage(null);

    if (!supabase) {
      setRooms(buildDemoRooms());
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_number, status, last_updated")
      .order("room_number", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setRooms((data ?? []) as RoomRecord[]);
    setIsLoading(false);
  }, [supabase]);

  const fetchPendingRequests = useCallback(async () => {
    if (!supabase) {
      const pendingInDemo = buildDemoRequests().filter(
        (request) => request.status === "pending",
      ).length;
      setPendingRequests(pendingInDemo);
      return;
    }

    const { count } = await supabase
      .from("requests")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending");

    setPendingRequests(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    void fetchRooms();
    void fetchPendingRequests();
  }, [fetchPendingRequests, fetchRooms]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`rooms-live-${mode}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          void fetchRooms();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchRooms, mode, supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`requests-count-${mode}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          void fetchPendingRequests();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchPendingRequests, mode, supabase]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  useEffect(() => {
    if (selectedRoomId === null) {
      return;
    }

    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      actionsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [selectedRoomId]);

  const stats = useMemo(() => {
    return rooms.reduce<Record<RoomStatus, number>>(
      (acc, room) => {
        acc[room.status] += 1;
        return acc;
      },
      {
        occupied: 0,
        needs_cleaning: 0,
        cleaning: 0,
        ready: 0,
        maintenance: 0,
      },
    );
  }, [rooms]);

  const occupancyRate = useMemo(() => {
    if (rooms.length === 0) {
      return 0;
    }

    return Math.round((stats.occupied / rooms.length) * 100);
  }, [rooms.length, stats.occupied]);

  const averageTurnoverMinutes = useMemo(() => {
    const activeTurnoverRooms = rooms.filter(
      (room) => room.status === "needs_cleaning" || room.status === "cleaning",
    );

    if (activeTurnoverRooms.length === 0) {
      return 0;
    }

    // Estimate turnover time using how long rooms have been in turnover-related states.
    const totalMinutes = activeTurnoverRooms.reduce((total, room) => {
      const elapsedMs = Date.now() - new Date(room.last_updated).getTime();
      const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));
      return total + elapsedMinutes;
    }, 0);

    return Math.round(totalMinutes / activeTurnoverRooms.length);
  }, [rooms]);

  async function handleStatusChange(nextStatus: RoomStatus) {
    if (!selectedRoom) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    const lastUpdated = new Date().toISOString();

    if (!supabase) {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id
            ? { ...room, status: nextStatus, last_updated: lastUpdated }
            : room,
        ),
      );
      setIsWorking(false);
      return;
    }

    const { error } = await supabase
      .from("rooms")
      .update({ status: nextStatus, last_updated: lastUpdated })
      .eq("id", selectedRoom.id);

    if (error) {
      setErrorMessage(error.message);
      setIsWorking(false);
      return;
    }

    setRooms((prev) =>
      prev.map((room) =>
        room.id === selectedRoom.id
          ? { ...room, status: nextStatus, last_updated: lastUpdated }
          : room,
      ),
    );
    setIsWorking(false);
  }

  const roleInUse = mode === "manager" ? activeRole : mode;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      {!hasSupabaseConfig && (
        <div className="hotel-alert hotel-alert-warning">
          Running in local demo mode. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to enable database + realtime sync.
        </div>
      )}

      {mode !== "manager" && (
        <div className="hotel-alert hotel-alert-info flex items-center justify-between gap-3">
          <span>Pending guest requests</span>
          <strong className="font-display text-2xl text-gold">{pendingRequests}</strong>
        </div>
      )}

      {mode === "manager" && (
        <div className="grid gap-3 lg:grid-cols-3">
          <article className="hotel-stat hotel-card-accent">
            <p className="hotel-label">Occupancy Rate</p>
            <p className="hotel-stat-value mt-2">{occupancyRate}%</p>
          </article>
          <article
            className="hotel-stat hotel-card-accent"
            title="Average minutes rooms spend in needs-cleaning/cleaning states."
          >
            <p className="hotel-label">Avg Room Turnover</p>
            <p className="hotel-stat-value mt-2">{averageTurnoverMinutes} min</p>
          </article>
          <article
            className="hotel-stat hotel-card-accent"
            title="This updates in realtime whenever a guest request is added or completed."
          >
            <p className="hotel-label">Pending Requests</p>
            <p className="hotel-stat-value mt-2">{pendingRequests}</p>
          </article>
        </div>
      )}

      {mode === "manager" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveRole("frontdesk")}
            className={`hotel-btn ${
              activeRole === "frontdesk" ? "hotel-btn-gold" : "hotel-btn-secondary"
            }`}
          >
            Front Desk Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("housekeeping")}
            className={`hotel-btn ${
              activeRole === "housekeeping" ? "hotel-btn-gold" : "hotel-btn-secondary"
            }`}
          >
            Housekeeping Actions
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryLabels.map((item) => {
          const statusTheme = roomStatusStyles[item.key];
          return (
            <article key={item.key} className="hotel-stat">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusTheme.dot}`} />
                <p className="hotel-label">{item.label}</p>
              </div>
              <p className="hotel-stat-value mt-2">{stats[item.key]}</p>
            </article>
          );
        })}
      </div>

      {errorMessage && (
        <p className="hotel-alert hotel-alert-error">{errorMessage}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading room board...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
              const statusTheme = roomStatusStyles[room.status];
              const isSelected = room.id === selectedRoomId;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`staff-mode-card group min-h-36 w-full rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusTheme.card} ${
                    isSelected ? "ring-2 ring-gold/60 shadow-md" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="hotel-label text-muted">Room</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusTheme.dot}`} />
                  </div>
                  <p className="font-display mt-1 text-3xl font-semibold text-navy">
                    {room.room_number}
                  </p>
                  <span
                    className={`staff-mode-badge mt-3 inline-flex rounded-full px-2.5 py-1 ${statusTheme.badge}`}
                  >
                    {statusTheme.label}
                  </span>
                  <p className="mt-3 truncate text-xs text-muted">
                    {room.status === "occupied"
                      ? guestNameForRoom(room.room_number)
                      : "No guest assigned"}
                  </p>
                </button>
              );
            })}
          </div>

          <aside
            ref={actionsPanelRef}
            className="hotel-card hotel-card-accent h-fit p-5 lg:sticky lg:top-24"
          >
            {selectedRoom ? (
              <>
                <p className="hotel-label text-gold">Selected Room</p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-navy">
                  Room {selectedRoom.room_number}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${roomStatusStyles[selectedRoom.status].dot}`}
                  />
                  <p className="text-sm text-muted">
                    {roomStatusStyles[selectedRoom.status].label}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Guest: {guestNameForRoom(selectedRoom.room_number)}
                </p>
                <div className="hotel-divider my-4" />
                <div className="space-y-2">
                  {actionsByRole[roleInUse].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={isWorking}
                      onClick={() => {
                        void handleStatusChange(action.nextStatus);
                      }}
                      className="staff-mode-action staff-mode-action-primary disabled:opacity-60"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(null)}
                    className="staff-mode-action staff-mode-action-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="font-display text-lg text-navy">No room selected</p>
                <p className="mt-2 text-sm text-muted">
                  Tap a room card to view available actions.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
