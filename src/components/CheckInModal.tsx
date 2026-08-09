"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { reservationSourceLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { ReservationSource } from "@/lib/types";

type CheckInModalProps = {
  roomId: number;
  roomNumber: string;
  defaultRate: number;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "check_in" | "book";
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Matches --motion-fast so the dialog unmounts as its exit animation ends. */
const EXIT_MS = 160;

export function CheckInModal({
  roomId,
  roomNumber,
  defaultRate,
  onClose,
  onSuccess,
  mode = "check_in",
}: CheckInModalProps) {
  const { checkInGuest, createReservation } = useDemoStore();
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [nights, setNights] = useState(1);
  const [showMore, setShowMore] = useState(false);
  const [email, setEmail] = useState("");
  const [checkInDate, setCheckInDate] = useState(todayIso());
  const [source, setSource] = useState<ReservationSource>("walk_in");
  const [nightlyRate, setNightlyRate] = useState(defaultRate);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const exitTimer = useRef<number | null>(null);

  const checkOutDate = useMemo(() => {
    const start = new Date(checkInDate);
    start.setDate(start.getDate() + Math.max(1, nights));
    return start.toISOString().slice(0, 10);
  }, [checkInDate, nights]);

  const requestClose = useCallback(() => {
    if (exitTimer.current !== null) return;
    setIsClosing(true);
    exitTimer.current = window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  useEffect(
    () => () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    },
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guestName.trim()) {
      setError("Guest name is required.");
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
        setError("Room is not free to book (may already be held).");
        return;
      }
    } else {
      const result = checkInGuest(input);
      if (!result) {
        setError("Room must be Ready and not held for another guest.");
        return;
      }
    }

    onSuccess?.();
    requestClose();
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/50 p-3 backdrop-blur-[3px] sm:items-center sm:p-4 ${
        isClosing ? "hotel-animate-fade-out" : "hotel-animate-fade"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      onClick={requestClose}
    >
      <div
        className={`hotel-card hotel-card-accent max-h-[92vh] w-full max-w-md overflow-y-auto p-5 sm:p-6 ${
          isClosing ? "hotel-animate-sheet-out" : "hotel-animate-sheet"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="hotel-label text-gold">Room {roomNumber}</p>
        <h2 id="checkin-title" className="font-display mt-1 text-2xl font-semibold text-navy">
          {mode === "book" ? "New booking" : "Quick check-in"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Name + nights is enough for walk-ins. Add contact if you want.
        </p>
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
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base text-navy"
              placeholder="e.g. Miguel Ramos"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="hotel-label" htmlFor="nights">
                Nights
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary min-h-11 min-w-11 px-0"
                  onClick={() => setNights((n) => Math.max(1, n - 1))}
                  aria-label="Fewer nights"
                >
                  −
                </button>
                <input
                  id="nights"
                  type="number"
                  min={1}
                  max={30}
                  value={nights}
                  onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-2.5 text-center text-base text-navy"
                />
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary min-h-11 min-w-11 px-0"
                  onClick={() => setNights((n) => Math.min(30, n + 1))}
                  aria-label="More nights"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="hotel-label" htmlFor="guest-phone">
                Phone <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                placeholder="09XX…"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNights(n)}
                className={`hotel-btn ${nights === n ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
              >
                {n} night{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>

          <p className="rounded-lg bg-cream px-3 py-2.5 text-sm text-navy">
            Out <strong>{checkOutDate}</strong> ·{" "}
            <strong>{formatMoney(nightlyRate * nights)}</strong> room charge
            <span className="text-muted"> · {formatMoney(nightlyRate)}/night</span>
          </p>

          <div>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="text-sm font-semibold text-gold underline-offset-2 hover:underline"
            >
              {showMore ? "Hide extra details" : "More details (email, source, rate)"}
            </button>

            <div className="hotel-collapse" data-open={showMore} inert={!showMore}>
              <div>
                <div className="mt-3 space-y-3 rounded-xl border border-border bg-cream/50 p-3">
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
                      placeholder="optional"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="hotel-label" htmlFor="check-in">
                        Check-in date
                      </label>
                      <input
                        id="check-in"
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value || todayIso())}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                      />
                    </div>
                    <div>
                      <label className="hotel-label" htmlFor="source">
                        How they booked
                      </label>
                      <select
                        id="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value as ReservationSource)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-navy"
                      >
                        {(Object.keys(reservationSourceLabels) as ReservationSource[]).map(
                          (key) => (
                            <option key={key} value={key}>
                              {reservationSourceLabels[key]}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="hotel-label" htmlFor="rate">
                      Nightly rate (₱)
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
              </div>
            </div>
          </div>

          {error && (
            <p className="hotel-alert hotel-alert-error hotel-animate-rise">{error}</p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={requestClose}
              className="hotel-btn hotel-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="hotel-btn hotel-btn-gold min-h-12">
              {mode === "book" ? "Save booking" : "Check in now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
