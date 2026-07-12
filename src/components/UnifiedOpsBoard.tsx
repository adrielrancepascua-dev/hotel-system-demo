"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { CheckInModal } from "@/components/CheckInModal";
import { roomStatusStyles } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getActiveReservation,
  getFolioForReservation,
  getRoomType,
} from "@/lib/metrics";
import { filterRoomsByOps, useDemoStore } from "@/lib/store/DemoStore";
import type { OpsFilter, RoomStatus } from "@/lib/types";

const summaryLabels: Array<{ key: RoomStatus; label: string }> = [
  { key: "occupied", label: "Occupied" },
  { key: "ready", label: "Ready" },
  { key: "cleaning", label: "Cleaning" },
  { key: "maintenance", label: "Maintenance" },
  { key: "needs_cleaning", label: "Needs Cleaning" },
];

type UnifiedOpsBoardProps = {
  initialFilter?: OpsFilter;
};

export function UnifiedOpsBoard({ initialFilter = "all" }: UnifiedOpsBoardProps) {
  const {
    state,
    updateRoomStatus,
    checkOutGuest,
    hydrated,
  } = useDemoStore();

  const [filter, setFilter] = useState<OpsFilter>(initialFilter);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkoutPrompt, setCheckoutPrompt] = useState(false);
  const actionsPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (selectedRoomId === null) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const rafId = window.requestAnimationFrame(() => {
      actionsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [selectedRoomId]);

  const rooms = useMemo(
    () => filterRoomsByOps(state.rooms, filter),
    [state.rooms, filter],
  );

  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId) ?? null;
  const selectedType = selectedRoom
    ? getRoomType(selectedRoom, state.roomTypes)
    : undefined;
  const activeReservation = selectedRoom
    ? getActiveReservation(selectedRoom.id, state.reservations)
    : undefined;
  const activeFolio = activeReservation
    ? getFolioForReservation(activeReservation.id, state.folios)
    : undefined;
  const balance =
    activeFolio != null
      ? folioBalance(activeFolio.id, state.charges, state.payments)
      : 0;

  const stats = useMemo(() => {
    return state.rooms.reduce<Record<RoomStatus, number>>(
      (acc, room) => {
        acc[room.status] += 1;
        return acc;
      },
      { occupied: 0, needs_cleaning: 0, cleaning: 0, ready: 0, maintenance: 0 },
    );
  }, [state.rooms]);

  const recentEvents = state.statusEvents.slice(0, 5);

  function handleCheckout(closeFolio: boolean) {
    if (!selectedRoom) return;
    checkOutGuest(selectedRoom.id, closeFolio);
    setCheckoutPrompt(false);
  }

  function statusActions(status: RoomStatus) {
    switch (status) {
      case "ready":
        return (
          <>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-primary"
              onClick={() => setShowCheckIn(true)}
            >
              Check In Guest
            </button>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-secondary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "maintenance")}
            >
              Report Maintenance
            </button>
          </>
        );
      case "occupied":
        return (
          <>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-primary"
              onClick={() => setCheckoutPrompt(true)}
            >
              Check Out Guest
            </button>
            {activeFolio && (
              <Link
                href={`/billing/${activeFolio.id}`}
                className="staff-mode-action staff-mode-action-secondary text-center"
              >
                Open Folio · {formatMoney(balance)} due
              </Link>
            )}
            <button
              type="button"
              className="staff-mode-action staff-mode-action-secondary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "maintenance")}
            >
              Report Maintenance
            </button>
          </>
        );
      case "needs_cleaning":
        return (
          <>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-primary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "cleaning")}
            >
              Start Cleaning
            </button>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-secondary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "maintenance")}
            >
              Report Issue
            </button>
          </>
        );
      case "cleaning":
        return (
          <>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-primary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "ready")}
            >
              Mark as Cleaned / Ready
            </button>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-secondary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "maintenance")}
            >
              Report Issue
            </button>
          </>
        );
      case "maintenance":
        return (
          <>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-primary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "ready")}
            >
              Mark Ready
            </button>
            <button
              type="button"
              className="staff-mode-action staff-mode-action-secondary"
              onClick={() => updateRoomStatus(selectedRoom!.id, "needs_cleaning")}
            >
              Send to Housekeeping
            </button>
          </>
        );
      default:
        return null;
    }
  }

  if (!hydrated) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted">Loading operations board…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="hotel-alert hotel-alert-info">Demo mode</div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All rooms"],
            ["frontdesk", "Front desk queue"],
            ["housekeeping", "Housekeeping queue"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`hotel-btn ${filter === key ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryLabels.map((item) => {
          const theme = roomStatusStyles[item.key];
          return (
            <article key={item.key} className="hotel-stat">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden />
                <p className="hotel-label">{item.label}</p>
              </div>
              <p className="hotel-stat-value mt-2">{stats[item.key]}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => {
            const theme = roomStatusStyles[room.status];
            const type = getRoomType(room, state.roomTypes);
            const reservation = getActiveReservation(room.id, state.reservations);
            const isSelected = room.id === selectedRoomId;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                aria-pressed={isSelected}
                aria-label={`Room ${room.room_number}, ${theme.label}${type ? `, ${type.name}` : ""}`}
                className={`staff-mode-card group min-h-36 w-full rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${theme.card} ${
                  isSelected ? "ring-2 ring-gold/60 shadow-md" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="hotel-label text-muted">
                    Fl. {room.floor} · {type?.name ?? "Room"}
                  </p>
                  <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} aria-hidden />
                </div>
                <p className="font-display mt-1 text-3xl font-semibold text-navy">
                  {room.room_number}
                </p>
                <span
                  className={`staff-mode-badge mt-3 inline-flex rounded-full px-2.5 py-1 ${theme.badge}`}
                >
                  {theme.label}
                </span>
                <p className="mt-3 truncate text-xs text-muted">
                  {reservation?.guest_name ??
                    (room.status === "ready"
                      ? `From ${formatMoney(type?.base_rate ?? 0)}/night`
                      : "No guest")}
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span
                  className={`h-2 w-2 rounded-full ${roomStatusStyles[selectedRoom.status].dot}`}
                />
                {roomStatusStyles[selectedRoom.status].label}
                {selectedType && (
                  <>
                    <span aria-hidden>·</span>
                    {selectedType.name} · sleeps {selectedType.capacity}
                  </>
                )}
              </div>
              {activeReservation && (
                <div className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm">
                  <p className="font-medium text-navy">{activeReservation.guest_name}</p>
                  <p className="text-muted">
                    {activeReservation.check_in_date} → {activeReservation.check_out_date}
                  </p>
                  <p className="text-muted">
                    {formatMoney(activeReservation.nightly_rate)}/night
                  </p>
                </div>
              )}
              <div className="hotel-divider my-4" />
              <div className="space-y-2">{statusActions(selectedRoom.status)}</div>

              {checkoutPrompt && (
                <div className="mt-4 space-y-2 rounded-lg border border-border bg-cream p-3">
                  <p className="text-sm font-medium text-navy">Close folio on checkout?</p>
                  <p className="text-xs text-muted">
                    Balance due: {formatMoney(balance)}. Closing marks the folio paid/closed;
                    leave open to collect payment later in Billing.
                  </p>
                  <button
                    type="button"
                    className="staff-mode-action staff-mode-action-primary"
                    onClick={() => handleCheckout(true)}
                  >
                    Checkout & close folio
                  </button>
                  <button
                    type="button"
                    className="staff-mode-action staff-mode-action-secondary"
                    onClick={() => handleCheckout(false)}
                  >
                    Checkout, keep folio open
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted underline"
                    onClick={() => setCheckoutPrompt(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomId(null);
                    setCheckoutPrompt(false);
                    setShowCheckIn(false);
                  }}
                  className="staff-mode-action staff-mode-action-secondary"
                >
                  Clear selection
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="font-display text-lg text-navy">No room selected</p>
              <p className="mt-2 text-sm text-muted">
                Tap a room card. Actions adapt to its status — no role tab switching.
              </p>
            </div>
          )}
        </aside>
      </div>

      {recentEvents.length > 0 && (
        <div className="hotel-card p-5">
          <p className="hotel-label">Recent activity</p>
          <ul className="mt-3 space-y-2">
            {recentEvents.map((event) => {
              const room = state.rooms.find((r) => r.id === event.room_id);
              const staff = state.staff.find((s) => s.id === event.staff_id);
              return (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                >
                  <span className="text-navy">
                    Room {room?.room_number ?? "?"} →{" "}
                    {roomStatusStyles[event.to_status].label}
                  </span>
                  <span className="text-muted">
                    {staff?.name ?? "System"} ·{" "}
                    {new Date(event.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showCheckIn && selectedRoom && selectedType && (
        <CheckInModal
          roomId={selectedRoom.id}
          roomNumber={selectedRoom.room_number}
          defaultRate={selectedType.base_rate}
          onClose={() => setShowCheckIn(false)}
        />
      )}
    </section>
  );
}
