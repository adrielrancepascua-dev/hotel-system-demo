"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { PanelSkeleton } from "@/components/PanelSkeleton";
import { BellIcon, BroomIcon, ClockIcon, DoorIcon, HotelIcon, TowelIcon, UtensilsIcon } from "@/components/icons";
import { paymentMethodLabels, requestTypeLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getActiveReservation,
  getFolioForReservation,
} from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { RequestType } from "@/lib/types";

const requestButtons = [
  { type: "towels" as const, label: "Extra towels", Icon: TowelIcon },
  { type: "housekeeping" as const, label: "Room tidy-up", Icon: BroomIcon },
  { type: "late_checkout" as const, label: "Late checkout", Icon: ClockIcon },
  { type: "food" as const, label: "Order food", Icon: UtensilsIcon },
  { type: "digital_checkout" as const, label: "Request checkout", Icon: DoorIcon },
];

const hotelServices = [
  { label: "Swimming pool", hours: "6:00 AM – 10:00 PM" },
  { label: "NAIA airport shuttle", hours: "On request" },
  { label: "Breakfast buffet", hours: "6:30 AM – 10:00 AM" },
  { label: "Laundry / dry clean", hours: "Pickup before 8:00 PM" },
];

export function GuestConciergePanel({ roomNumber }: { roomNumber: string }) {
  const { state, hydrated, createRequest } = useDemoStore();

  const [workingType, setWorkingType] = useState<RequestType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [showServices, setShowServices] = useState(false);

  const room = state.rooms.find((r) => r.room_number === roomNumber);
  const reservation = room
    ? getActiveReservation(room.id, state.reservations)
    : undefined;
  const folio = reservation
    ? getFolioForReservation(reservation.id, state.folios)
    : undefined;
  const charges = folio
    ? state.charges.filter((c) => c.folio_id === folio.id)
    : [];
  const payments = folio
    ? state.payments.filter((p) => p.folio_id === folio.id)
    : [];
  const balance = folio ? folioBalance(folio.id, state.charges, state.payments) : 0;

  const recentRequests = useMemo(
    () =>
      state.requests
        .filter((r) => r.room_number === roomNumber)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [state.requests, roomNumber],
  );

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4500);
    return () => window.clearTimeout(t);
  }, [message]);

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoUrl(null);
      return;
    }
    if (file.size > 800_000) {
      setMessage("Photo too large. Please pick a smaller picture.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function submitRequest(type: RequestType) {
    setMessage(null);
    setWorkingType(type);

    createRequest({
      roomNumber,
      requestType: type,
      notes: notes.trim() || null,
      photoUrl,
    });

    setMessage(`${requestTypeLabels[type]} sent to the front desk.`);
    setNotes("");
    setPhotoUrl(null);
    setSelectedType(null);
    setWorkingType(null);
  }

  if (!hydrated) {
    return (
      <div className="hotel-page px-4 py-8">
        <PanelSkeleton label="Loading guest page" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="hotel-page flex min-h-screen items-center justify-center px-4">
        <div className="hotel-card max-w-sm p-6 text-center">
          <p className="font-display text-2xl font-semibold text-navy">Room not found</p>
          <p className="mt-2 text-sm text-muted">
            Ask the front desk for the correct room link or QR code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-page">
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-5 pb-8 sm:py-6"
      >
        <header className="hotel-hero px-5 py-6 sm:py-7">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-gold">
                <HotelIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="hotel-label text-gold-light">Demo Hotel</p>
                <p className="text-sm text-slate-300">Guest services</p>
              </div>
            </div>
            <h1 className="font-display mt-4 text-3xl font-semibold text-white sm:mt-5 sm:text-4xl">
              Room {roomNumber}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {reservation
                ? `Welcome, ${reservation.guest_name}. Ask for help or check your bill below.`
                : "Welcome. Tap a service below to message the front desk."}
            </p>
          </div>
        </header>

        {message && (
          <p
            className="hotel-alert hotel-alert-success hotel-animate-rise"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {folio && (
          <button
            type="button"
            onClick={() => setShowBill((v) => !v)}
            className="hotel-card hotel-card-accent flex w-full items-center justify-between p-4 text-left"
          >
            <div>
              <p className="hotel-label text-gold">Your bill</p>
              <p className="font-display text-2xl font-semibold text-navy">
                {formatMoney(balance)} due
              </p>
            </div>
            <span className="text-sm font-semibold text-gold">
              {showBill ? "Hide" : "View"}
            </span>
          </button>
        )}

        {showBill && folio && (
          <article className="hotel-card hotel-animate-rise p-4 sm:p-5">
            <h2 className="hotel-label">Charges</h2>
            <ul className="mt-3 space-y-2">
              {charges.map((charge) => (
                <li
                  key={charge.id}
                  className="flex justify-between gap-3 rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{charge.description}</span>
                  <span className="shrink-0">{formatMoney(charge.amount)}</span>
                </li>
              ))}
            </ul>
            {payments.length > 0 && (
              <>
                <h2 className="hotel-label mt-4">Payments</h2>
                <ul className="mt-2 space-y-2">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex justify-between rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                    >
                      <span>{paymentMethodLabels[payment.method]}</span>
                      <span>−{formatMoney(payment.amount)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 font-display text-xl font-semibold text-navy">
              Balance {formatMoney(balance)}
            </p>
          </article>
        )}

        <section className="hotel-card hotel-card-accent p-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-gold" />
            <h2 className="hotel-label">Ask the desk</h2>
          </div>

          {selectedType ? (
            <div className="hotel-animate-rise mt-3 space-y-3">
              <p className="text-sm font-medium text-navy">
                {requestTypeLabels[selectedType]}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note (optional)"
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy"
              />
              <label className="block text-sm text-muted">
                Photo (optional)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mt-1 block w-full text-sm"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Attached preview"
                  className="max-h-32 rounded-lg border border-border object-cover"
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary flex-1"
                  onClick={() => {
                    setSelectedType(null);
                    setPhotoUrl(null);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={workingType === selectedType}
                  className="hotel-btn hotel-btn-gold flex-1 disabled:opacity-60"
                  onClick={() => submitRequest(selectedType)}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {requestButtons.map((button) => {
                const Icon = button.Icon;
                return (
                  <button
                    key={button.type}
                    type="button"
                    onClick={() => setSelectedType(button.type)}
                    className="staff-mode-action flex items-center gap-3 text-left staff-mode-action-secondary"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-gold" />
                    {button.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowServices((v) => !v)}
                className="staff-mode-action flex items-center gap-3 text-left staff-mode-action-secondary"
              >
                <HotelIcon className="h-5 w-5 shrink-0 text-gold" />
                {showServices ? "Hide hotel info" : "Hotel info"}
              </button>
            </div>
          )}
        </section>

        {showServices && (
          <article className="hotel-card hotel-animate-rise p-4 sm:p-5">
            <h2 className="hotel-label">Hotel info</h2>
            <ul className="hotel-stagger mt-3 space-y-2">
              {hotelServices.map((service, index) => (
                <li
                  key={service.label}
                  style={{ "--i": index } as CSSProperties}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-cream px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-navy">{service.label}</span>
                  <span className="shrink-0 text-xs text-muted">{service.hours}</span>
                </li>
              ))}
            </ul>
          </article>
        )}

        <article className="hotel-card p-4 sm:p-5">
          <h2 className="hotel-label">Your recent requests</h2>
          {recentRequests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing sent yet from this room.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-cream px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate text-navy">
                    {requestTypeLabels[request.request_type]}
                  </span>
                  <span
                    className={`staff-mode-badge shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] ${
                      request.status === "pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    }`}
                  >
                    {request.status === "pending" ? "Sent" : "Done"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </main>
    </div>
  );
}
