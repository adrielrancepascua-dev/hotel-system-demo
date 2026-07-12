"use client";

import { useMemo, useState } from "react";

import { ConciergeIcon, HotelIcon } from "@/components/icons";
import { requestTypeLabels, roomStatusStyles } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import {
  folioBalance,
  getActiveReservation,
  getFolioForReservation,
} from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { RequestType } from "@/lib/types";

const requestButtons: Array<{ type: RequestType; label: string; emoji: string }> = [
  { type: "towels", label: "Request Towels", emoji: "🛁" },
  { type: "housekeeping", label: "Request Housekeeping", emoji: "✨" },
  { type: "late_checkout", label: "Late Checkout", emoji: "🕐" },
  { type: "food", label: "Order Food", emoji: "🍽️" },
  { type: "digital_checkout", label: "Request Checkout", emoji: "🚪" },
  { type: "hotel_services", label: "Hotel Services", emoji: "🏨" },
];

const hotelServices = [
  { label: "Pool & Spa", hours: "6:00 AM – 10:00 PM" },
  { label: "Airport Shuttle", hours: "On request" },
  { label: "Breakfast Buffet", hours: "7:00 AM – 10:30 AM" },
  { label: "Laundry Pickup", hours: "Before 9:00 PM" },
];

export function GuestConciergePanel({ roomNumber }: { roomNumber: string }) {
  const { state, hydrated, createRequest } = useDemoStore();

  const [workingType, setWorkingType] = useState<RequestType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);

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

  const statusTheme = room ? roomStatusStyles[room.status] : null;

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoUrl(null);
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

    setMessage(`${requestTypeLabels[type]} has been sent to staff.`);
    setNotes("");
    setPhotoUrl(null);
    setSelectedType(null);
    setWorkingType(null);
  }

  if (!hydrated) {
    return (
      <div className="hotel-page flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading concierge…</p>
      </div>
    );
  }

  return (
    <div className="hotel-page">
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-6 pb-40"
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
              {reservation
                ? `Welcome, ${reservation.guest_name}. Request services or view your bill.`
                : "Tap a service below and your request will be delivered to our team."}
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
              {showBill ? "Hide" : "View"} →
            </span>
          </button>
        )}

        {showBill && folio && (
          <article className="hotel-card p-5">
            <h2 className="hotel-label">Folio charges</h2>
            <ul className="mt-3 space-y-2">
              {charges.map((charge) => (
                <li
                  key={charge.id}
                  className="flex justify-between rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                >
                  <span>{charge.description}</span>
                  <span>{formatMoney(charge.amount)}</span>
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
                      <span>{payment.method}</span>
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

        <section className="sticky bottom-3 z-20 hotel-card hotel-card-accent p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <ConciergeIcon className="h-4 w-4 text-gold" />
            <h2 className="hotel-label">Concierge Services</h2>
          </div>

          {selectedType ? (
            <div className="mt-3 space-y-3">
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
                Attach photo (optional)
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
                  alt="Preview"
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
                  Send request
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {requestButtons.map((button) => (
                <button
                  key={button.type}
                  type="button"
                  onClick={() => setSelectedType(button.type)}
                  className="staff-mode-action flex items-center gap-3 text-left staff-mode-action-secondary"
                >
                  <span className="text-lg" aria-hidden="true">
                    {button.emoji}
                  </span>
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {message && <p className="hotel-alert hotel-alert-success">{message}</p>}

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
