"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";

import { CheckInModal } from "@/components/CheckInModal";
import { useToast } from "@/components/Toast";
import { reservationSourceLabels, reservationStatusLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import { folioBalance, getFolioForReservation, getRoomType } from "@/lib/metrics";
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
  const { state, hydrated, activateBookedReservation, cancelReservation } = useDemoStore();
  const { notify } = useToast();
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [pickingRoom, setPickingRoom] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);

  const readyRooms = state.rooms.filter(
    (r) =>
      r.status === "ready" &&
      !state.reservations.some((res) => res.room_id === r.id && res.status === "booked"),
  );
  const bookingRoom = state.rooms.find((r) => r.id === bookingRoomId);
  const bookingType = bookingRoom ? getRoomType(bookingRoom, state.roomTypes) : undefined;

  const reservations = useMemo(() => {
    const search = query.trim().toLowerCase();
    const list = state.reservations.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!search) return true;
      const room = state.rooms.find((x) => x.id === r.room_id);
      return (
        r.guest_name.toLowerCase().includes(search) ||
        (room?.room_number ?? "").toLowerCase().includes(search)
      );
    });
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [state.reservations, state.rooms, filter, query]);

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading bookings…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-6 sm:py-5">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5">
        <label htmlFor="booking-search" className="sr-only">
          Search guest name or room number
        </label>
        <input
          id="booking-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guest name or room number…"
          className="hotel-input"
        />

        <div
          role="group"
          aria-label="Filter bookings"
          className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
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
                For guests arriving later. Pick a free room, then type the guest name.
              </p>
            </div>
            <button
              type="button"
              className="hotel-btn hotel-btn-primary shrink-0"
              onClick={() => setPickingRoom((v) => !v)}
              disabled={readyRooms.length === 0}
            >
              {pickingRoom ? "Hide rooms" : "Pick a free room"}
            </button>
          </div>

          {readyRooms.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              No free rooms right now. Mark a room Ready on Front Desk first.
            </p>
          )}

          {readyRooms.length > 0 && (
            <div
              className="hotel-collapse"
              data-open={pickingRoom}
              inert={!pickingRoom}
            >
              <div>
                <div
                  style={{ "--stagger-step": "30ms" } as CSSProperties}
                  className="hotel-stagger mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
                >
                  {readyRooms.map((room, index) => {
                    const type = getRoomType(room, state.roomTypes);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        style={{ "--i": index } as CSSProperties}
                        className="rounded-xl border border-border bg-surface px-3 py-3 text-left transition-[transform,border-color,background-color] duration-200 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:border-gold/60 [@media(hover:hover)]:hover:bg-cream"
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
              </div>
            </div>
          )}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted">
            {query
              ? "No booking matches that name or room."
              : "Tap “Pick a free room” above, or check guests in on Front Desk."}
          </p>
        </div>
      ) : (
        <div
          style={{ "--stagger-step": "20ms" } as CSSProperties}
          className="hotel-stagger grid gap-3 sm:gap-4 md:grid-cols-2"
        >
          {reservations.map((reservation, index) => {
            const room = state.rooms.find((r) => r.id === reservation.room_id);
            const folio = getFolioForReservation(reservation.id, state.folios);
            const balance = folio
              ? folioBalance(folio.id, state.charges, state.payments)
              : null;

            return (
              <article
                key={reservation.id}
                style={{ "--i": index } as CSSProperties}
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
                    {reservationStatusLabels[reservation.status]}
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="hotel-btn hotel-btn-primary w-full sm:w-auto"
                      onClick={() => {
                        const ok = activateBookedReservation(reservation.id);
                        notify(
                          ok
                            ? `${reservation.guest_name} checked in · Room ${room.room_number}`
                            : "Could not check in — room must be Ready.",
                          { tone: ok ? "success" : "error" },
                        );
                      }}
                    >
                      Check in now
                    </button>
                    <button
                      type="button"
                      className="hotel-btn hotel-btn-secondary w-full sm:w-auto"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Cancel the booking for ${reservation.guest_name}?`,
                          )
                        ) {
                          return;
                        }
                        cancelReservation(reservation.id);
                        notify(`Booking cancelled · ${reservation.guest_name}`);
                      }}
                    >
                      Cancel booking
                    </button>
                  </div>
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
          onSuccess={() => notify(`Booking saved · Room ${bookingRoom.room_number}`)}
        />
      )}
    </section>
  );
}
