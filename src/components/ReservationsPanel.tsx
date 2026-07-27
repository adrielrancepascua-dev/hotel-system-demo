"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CheckInModal } from "@/components/CheckInModal";
import { reservationSourceLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getFolioForReservation,
  getRoomType,
} from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { ReservationStatus } from "@/lib/types";

const statusFilters: Array<{ key: ReservationStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "booked", label: "Booked" },
  { key: "checked_in", label: "In-house" },
  { key: "checked_out", label: "Checked out" },
  { key: "cancelled", label: "Cancelled" },
];

export function ReservationsPanel() {
  const { state, hydrated, activateBookedReservation } = useDemoStore();
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [pickingRoom, setPickingRoom] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);

  const readyRooms = state.rooms.filter((r) => r.status === "ready");
  const bookingRoom = state.rooms.find((r) => r.id === bookingRoomId);
  const bookingType = bookingRoom
    ? getRoomType(bookingRoom, state.roomTypes)
    : undefined;

  const reservations = useMemo(() => {
    const list =
      filter === "all"
        ? state.reservations
        : state.reservations.filter((r) => r.status === filter);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [state.reservations, filter]);

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading bookings…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5">
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`hotel-btn shrink-0 px-3 text-xs sm:px-5 sm:text-sm ${
                filter === item.key ? "hotel-btn-gold" : "hotel-btn-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hotel-card hotel-card-accent p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="hotel-label text-gold">New booking</p>
              <p className="mt-1 text-sm text-muted">
                For future stays (Agoda, phone, walk-in). Pick a ready room, then enter
                the guest name.
              </p>
            </div>
            <button
              type="button"
              className="hotel-btn hotel-btn-primary shrink-0"
              onClick={() => setPickingRoom((v) => !v)}
              disabled={readyRooms.length === 0}
            >
              {pickingRoom ? "Hide rooms" : "Pick a ready room"}
            </button>
          </div>

          {readyRooms.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              No ready rooms right now. Mark a room Ready on Front Desk first.
            </p>
          )}

          {pickingRoom && readyRooms.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {readyRooms.map((room) => {
                const type = getRoomType(room, state.roomTypes);
                return (
                  <button
                    key={room.id}
                    type="button"
                    className="rounded-xl border border-border bg-surface px-3 py-3 text-left transition hover:border-gold/60 hover:bg-cream"
                    onClick={() => {
                      setBookingRoomId(room.id);
                      setPickingRoom(false);
                    }}
                  >
                    <p className="hotel-label truncate text-muted">
                      {type?.name ?? "Room"}
                    </p>
                    <p className="font-display text-2xl font-semibold text-navy">
                      {room.room_number}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatMoney(type?.base_rate ?? 0)}/night
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">No bookings yet</p>
          <p className="mt-2 text-sm text-muted">
            Tap &quot;Pick a ready room&quot; above, or check guests in on Front Desk.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {reservations.map((reservation) => {
            const room = state.rooms.find((r) => r.id === reservation.room_id);
            const folio = getFolioForReservation(reservation.id, state.folios);
            const balance = folio
              ? folioBalance(folio.id, state.charges, state.payments)
              : null;

            return (
              <article
                key={reservation.id}
                className="hotel-card hotel-card-accent p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="hotel-label text-gold">
                      Room {room?.room_number ?? "?"} ·{" "}
                      {reservationSourceLabels[reservation.source]}
                    </p>
                    <h3 className="font-display mt-1 truncate text-xl font-semibold text-navy">
                      {reservation.guest_name}
                    </h3>
                  </div>
                  <span className="staff-mode-badge shrink-0 rounded-full border border-border bg-cream px-2.5 py-1 text-navy">
                    {reservation.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {reservation.check_in_date} → {reservation.check_out_date}
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                  {formatMoney(reservation.nightly_rate)}/night
                  {reservation.phone ? ` · ${reservation.phone}` : ""}
                </p>
                {folio && balance != null && (
                  <p className="mt-2 text-sm font-medium text-navy">
                    Bill #{folio.id}: {formatMoney(balance)} due ·{" "}
                    <Link href={`/billing/${folio.id}`} className="text-gold underline">
                      View
                    </Link>
                  </p>
                )}
                {reservation.status === "booked" && room?.status === "ready" && (
                  <button
                    type="button"
                    className="hotel-btn hotel-btn-primary mt-4 w-full sm:w-auto"
                    onClick={() => activateBookedReservation(reservation.id)}
                  >
                    Check in now
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {bookingRoom && bookingType && (
        <CheckInModal
          mode="book"
          roomId={bookingRoom.id}
          roomNumber={bookingRoom.room_number}
          defaultRate={bookingType.base_rate}
          onClose={() => setBookingRoomId(null)}
        />
      )}
    </section>
  );
}
