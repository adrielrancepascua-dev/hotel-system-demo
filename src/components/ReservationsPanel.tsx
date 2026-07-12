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

  function activateBooking(reservationId: number) {
    activateBookedReservation(reservationId);
  }

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading reservations…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`hotel-btn ${filter === item.key ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="hotel-btn hotel-btn-secondary cursor-pointer">
            <span>Book ready room</span>
            <select
              className="ml-2 max-w-[6rem] bg-transparent"
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) setBookingRoomId(id);
              }}
              aria-label="Select ready room to book"
            >
              <option value="">Select…</option>
              {readyRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_number}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">No reservations</p>
          <p className="mt-2 text-sm text-muted">Book a ready room or check in from Ops.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reservations.map((reservation) => {
            const room = state.rooms.find((r) => r.id === reservation.room_id);
            const folio = getFolioForReservation(reservation.id, state.folios);
            const balance = folio
              ? folioBalance(folio.id, state.charges, state.payments)
              : null;

            return (
              <article key={reservation.id} className="hotel-card hotel-card-accent p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="hotel-label text-gold">
                      Room {room?.room_number ?? "?"} ·{" "}
                      {reservationSourceLabels[reservation.source]}
                    </p>
                    <h3 className="font-display mt-1 text-xl font-semibold text-navy">
                      {reservation.guest_name}
                    </h3>
                  </div>
                  <span className="staff-mode-badge rounded-full border border-border bg-cream px-2.5 py-1 text-navy">
                    {reservation.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {reservation.check_in_date} → {reservation.check_out_date}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatMoney(reservation.nightly_rate)}/night
                  {reservation.email ? ` · ${reservation.email}` : ""}
                  {reservation.phone ? ` · ${reservation.phone}` : ""}
                </p>
                {folio && balance != null && (
                  <p className="mt-2 text-sm font-medium text-navy">
                    Folio #{folio.id}: {formatMoney(balance)} balance ·{" "}
                    <Link href={`/billing/${folio.id}`} className="text-gold underline">
                      View
                    </Link>
                  </p>
                )}
                {reservation.status === "booked" && room?.status === "ready" && (
                  <button
                    type="button"
                    className="hotel-btn hotel-btn-primary mt-4"
                    onClick={() => activateBooking(reservation.id)}
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
