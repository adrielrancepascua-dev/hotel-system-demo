"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { CheckInModal } from "@/components/CheckInModal";
import {
  paymentMethodLabels,
  requestTypeLabels,
  roomStatusStyles,
} from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getActiveReservation,
  getFolioForReservation,
  getRoomType,
} from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { PaymentMethod, RoomStatus } from "@/lib/types";

type DeskFilter = "all" | "sell" | "inhouse" | "dirty" | "ooo";

const summaryOrder: Array<{ key: RoomStatus; filter: DeskFilter }> = [
  { key: "ready", filter: "sell" },
  { key: "occupied", filter: "inhouse" },
  { key: "needs_cleaning", filter: "dirty" },
  { key: "cleaning", filter: "dirty" },
  { key: "maintenance", filter: "ooo" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function UnifiedOpsBoard() {
  const {
    state,
    hydrated,
    updateRoomStatus,
    checkOutGuest,
    addCharge,
    addPayment,
    closeFolio,
    completeRequest,
  } = useDemoStore();

  const [filter, setFilter] = useState<DeskFilter>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "pay" | "done">("idle");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("gcash");
  const [chargeDesc, setChargeDesc] = useState("Extra towels");
  const [chargeAmount, setChargeAmount] = useState(150);
  const [showCharge, setShowCharge] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const actionsPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedRoomId === null) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const id = window.requestAnimationFrame(() => {
      actionsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [selectedRoomId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const today = todayIso();

  const stats = useMemo(() => {
    return state.rooms.reduce<Record<RoomStatus, number>>(
      (acc, room) => {
        acc[room.status] += 1;
        return acc;
      },
      { occupied: 0, needs_cleaning: 0, cleaning: 0, ready: 0, maintenance: 0 },
    );
  }, [state.rooms]);

  const rooms = useMemo(() => {
    return state.rooms.filter((room) => {
      if (filter === "all") return true;
      if (filter === "sell") return room.status === "ready";
      if (filter === "inhouse") return room.status === "occupied";
      if (filter === "dirty")
        return room.status === "needs_cleaning" || room.status === "cleaning";
      if (filter === "ooo") return room.status === "maintenance";
      return true;
    });
  }, [state.rooms, filter]);

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
  const folioCharges = activeFolio
    ? state.charges.filter((c) => c.folio_id === activeFolio.id)
    : [];

  const departingToday = useMemo(() => {
    return state.reservations.filter(
      (r) => r.status === "checked_in" && r.check_out_date <= today,
    );
  }, [state.reservations, today]);

  const openBalances = useMemo(() => {
    return state.folios
      .filter((f) => f.status === "open")
      .map((f) => ({
        folio: f,
        balance: folioBalance(f.id, state.charges, state.payments),
        reservation: state.reservations.find((r) => r.id === f.reservation_id),
      }))
      .filter((row) => row.balance > 0 && row.reservation?.status === "checked_in");
  }, [state.folios, state.charges, state.payments, state.reservations]);

  const dirtyRooms = state.rooms.filter(
    (r) => r.status === "needs_cleaning" || r.status === "cleaning",
  );
  const pendingRequests = state.requests.filter((r) => r.status === "pending");

  function flash(message: string) {
    setToast(message);
  }

  function clearRoomPanel() {
    setIsPanelClosing(true);
    setCheckoutStep("idle");
    setShowCharge(false);
    setShowCheckIn(false);
    window.setTimeout(() => {
      setSelectedRoomId(null);
      setIsPanelClosing(false);
    }, 220);
  }

  function changeRoomStatus(roomId: number, nextStatus: RoomStatus, message: string) {
    updateRoomStatus(roomId, nextStatus);
    flash(message);
    clearRoomPanel();
  }

  function finishCheckout(closeTheBill: boolean) {
    if (!selectedRoom) return;
    const roomNumber = selectedRoom.room_number;
    checkOutGuest(selectedRoom.id, closeTheBill);
    setCheckoutStep("done");
    setShowCharge(false);
    flash(`Room ${roomNumber} checked out · marked Dirty. Radio housekeeping now.`);
    clearRoomPanel();
  }

  function handleTakePaymentThenCheckout() {
    if (!selectedRoom || !activeFolio) return;
    const amount = payAmount > 0 ? payAmount : balance;
    if (amount > 0) {
      addPayment(activeFolio.id, amount, payMethod);
    }
    closeFolio(activeFolio.id);
    finishCheckout(true);
  }

  if (!hydrated) {
    return (
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6">
        <p className="text-sm text-muted">Loading front desk…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
      {toast && (
        <div className="hotel-alert hotel-alert-success sticky top-[3.75rem] z-30 shadow-md sm:top-20">
          {toast}
        </div>
      )}

      {/* Shift handover — what the next desk person needs */}
      <div className="grid gap-2 sm:grid-cols-3">
        <article className="hotel-stat hotel-card-accent">
          <p className="hotel-label">Leaving today</p>
          <p className="hotel-stat-value mt-1">{departingToday.length}</p>
          <p className="mt-1 text-xs text-muted">
            {departingToday.length === 0
              ? "No checkouts due"
              : departingToday
                  .slice(0, 3)
                  .map((r) => {
                    const room = state.rooms.find((x) => x.id === r.room_id);
                    return room?.room_number;
                  })
                  .filter(Boolean)
                  .join(", ")}
          </p>
        </article>
        <article className="hotel-stat hotel-card-accent">
          <p className="hotel-label">Unpaid balances</p>
          <p className="hotel-stat-value mt-1">
            {formatMoney(openBalances.reduce((s, row) => s + row.balance, 0))}
          </p>
          <p className="mt-1 text-xs text-muted">
            {openBalances.length} guest{openBalances.length === 1 ? "" : "s"} with open bills
          </p>
        </article>
        <article className="hotel-stat hotel-card-accent">
          <p className="hotel-label">Tell housekeeping</p>
          <p className="hotel-stat-value mt-1">{dirtyRooms.length}</p>
          <p className="mt-1 text-xs text-muted">
            Dirty / being cleaned — radio or Messenger, then tap Ready when done
          </p>
        </article>
      </div>

      {pendingRequests.length > 0 && (
        <div className="hotel-card p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="hotel-label text-gold">
              Guest asks ({pendingRequests.length})
            </p>
            <Link href="/requests" className="text-xs font-semibold text-gold underline">
              See all
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {pendingRequests.slice(0, 3).map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2 text-sm"
              >
                <span className="text-navy">
                  Rm {request.room_number} · {requestTypeLabels[request.request_type]}
                  {request.notes ? ` — ${request.notes}` : ""}
                </span>
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary min-h-9 px-3 text-xs"
                  onClick={() => {
                    completeRequest(request.id);
                    flash(`Done: ${requestTypeLabels[request.request_type]} · Rm ${request.room_number}`);
                  }}
                >
                  Mark done
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {(
          [
            ["all", "All rooms"],
            ["sell", "Ready to sell"],
            ["inhouse", "In-house"],
            ["dirty", "Dirty / HK"],
            ["ooo", "Out of order"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`hotel-btn shrink-0 ${filter === key ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {summaryOrder.map(({ key, filter: chipFilter }) => {
          const theme = roomStatusStyles[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(chipFilter)}
              className="hotel-stat min-w-0 text-left transition hover:border-gold/50"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${theme.dot}`} />
                <p className="hotel-label truncate">{theme.shortLabel}</p>
              </div>
              <p className="hotel-stat-value mt-1">{stats[key]}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside
          ref={actionsPanelRef}
          className={`hotel-card hotel-card-accent order-1 h-fit p-4 transition-all duration-200 ease-out sm:p-5 lg:sticky lg:top-20 lg:order-2 ${
            selectedRoom ? "block" : "hidden lg:block"
          } ${isPanelClosing ? "pointer-events-none translate-x-2 opacity-0" : "translate-x-0 opacity-100"}`}
        >
          {selectedRoom ? (
            <>
              <p className="hotel-label text-gold">Front desk actions</p>
              <h2 className="font-display mt-1 text-xl font-semibold text-navy sm:text-2xl">
                Room {selectedRoom.room_number}
              </h2>
              <p className="mt-1 text-sm text-muted">
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full ${roomStatusStyles[selectedRoom.status].dot}`}
                />
                {roomStatusStyles[selectedRoom.status].label}
                {selectedType ? ` · ${selectedType.name}` : ""}
              </p>

              {activeReservation && (
                <div className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm">
                  <p className="font-semibold text-navy">{activeReservation.guest_name}</p>
                  <p className="text-muted">
                    Out {activeReservation.check_out_date}
                    {activeReservation.phone ? ` · ${activeReservation.phone}` : ""}
                  </p>
                  {activeFolio && (
                    <p className="mt-1 font-medium text-navy">
                      Amount due {formatMoney(balance)}
                    </p>
                  )}
                </div>
              )}

              <div className="hotel-divider my-3" />

              {/* Status-driven desk actions */}
              <div className="space-y-2">
                {selectedRoom.status === "ready" && (
                  <>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() => setShowCheckIn(true)}
                    >
                      Check in guest
                    </button>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} marked out of order`,
                        )
                      }
                    >
                      Mark out of order
                    </button>
                  </>
                )}

                {selectedRoom.status === "occupied" && checkoutStep === "idle" && (
                  <>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() => {
                        setPayAmount(balance);
                        setCheckoutStep("pay");
                      }}
                    >
                      Check out
                      {balance > 0 ? ` · collect ${formatMoney(balance)}` : ""}
                    </button>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() => setShowCharge((v) => !v)}
                    >
                      {showCharge ? "Hide charges" : "Add charge (minibar, fee…)"}
                    </button>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} marked out of order`,
                        )
                      }
                    >
                      Mark out of order
                    </button>
                  </>
                )}

                {(selectedRoom.status === "needs_cleaning" ||
                  selectedRoom.status === "cleaning") && (
                  <>
                    <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                      Radio or message HK for this room. When they say it&apos;s done, tap
                      below — you don&apos;t need them on a screen.
                    </p>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "ready",
                          `Room ${selectedRoom.room_number} ready to sell`,
                        )
                      }
                    >
                      HK finished — mark ready to sell
                    </button>
                    {selectedRoom.status === "needs_cleaning" && (
                      <button
                        type="button"
                        className="staff-mode-action staff-mode-action-secondary"
                        onClick={() =>
                          changeRoomStatus(
                            selectedRoom.id,
                            "cleaning",
                            `Room ${selectedRoom.room_number}: noted as being cleaned`,
                          )
                        }
                      >
                        HK started (optional note)
                      </button>
                    )}
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} out of order`,
                        )
                      }
                    >
                      Mark out of order
                    </button>
                  </>
                )}

                {selectedRoom.status === "maintenance" && (
                  <>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "ready",
                          `Room ${selectedRoom.room_number} back on sale`,
                        )
                      }
                    >
                      Fixed — ready to sell
                    </button>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "needs_cleaning",
                          `Room ${selectedRoom.room_number} needs cleaning`,
                        )
                      }
                    >
                      Needs cleaning first
                    </button>
                  </>
                )}
              </div>

              {showCharge && activeFolio && (
                <form
                  className="mt-4 space-y-2 rounded-xl border border-border bg-cream p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chargeAmount <= 0) return;
                    addCharge(activeFolio.id, chargeDesc || "Charge", chargeAmount, "other");
                    flash(`Added ${formatMoney(chargeAmount)} to bill`);
                    setShowCharge(false);
                  }}
                >
                  <p className="hotel-label">Add to bill</p>
                  <input
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="What for?"
                  />
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Extra towels", 150],
                      ["Late checkout", 500],
                      ["Minibar", 250],
                    ].map(([label, amt]) => (
                      <button
                        key={label as string}
                        type="button"
                        className="hotel-btn hotel-btn-secondary text-xs"
                        onClick={() => {
                          setChargeDesc(label as string);
                          setChargeAmount(amt as number);
                        }}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="hotel-btn hotel-btn-primary w-full">
                    Post {formatMoney(chargeAmount)}
                  </button>
                </form>
              )}

              {checkoutStep === "pay" && activeFolio && (
                <div className="mt-4 space-y-3 rounded-xl border border-gold/40 bg-cream p-3">
                  <p className="font-semibold text-navy">Checkout</p>
                  <p className="text-sm text-muted">
                    Collect what&apos;s owed, then the room goes Dirty so you can radio HK.
                  </p>
                  {folioCharges.length > 0 && (
                    <ul className="max-h-28 space-y-1 overflow-y-auto text-sm">
                      {folioCharges.map((c) => (
                        <li key={c.id} className="flex justify-between gap-2">
                          <span className="truncate text-muted">{c.description}</span>
                          <span>{formatMoney(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="font-display text-2xl font-semibold text-navy">
                    {formatMoney(balance)} due
                  </p>
                  {balance > 0 ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={payAmount || ""}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                        placeholder="Amount"
                      />
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                      >
                        {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((m) => (
                          <option key={m} value={m}>
                            {paymentMethodLabels[m]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="staff-mode-action staff-mode-action-primary"
                        onClick={handleTakePaymentThenCheckout}
                      >
                        Take payment & check out
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() => {
                        closeFolio(activeFolio.id);
                        finishCheckout(true);
                      }}
                    >
                      Balance clear — check out
                    </button>
                  )}
                  <button
                    type="button"
                    className="staff-mode-action staff-mode-action-secondary"
                    onClick={() => finishCheckout(false)}
                  >
                    Check out, pay bill later
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted underline"
                    onClick={() => setCheckoutStep("idle")}
                  >
                    Cancel checkout
                  </button>
                </div>
              )}

              {activeFolio && checkoutStep === "idle" && (
                <Link
                  href={`/billing/${activeFolio.id}`}
                  className="mt-3 block text-center text-xs font-semibold text-gold underline"
                >
                  View full receipt
                </Link>
              )}

              <button
                type="button"
                className="staff-mode-action staff-mode-action-secondary mt-4"
                onClick={clearRoomPanel}
              >
                Close
              </button>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="font-display text-lg text-navy">Pick a room</p>
              <p className="mt-2 text-sm text-muted">
                Check guests in and out, add charges, and update status after you radio
                housekeeping — all from here.
              </p>
            </div>
          )}
        </aside>

        <div className="order-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:order-1 xl:grid-cols-4">
          {rooms.map((room) => {
            const theme = roomStatusStyles[room.status];
            const type = getRoomType(room, state.roomTypes);
            const reservation = getActiveReservation(room.id, state.reservations);
            const isSelected = room.id === selectedRoomId;
            const folio = reservation
              ? getFolioForReservation(reservation.id, state.folios)
              : undefined;
            const due = folio
              ? folioBalance(folio.id, state.charges, state.payments)
              : 0;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setIsPanelClosing(false);
                  setSelectedRoomId(room.id);
                  setCheckoutStep("idle");
                  setShowCharge(false);
                }}
                aria-pressed={isSelected}
                aria-label={`Room ${room.room_number}, ${theme.label}`}
                className={`staff-mode-card min-h-28 w-full rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:min-h-32 sm:p-4 ${theme.card} ${
                  isSelected ? "ring-2 ring-gold/60 shadow-md" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="hotel-label truncate text-muted">
                    {type?.name ?? "Room"}
                  </p>
                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`} />
                </div>
                <p className="font-display mt-0.5 text-2xl font-semibold text-navy sm:text-3xl">
                  {room.room_number}
                </p>
                <span
                  className={`staff-mode-badge mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.625rem] sm:px-2.5 sm:text-xs ${theme.badge}`}
                >
                  {theme.shortLabel}
                </span>
                <p className="mt-2 truncate text-[0.6875rem] text-muted sm:text-xs">
                  {reservation
                    ? `${reservation.guest_name}${due > 0 ? ` · ${formatMoney(due)}` : ""}`
                    : room.status === "ready"
                      ? `Sell @ ${formatMoney(type?.base_rate ?? 0)}`
                      : "—"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {showCheckIn && selectedRoom && selectedType && (
        <CheckInModal
          roomId={selectedRoom.id}
          roomNumber={selectedRoom.room_number}
          defaultRate={selectedType.base_rate}
          onClose={() => setShowCheckIn(false)}
          onSuccess={() => {
            flash(`Checked in · Room ${selectedRoom.room_number}`);
            clearRoomPanel();
          }}
        />
      )}
    </section>
  );
}
