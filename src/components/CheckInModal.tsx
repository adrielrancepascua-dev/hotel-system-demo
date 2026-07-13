"use client";

import { useMemo, useState } from "react";

import { reservationSourceLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { ReservationSource } from "@/lib/types";

type CheckInModalProps = {
  roomId: number;
  roomNumber: string;
  defaultRate: number;
  onClose: () => void;
  mode?: "check_in" | "book";
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CheckInModal({
  roomId,
  roomNumber,
  defaultRate,
  onClose,
  mode = "check_in",
}: CheckInModalProps) {
  const { checkInGuest, createReservation } = useDemoStore();
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState(todayIso());
  const [checkOutDate, setCheckOutDate] = useState(tomorrowIso());
  const [source, setSource] = useState<ReservationSource>("walk_in");
  const [nightlyRate, setNightlyRate] = useState(defaultRate);
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  }, [checkInDate, checkOutDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guestName.trim()) {
      setError("Guest name is required.");
      return;
    }
    if (checkOutDate <= checkInDate) {
      setError("Check-out must be after check-in.");
      return;
    }

    const input = {
      roomId,
      guestName,
      email,
      phone,
      checkInDate,
      checkOutDate,
      source,
      nightlyRate,
    };

    if (mode === "book") {
      const id = createReservation({ ...input, status: "booked" });
      if (!id) {
        setError("Could not create reservation. Room may not be ready.");
        return;
      }
    } else {
      const result = checkInGuest(input);
      if (!result) {
        setError("Could not check in. Room must be ready.");
        return;
      }
    }

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <div className="hotel-card hotel-card-accent max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <p className="hotel-label text-gold">Room {roomNumber}</p>
        <h2 id="checkin-title" className="font-display mt-1 text-2xl font-semibold text-navy">
          {mode === "book" ? "New reservation" : "Check in guest"}
        </h2>
        <div className="hotel-divider my-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="hotel-label" htmlFor="guest-name">
              Guest name
            </label>
            <input
              id="guest-name"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
              placeholder="Full name"
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="hotel-label" htmlFor="guest-email">
                Email
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                placeholder="juan@email.com"
              />
            </div>
            <div>
              <label className="hotel-label" htmlFor="guest-phone">
                Phone
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                placeholder="09XX XXX XXXX"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="hotel-label" htmlFor="check-in">
                Check-in
              </label>
              <input
                id="check-in"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
              />
            </div>
            <div>
              <label className="hotel-label" htmlFor="check-out">
                Check-out
              </label>
              <input
                id="check-out"
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="hotel-label" htmlFor="source">
                Source
              </label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value as ReservationSource)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
              >
                {(Object.keys(reservationSourceLabels) as ReservationSource[]).map((key) => (
                  <option key={key} value={key}>
                    {reservationSourceLabels[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="hotel-label" htmlFor="rate">
                Nightly rate
              </label>
              <input
                id="rate"
                type="number"
                min={0}
                step={1}
                value={nightlyRate}
                onChange={(e) => setNightlyRate(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
              />
            </div>
          </div>

          <p className="rounded-lg bg-cream px-3 py-2 text-sm text-muted">
            {nights} night{nights > 1 ? "s" : ""} · Room charge{" "}
            <strong className="text-navy">{formatMoney(nightlyRate * nights)}</strong>
            {mode === "check_in" ? " (posted to folio on check-in)" : ""}
          </p>

          {error && <p className="hotel-alert hotel-alert-error">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="hotel-btn hotel-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="hotel-btn hotel-btn-gold">
              {mode === "book" ? "Create booking" : "Confirm check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
