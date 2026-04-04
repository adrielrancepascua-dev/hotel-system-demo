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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6">
      {!hasSupabaseConfig && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Running in local demo mode. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to enable database + realtime sync.
        </div>
      )}

      {mode !== "manager" && (
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          Pending guest requests: <strong>{pendingRequests}</strong> (live)
        </div>
      )}

      {mode === "manager" && (
        <div className="grid gap-3 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Occupancy Rate
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {occupancyRate}%
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p
              className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
              title="Average minutes rooms spend in needs-cleaning/cleaning states."
            >
              Avg Room Turnover Time
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {averageTurnoverMinutes} min
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p
              className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
              title="This updates in realtime whenever a guest request is added or completed."
            >
              Pending Guest Requests
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {pendingRequests}
            </p>
          </article>
        </div>
      )}

      {mode === "manager" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveRole("frontdesk")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeRole === "frontdesk"
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            }`}
          >
            Front Desk Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("housekeeping")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeRole === "housekeeping"
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            }`}
          >
            Housekeeping Actions
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryLabels.map((item) => (
          <article
            key={item.key}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats[item.key]}
            </p>
          </article>
        ))}
      </div>

      {errorMessage && (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading room board...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
              const statusTheme = roomStatusStyles[room.status];
              const isSelected = room.id === selectedRoomId;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`staff-mode-card min-h-32 w-full rounded-xl border p-4 text-left shadow-sm transition hover:scale-[1.01] dark:border-slate-600 ${statusTheme.card} ${
                    isSelected ? "ring-2 ring-slate-900/30" : ""
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-700 dark:text-slate-800">
                    Room
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{room.room_number}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTheme.badge}`}
                  >
                    {statusTheme.label}
                  </span>
                  <p className="mt-3 text-xs text-slate-700 dark:text-slate-800">
                    Guest: {room.status === "occupied" ? guestNameForRoom(room.room_number) : "-"}
                  </p>
                </button>
              );
            })}
          </div>

          <aside
            ref={actionsPanelRef}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {selectedRoom ? (
              <>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Room {selectedRoom.room_number}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Status: {roomStatusStyles[selectedRoom.status].label}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Guest: {guestNameForRoom(selectedRoom.room_number)}
                </p>
                <div className="mt-4 space-y-2">
                  {actionsByRole[roleInUse].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={isWorking}
                      onClick={() => {
                        void handleStatusChange(action.nextStatus);
                      }}
                      className="staff-mode-action staff-mode-action-primary border border-slate-300 text-slate-800 dark:border-slate-600 dark:text-slate-100"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(null)}
                    className="staff-mode-action staff-mode-action-secondary border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Select a room card to see role-based actions.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
