"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ConciergeIcon, HotelIcon } from "@/components/icons";
import { requestTypeLabels, roomStatusStyles } from "@/lib/constants";
import { buildDemoRooms } from "@/lib/demo";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import type { RequestRecord, RequestType, RoomStatus } from "@/lib/types";

const requestButtons: Array<{ type: RequestType; label: string; emoji: string }> = [
  { type: "towels", label: "Request Towels", emoji: "🛁" },
  { type: "housekeeping", label: "Request Housekeeping", emoji: "✨" },
  { type: "late_checkout", label: "Late Checkout", emoji: "🕐" },
  { type: "food", label: "Order Food", emoji: "🍽️" },
  { type: "hotel_services", label: "Hotel Services", emoji: "🏨" },
];

const hotelServices = [
  { label: "Pool & Spa", hours: "6:00 AM – 10:00 PM" },
  { label: "Airport Shuttle", hours: "On request" },
  { label: "Breakfast Buffet", hours: "7:00 AM – 10:30 AM" },
  { label: "Laundry Pickup", hours: "Before 9:00 PM" },
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

  const statusTheme = roomStatus ? roomStatusStyles[roomStatus] : null;

  return (
    <div className="hotel-page">
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-6 pb-36"
      >
        <header className="hotel-hero px-5 py-7">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-gold backdrop-blur">
                <HotelIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="hotel-label text-gold-light">Harborlight Hotel</p>
                <p className="text-sm text-slate-300">Room Concierge</p>
              </div>
            </div>
            <h1 className="font-display mt-5 text-4xl font-semibold text-white">
              Room {roomNumber}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Tap a service below and your request will be delivered to our team instantly.
            </p>
            {statusTheme && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${statusTheme.dot}`} />
                <span className="text-xs font-medium text-slate-200">
                  {statusTheme.label}
                </span>
              </div>
            )}
          </div>
        </header>

        {!hasSupabaseConfig && (
          <p className="hotel-alert hotel-alert-warning">
            Demo mode active. Configure Supabase keys for live staff delivery.
          </p>
        )}

        <section className="sticky bottom-3 z-20 hotel-card hotel-card-accent p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <ConciergeIcon className="h-4 w-4 text-gold" />
            <h2 className="hotel-label">Concierge Services</h2>
          </div>
          <div className="mt-3 space-y-2">
            {requestButtons.map((button) => (
              <button
                key={button.type}
                type="button"
                disabled={workingType === button.type}
                onClick={() => {
                  void submitRequest(button.type);
                }}
                className="staff-mode-action flex items-center gap-3 text-left staff-mode-action-secondary disabled:opacity-60"
              >
                <span className="text-lg" aria-hidden="true">
                  {button.emoji}
                </span>
                {button.label}
              </button>
            ))}
          </div>
        </section>

        {message && <p className="hotel-alert hotel-alert-success">{message}</p>}

        {error && <p className="hotel-alert hotel-alert-error">{error}</p>}

        <article className="hotel-card p-5">
          <h2 className="hotel-label">Recent Requests</h2>
          {recentRequests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No recent requests from this room.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-cream px-3 py-2.5 text-sm"
                >
                  <span className="text-navy">
                    {requestTypeLabels[request.request_type]}
                  </span>
                  <span
                    className={`staff-mode-badge rounded-full px-2 py-0.5 text-[0.625rem] ${
                      request.status === "pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    }`}
                  >
                    {request.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="hotel-card p-5">
          <h2 className="hotel-label">Hotel Services</h2>
          <ul className="mt-3 space-y-2">
            {hotelServices.map((service) => (
              <li
                key={service.label}
                className="flex items-center justify-between rounded-lg border border-border bg-cream px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-navy">{service.label}</span>
                <span className="text-xs text-muted">{service.hours}</span>
              </li>
            ))}
          </ul>
        </article>
      </main>
    </div>
  );
}
