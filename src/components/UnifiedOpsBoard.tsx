"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";

import { CheckInModal } from "@/components/CheckInModal";
import { useToast } from "@/components/Toast";
import {
  paymentMethodLabels,
  requestTypeLabels,
  roomStatusStyles,
} from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getActiveReservation,
  getBookedReservation,
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

const quickCharges: Array<[string, number]> = [
  ["Extra towels", 150],
  ["Late checkout", 500],
  ["Minibar", 250],
  ["Laundry", 300],
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
    activateBookedReservation,
    cancelReservation,
  } = useDemoStore();
  const { notify } = useToast();

  const [filter, setFilter] = useState<DeskFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "pay">("idle");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("gcash");
  const [chargeDesc, setChargeDesc] = useState("Extra towels");
  const [chargeAmount, setChargeAmount] = useState(150);
  const [showCharge, setShowCharge] = useState(false);
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
    const search = query.trim().toLowerCase();

    return state.rooms.filter((room) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "sell"
            ? room.status === "ready"
            : filter === "inhouse"
              ? room.status === "occupied"
              : filter === "dirty"
                ? room.status === "needs_cleaning" || room.status === "cleaning"
                : room.status === "maintenance";

      if (!matchesFilter) return false;
      if (!search) return true;

      const guest = getActiveReservation(room.id, state.reservations)?.guest_name ?? "";
      return (
        room.room_number.toLowerCase().includes(search) ||
        guest.toLowerCase().includes(search)
      );
    });
  }, [state.rooms, state.reservations, filter, query]);

  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId) ?? null;
  const selectedType = selectedRoom
    ? getRoomType(selectedRoom, state.roomTypes)
    : undefined;
  const activeReservation = selectedRoom
    ? getActiveReservation(selectedRoom.id, state.reservations)
    : undefined;
  const bookedHold = selectedRoom
    ? getBookedReservation(selectedRoom.id, state.reservations)
    : undefined;
  const activeFolio =
    activeReservation?.status === "checked_in"
      ? getFolioForReservation(activeReservation.id, state.folios)
      : undefined;
  const balance = activeFolio
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
        balance: folioBalance(f.id, state.charges, state.payments),
        reservation: state.reservations.find((r) => r.id === f.reservation_id),
      }))
      .filter((row) => row.balance > 0 && row.reservation?.status === "checked_in");
  }, [state.folios, state.charges, state.payments, state.reservations]);

  const dirtyRooms = state.rooms.filter(
    (r) => r.status === "needs_cleaning" || r.status === "cleaning",
  );
  const pendingRequests = state.requests.filter((r) => r.status === "pending");

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

  useEffect(() => {
    if (selectedRoomId === null || showCheckIn) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clearRoomPanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedRoomId, showCheckIn]);

  /** Every status change is reversible — desk staff tap fast and misclick. */
  function changeRoomStatus(roomId: number, nextStatus: RoomStatus, message: string) {
    const previousStatus = state.rooms.find((r) => r.id === roomId)?.status;
    updateRoomStatus(roomId, nextStatus);
    notify(message, {
      onUndo: previousStatus
        ? () => updateRoomStatus(roomId, previousStatus)
        : undefined,
    });
    clearRoomPanel();
  }

  function finishCheckout(closeTheBill: boolean) {
    if (!selectedRoom) return;
    const roomNumber = selectedRoom.room_number;
    checkOutGuest(selectedRoom.id, closeTheBill);
    setShowCharge(false);
    notify(`Room ${roomNumber} checked out. It is now Dirty — tell housekeeping.`);
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

  const roomSelected = selectedRoom != null;
  const unpaidTotal = openBalances.reduce((s, row) => s + row.balance, 0);
  const leavingRooms = departingToday
    .slice(0, 3)
    .map((r) => state.rooms.find((x) => x.id === r.room_id)?.room_number)
    .filter(Boolean)
    .join(", ");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
      {/* Shift snapshot — hidden on mobile while a room is open */}
      <div
        className={`grid grid-cols-3 gap-1.5 sm:gap-3 ${roomSelected ? "hidden lg:grid" : ""}`}
      >
        <article className="hotel-stat hotel-card-accent min-w-0 px-2 py-2 sm:px-5 sm:py-4">
          <p className="hotel-label truncate">Leaving today</p>
          <p className="hotel-stat-value mt-0.5 text-xl sm:mt-1 sm:text-[2rem]">
            {departingToday.length}
          </p>
          <p className="mt-0.5 truncate text-[0.625rem] text-muted sm:mt-1 sm:text-xs">
            {departingToday.length === 0 ? "None today" : leavingRooms || "Due today"}
          </p>
        </article>
        <article className="hotel-stat hotel-card-accent min-w-0 px-2 py-2 sm:px-5 sm:py-4">
          <p className="hotel-label truncate">Unpaid</p>
          <p className="hotel-stat-value mt-0.5 truncate text-base leading-tight sm:mt-1 sm:text-[2rem]">
            {formatMoney(unpaidTotal)}
          </p>
          <p className="mt-0.5 truncate text-[0.625rem] text-muted sm:mt-1 sm:text-xs">
            {openBalances.length} open bill{openBalances.length === 1 ? "" : "s"}
          </p>
        </article>
        <article className="hotel-stat hotel-card-accent min-w-0 px-2 py-2 sm:px-5 sm:py-4">
          <p className="hotel-label truncate">Dirty</p>
          <p className="hotel-stat-value mt-0.5 text-xl sm:mt-1 sm:text-[2rem]">
            {dirtyRooms.length}
          </p>
          <p className="mt-0.5 truncate text-[0.625rem] text-muted sm:mt-1 sm:text-xs">
            Tell housekeeping
          </p>
        </article>
      </div>

      {pendingRequests.length > 0 && (
        <div className={`hotel-card p-3 sm:p-4 ${roomSelected ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="hotel-label text-gold">
              Guest requests · {pendingRequests.length}
            </p>
            <Link href="/requests" className="text-xs font-semibold text-gold underline">
              See all
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {pendingRequests.slice(0, 2).map((request) => (
              <li
                key={request.id}
                className="flex items-start gap-2 rounded-lg bg-cream px-2.5 py-2 sm:items-center sm:px-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">
                    Rm {request.room_number} · {requestTypeLabels[request.request_type]}
                  </p>
                  {request.notes ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {request.notes}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary min-h-9 shrink-0 px-2.5 text-xs"
                  onClick={() => {
                    completeRequest(request.id);
                    notify(
                      `Done: ${requestTypeLabels[request.request_type]} · Rm ${request.room_number}`,
                    );
                  }}
                >
                  Done
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={roomSelected ? "hidden lg:block" : ""}>
        <label htmlFor="room-search" className="sr-only">
          Search room number or guest name
        </label>
        <input
          id="room-search"
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search room number or guest name…"
          className="hotel-input"
        />
      </div>

      <div
        role="group"
        aria-label="Filter rooms"
        className={`-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden ${
          roomSelected ? "hidden lg:flex" : ""
        }`}
      >
        {(
          [
            ["all", "All"],
            ["sell", "Ready"],
            ["inhouse", "In-house"],
            ["dirty", "Dirty"],
            ["ooo", "Broken"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`hotel-btn shrink-0 px-3 text-xs sm:px-5 sm:text-sm ${
              filter === key ? "hotel-btn-gold" : "hotel-btn-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-5 gap-1.5 sm:gap-3 ${roomSelected ? "hidden lg:grid" : ""}`}
      >
        {summaryOrder.map(({ key, filter: chipFilter }) => {
          const theme = roomStatusStyles[key];
          return (
            <button
              key={key}
              type="button"
              aria-label={`${theme.label}: ${stats[key]} rooms. Tap to filter.`}
              onClick={() => setFilter(chipFilter)}
              className={`hotel-stat min-w-0 px-1.5 py-2 text-left transition hover:border-gold/50 sm:px-5 sm:py-4 ${
                filter === chipFilter ? "border-gold/60 ring-1 ring-gold/40" : ""
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:justify-start sm:gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${theme.dot}`}
                />
                <p className="hotel-label truncate text-[0.5rem] sm:text-[0.6875rem]">
                  {theme.shortLabel}
                </p>
              </div>
              <p className="hotel-stat-value mt-1 text-center text-lg sm:mt-1 sm:text-left sm:text-[2rem]">
                {stats[key]}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside
          ref={actionsPanelRef}
          aria-label="Room actions"
          className={`hotel-card hotel-card-accent order-1 h-fit p-3.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5 lg:sticky lg:top-20 lg:order-2 ${
            selectedRoom ? "block" : "hidden lg:block"
          } ${isPanelClosing ? "pointer-events-none translate-x-3 opacity-0" : "translate-x-0 opacity-100"}`}
        >
          {selectedRoom ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="hotel-label text-gold">Room actions</p>
                  <h2 className="font-display mt-0.5 text-xl font-semibold text-navy sm:mt-1 sm:text-2xl">
                    Room {selectedRoom.room_number}
                  </h2>
                </div>
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary min-h-9 shrink-0 px-3 text-xs lg:hidden"
                  onClick={clearRoomPanel}
                >
                  Back
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full ${roomStatusStyles[selectedRoom.status].dot}`}
                />
                {roomStatusStyles[selectedRoom.status].label}
                {selectedType ? ` · ${selectedType.name}` : ""}
              </p>

              {activeReservation?.status === "checked_in" && (
                <div className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm">
                  <p className="font-semibold text-navy">{activeReservation.guest_name}</p>
                  <p className="truncate text-muted">
                    Leaves {activeReservation.check_out_date}
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

              <div className="space-y-2">
                {selectedRoom.status === "ready" && (
                  <>
                    {bookedHold ? (
                      <>
                        <p className="rounded-lg bg-cream px-3 py-2 text-sm text-navy">
                          Saved for <strong>{bookedHold.guest_name}</strong> · arriving{" "}
                          {bookedHold.check_in_date}
                        </p>
                        <button
                          type="button"
                          className="staff-mode-action staff-mode-action-primary"
                          onClick={() => {
                            const ok = activateBookedReservation(bookedHold.id);
                            if (ok) {
                              notify(
                                `${bookedHold.guest_name} checked in · Room ${selectedRoom.room_number}`,
                              );
                              clearRoomPanel();
                            } else {
                              notify("Could not check in — room must be Ready.", {
                                tone: "error",
                              });
                            }
                          }}
                        >
                          Check in {bookedHold.guest_name.split(" ")[0]}
                        </button>
                        <button
                          type="button"
                          className="staff-mode-action staff-mode-action-secondary"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Cancel the booking for ${bookedHold.guest_name}?`,
                              )
                            ) {
                              return;
                            }
                            cancelReservation(bookedHold.id);
                            notify(`Booking cancelled · Room ${selectedRoom.room_number}`);
                            clearRoomPanel();
                          }}
                        >
                          Cancel booking
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="staff-mode-action staff-mode-action-primary"
                        onClick={() => setShowCheckIn(true)}
                      >
                        Check in guest
                      </button>
                    )}
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} marked broken`,
                        )
                      }
                    >
                      Mark as broken
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
                      {showCharge ? "Hide charges" : "Add charge"}
                    </button>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} marked broken`,
                        )
                      }
                    >
                      Mark as broken
                    </button>
                  </>
                )}

                {(selectedRoom.status === "needs_cleaning" ||
                  selectedRoom.status === "cleaning") && (
                  <>
                    <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                      Call or text housekeeping. When they say it&apos;s finished, tap
                      Ready to sell.
                    </p>
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-primary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "ready",
                          `Room ${selectedRoom.room_number} is ready to sell`,
                        )
                      }
                    >
                      Ready to sell
                    </button>
                    {selectedRoom.status === "needs_cleaning" && (
                      <button
                        type="button"
                        className="staff-mode-action staff-mode-action-secondary"
                        onClick={() =>
                          changeRoomStatus(
                            selectedRoom.id,
                            "cleaning",
                            `Room ${selectedRoom.room_number} is being cleaned`,
                          )
                        }
                      >
                        Cleaning now
                      </button>
                    )}
                    <button
                      type="button"
                      className="staff-mode-action staff-mode-action-secondary"
                      onClick={() =>
                        changeRoomStatus(
                          selectedRoom.id,
                          "maintenance",
                          `Room ${selectedRoom.room_number} marked broken`,
                        )
                      }
                    >
                      Mark as broken
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
                          `Room ${selectedRoom.room_number} is back on sale`,
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
                  className="hotel-animate-rise mt-4 space-y-2 rounded-xl border border-border bg-cream p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chargeAmount <= 0) return;
                    addCharge(activeFolio.id, chargeDesc || "Charge", chargeAmount, "other");
                    notify(`Added ${formatMoney(chargeAmount)} to the bill`);
                    setShowCharge(false);
                  }}
                >
                  <p className="hotel-label">Add to bill</p>
                  <div className="flex flex-wrap gap-2">
                    {quickCharges.map(([label, amt]) => (
                      <button
                        key={label}
                        type="button"
                        className={`hotel-btn text-xs ${
                          chargeDesc === label ? "hotel-btn-gold" : "hotel-btn-secondary"
                        }`}
                        onClick={() => {
                          setChargeDesc(label);
                          setChargeAmount(amt);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="sr-only" htmlFor="charge-desc">
                    What is the charge for
                  </label>
                  <input
                    id="charge-desc"
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    className="hotel-input text-sm"
                    placeholder="What for?"
                  />
                  <label className="sr-only" htmlFor="charge-amount">
                    Amount in pesos
                  </label>
                  <input
                    id="charge-amount"
                    type="number"
                    min={0}
                    step={1}
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Number(e.target.value))}
                    className="hotel-input text-sm"
                  />
                  <button type="submit" className="hotel-btn hotel-btn-primary w-full">
                    Add {formatMoney(chargeAmount)}
                  </button>
                </form>
              )}

              {checkoutStep === "pay" && activeFolio && (
                <div className="mt-4 space-y-3 rounded-xl border border-gold/40 bg-cream p-3">
                  <p className="font-semibold text-navy">Checking out</p>
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
                      <label className="sr-only" htmlFor="pay-amount">
                        Amount received
                      </label>
                      <input
                        id="pay-amount"
                        type="number"
                        min={0}
                        step={1}
                        value={payAmount || ""}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="hotel-input"
                        placeholder="Amount received"
                      />
                      <label className="sr-only" htmlFor="pay-method">
                        Payment method
                      </label>
                      <select
                        id="pay-method"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="hotel-input"
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
                      Fully paid — check out
                    </button>
                  )}
                  <button
                    type="button"
                    className="staff-mode-action staff-mode-action-secondary"
                    onClick={() => {
                      if (
                        balance > 0 &&
                        !window.confirm(
                          `${formatMoney(balance)} is still unpaid. Check out anyway and collect later?`,
                        )
                      ) {
                        return;
                      }
                      finishCheckout(false);
                    }}
                  >
                    Check out, pay bill later
                  </button>
                  <button
                    type="button"
                    className="min-h-11 w-full text-sm text-muted underline"
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
                className="staff-mode-action staff-mode-action-secondary mt-4 hidden lg:inline-flex"
                onClick={clearRoomPanel}
              >
                Close
              </button>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="font-display text-lg text-navy">Pick a room</p>
              <p className="mt-2 text-sm text-muted">
                Tap any room to check a guest in or out, add a charge, or change its
                status.
              </p>
            </div>
          )}
        </aside>

        <div
          style={{ "--stagger-step": "25ms" } as CSSProperties}
          className={`hotel-stagger order-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:order-1 xl:grid-cols-4 ${
            roomSelected ? "hidden lg:grid" : ""
          }`}
        >
          {rooms.length === 0 ? (
            <div className="hotel-card col-span-full py-10 text-center">
              <p className="font-display text-lg text-navy">No rooms found</p>
              <p className="mt-1 text-sm text-muted">
                {query
                  ? "Try a different room number or name."
                  : "Tap All to see every room again."}
              </p>
              {query && (
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary mt-3"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            rooms.map((room, index) => {
              const theme = roomStatusStyles[room.status];
              const type = getRoomType(room, state.roomTypes);
              const reservation = getActiveReservation(room.id, state.reservations);
              const isSelected = room.id === selectedRoomId;
              const held = reservation?.status === "booked";
              const folio =
                reservation?.status === "checked_in"
                  ? getFolioForReservation(reservation.id, state.folios)
                  : undefined;
              const due = folio
                ? folioBalance(folio.id, state.charges, state.payments)
                : 0;

              return (
                <button
                  key={room.id}
                  type="button"
                  style={{ "--i": index } as CSSProperties}
                  onClick={() => {
                    setIsPanelClosing(false);
                    setSelectedRoomId(room.id);
                    setCheckoutStep("idle");
                    setShowCharge(false);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Room ${room.room_number}, ${type?.name ?? "room"}, ${
                    held ? "saved for a booking" : theme.label
                  }`}
                  className={`staff-mode-card min-h-24 w-full rounded-xl border p-2.5 text-left shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 active:scale-[0.97] sm:min-h-32 sm:p-4 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-md ${theme.card} ${
                    isSelected ? "shadow-md ring-2 ring-gold/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="hotel-label truncate text-muted">
                      {type?.name ?? "Room"}
                    </p>
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5 ${theme.dot}`}
                    />
                  </div>
                  <p className="font-display mt-0.5 text-xl font-semibold text-navy sm:text-3xl">
                    {room.room_number}
                  </p>
                  <span
                    className={`staff-mode-badge mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.625rem] sm:mt-2 sm:px-2.5 sm:text-xs ${
                      held
                        ? "bg-navy-deep/90 text-white dark:bg-gold/20 dark:text-gold-light"
                        : theme.badge
                    }`}
                  >
                    {held ? "Saved" : theme.shortLabel}
                  </span>
                  <p className="mt-1.5 truncate text-[0.6875rem] text-muted sm:mt-2 sm:text-xs">
                    {reservation
                      ? `${held ? "For " : ""}${reservation.guest_name}${due > 0 ? ` · ${formatMoney(due)}` : ""}`
                      : room.status === "ready"
                        ? `${formatMoney(type?.base_rate ?? 0)}/night`
                        : "—"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {showCheckIn && selectedRoom && selectedType && (
        <CheckInModal
          roomId={selectedRoom.id}
          roomNumber={selectedRoom.room_number}
          defaultRate={selectedType.base_rate}
          onClose={() => setShowCheckIn(false)}
          onSuccess={() => {
            notify(`Checked in · Room ${selectedRoom.room_number}`);
            clearRoomPanel();
          }}
        />
      )}
    </section>
  );
}
