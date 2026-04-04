"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestTypeLabels } from "@/lib/constants";
import { buildDemoRooms } from "@/lib/demo";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import type { RequestRecord, RequestType, RoomStatus } from "@/lib/types";

const requestButtons: Array<{ type: RequestType; label: string }> = [
  { type: "towels", label: "Request Towels" },
  { type: "housekeeping", label: "Request Housekeeping" },
  { type: "late_checkout", label: "Late Checkout Request" },
  { type: "food", label: "Order Food" },
  { type: "hotel_services", label: "View Hotel Services" },
];

const hotelServices = [
  "Pool and spa access: 6:00 AM - 10:00 PM",
  "Airport shuttle on request",
  "Breakfast buffet: 7:00 AM - 10:30 AM",
  "Laundry pickup before 9:00 PM",
];

export function GuestConciergePanel({ roomNumber }: { roomNumber: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [workingType, setWorkingType] = useState<RequestType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);

  const fetchGuestData = useCallback(async () => {
    if (!supabase) {
      const demoRoom = buildDemoRooms().find((room) => room.room_number === roomNumber);
      setRoomStatus(demoRoom?.status ?? "ready");
      return;
    }

    const [{ data: roomData }, { data: requestData }] = await Promise.all([
      supabase
        .from("rooms")
        .select("status")
        .eq("room_number", roomNumber)
        .maybeSingle(),
      supabase
        .from("requests")
        .select("id, room_number, request_type, status, created_at")
        .eq("room_number", roomNumber)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setRoomStatus((roomData?.status as RoomStatus | undefined) ?? "ready");
    setRecentRequests((requestData ?? []) as RequestRecord[]);
  }, [roomNumber, supabase]);

  useEffect(() => {
    void fetchGuestData();
  }, [fetchGuestData]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const roomChannel = supabase
      .channel(`guest-room-${roomNumber}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `room_number=eq.${roomNumber}`,
        },
        () => {
          void fetchGuestData();
        },
      )
      .subscribe();

    const requestsChannel = supabase
      .channel(`guest-requests-${roomNumber}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `room_number=eq.${roomNumber}`,
        },
        () => {
          void fetchGuestData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(roomChannel);
      void supabase.removeChannel(requestsChannel);
    };
  }, [fetchGuestData, roomNumber, supabase]);

  async function submitRequest(type: RequestType) {
    setMessage(null);
    setError(null);
    setWorkingType(type);

    // Use local state in demo mode, while Supabase mode relies on realtime data refresh.
    if (!supabase) {
      const localRequest: RequestRecord = {
        id: Date.now(),
        room_number: roomNumber,
        request_type: type,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      setRecentRequests((prev) => [localRequest, ...prev].slice(0, 5));
      setMessage(`${requestTypeLabels[type]} has been sent to staff.`);
      setWorkingType(null);
      return;
    }

    const { error } = await supabase.from("requests").insert({
      room_number: roomNumber,
      request_type: type,
      status: "pending",
    });

    if (error) {
      setError(error.message);
      setWorkingType(null);
      return;
    }

    void fetchGuestData();
    setMessage(`${requestTypeLabels[type]} has been sent to staff.`);
    setWorkingType(null);
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-6">
      <header className="rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-lg dark:bg-slate-800">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Room Concierge</p>
        <h1 className="mt-2 text-2xl font-bold">Room {roomNumber}</h1>
        <p className="mt-2 text-sm text-slate-200">
          Tap a service and your request will be sent instantly.
        </p>
        <p className="mt-2 text-xs text-slate-300">
          Live room status: {roomStatus ?? "loading..."}
        </p>
      </header>

      {!hasSupabaseConfig && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Demo mode active. Configure Supabase keys for live staff delivery.
        </p>
      )}

      <div className="space-y-3">
        {requestButtons.map((button) => (
          <button
            key={button.type}
            type="button"
            disabled={workingType === button.type}
            onClick={() => {
              void submitRequest(button.type);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {button.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
          Recent Requests
        </h2>
        {recentRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            No recent requests from this room.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {recentRequests.map((request) => (
              <li
                key={request.id}
                className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
              >
                {requestTypeLabels[request.request_type]} - {request.status}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
          Hotel Services
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
          {hotelServices.map((service) => (
            <li key={service} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
              {service}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
