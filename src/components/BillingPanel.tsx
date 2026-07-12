"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { formatMoney } from "@/lib/demo";
import { folioBalance } from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";
import type { ChargeCategory, FolioStatus, PaymentMethod } from "@/lib/types";

export function BillingPanel() {
  const { state, hydrated, addCharge, addPayment, closeFolio } = useDemoStore();
  const [statusFilter, setStatusFilter] = useState<FolioStatus | "all">("open");
  const [selectedFolioId, setSelectedFolioId] = useState<number | null>(null);
  const [chargeDesc, setChargeDesc] = useState("Minibar");
  const [chargeAmount, setChargeAmount] = useState(12);
  const [chargeCategory, setChargeCategory] = useState<ChargeCategory>("fnb");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");

  const folios = useMemo(() => {
    const list =
      statusFilter === "all"
        ? state.folios
        : state.folios.filter((f) => f.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [state.folios, statusFilter]);

  const selected = state.folios.find((f) => f.id === selectedFolioId) ?? folios[0] ?? null;
  const reservation = selected
    ? state.reservations.find((r) => r.id === selected.reservation_id)
    : null;
  const room = reservation
    ? state.rooms.find((r) => r.id === reservation.room_id)
    : null;
  const charges = selected
    ? state.charges.filter((c) => c.folio_id === selected.id)
    : [];
  const payments = selected
    ? state.payments.filter((p) => p.folio_id === selected.id)
    : [];
  const balance = selected
    ? folioBalance(selected.id, state.charges, state.payments)
    : 0;

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading billing…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:mb-5 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {(["open", "closed", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`hotel-btn shrink-0 ${statusFilter === key ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
          >
            {key === "all" ? "All folios" : key === "open" ? "Open" : "Closed"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
          {folios.length === 0 ? (
            <p className="text-sm text-muted">No folios in this filter.</p>
          ) : (
            folios.map((folio) => {
              const res = state.reservations.find((r) => r.id === folio.reservation_id);
              const bal = folioBalance(folio.id, state.charges, state.payments);
              const active = (selected?.id ?? null) === folio.id;
              return (
                <button
                  key={folio.id}
                  type="button"
                  onClick={() => setSelectedFolioId(folio.id)}
                  className={`min-w-[11rem] shrink-0 rounded-xl border p-3 text-left transition lg:min-w-0 lg:w-full ${
                    active
                      ? "border-gold bg-gold-muted/40"
                      : "border-border bg-surface-elevated hover:border-gold/50"
                  }`}
                >
                  <p className="truncate font-medium text-navy">{res?.guest_name ?? "Guest"}</p>
                  <p className="text-xs text-muted">
                    Folio #{folio.id} · {folio.status} · {formatMoney(bal)} due
                  </p>
                </button>
              );
            })
          )}
        </div>

        {selected && reservation ? (
          <div className="hotel-card hotel-card-accent p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="hotel-label text-gold">Folio #{selected.id}</p>
                <h3 className="font-display mt-1 text-2xl font-semibold text-navy">
                  {reservation.guest_name}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Room {room?.room_number ?? "?"} · {reservation.check_in_date} →{" "}
                  {reservation.check_out_date}
                </p>
              </div>
              <div className="text-right">
                <p className="hotel-label">Balance</p>
                <p className="hotel-stat-value">{formatMoney(balance)}</p>
              </div>
            </div>

            <div className="hotel-divider my-4" />

            <h4 className="hotel-label">Charges</h4>
            <ul className="mt-2 space-y-2">
              {charges.map((charge) => (
                <li
                  key={charge.id}
                  className="flex justify-between rounded-lg bg-cream px-3 py-2 text-sm"
                >
                  <span className="text-navy">
                    {charge.description}{" "}
                    <span className="text-muted">({charge.category})</span>
                  </span>
                  <span className="font-medium text-navy">{formatMoney(charge.amount)}</span>
                </li>
              ))}
            </ul>

            <h4 className="hotel-label mt-5">Payments</h4>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No payments yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex justify-between rounded-lg bg-cream px-3 py-2 text-sm"
                  >
                    <span className="text-navy">
                      {payment.method} · {new Date(payment.paid_at).toLocaleString()}
                    </span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      −{formatMoney(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selected.status === "open" && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <form
                  className="space-y-2 rounded-xl border border-border p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCharge(selected.id, chargeDesc, chargeAmount, chargeCategory);
                  }}
                >
                  <p className="hotel-label">Add charge</p>
                  <input
                    value={chargeDesc}
                    onChange={(e) => setChargeDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <select
                      value={chargeCategory}
                      onChange={(e) => setChargeCategory(e.target.value as ChargeCategory)}
                      className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                    >
                      <option value="room">Room</option>
                      <option value="fnb">F&B</option>
                      <option value="service">Service</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <button type="submit" className="hotel-btn hotel-btn-secondary w-full">
                    Post charge
                  </button>
                </form>

                <form
                  className="space-y-2 rounded-xl border border-border p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amount = payAmount > 0 ? payAmount : balance;
                    if (amount <= 0) return;
                    addPayment(selected.id, amount, payMethod);
                    setPayAmount(0);
                  }}
                >
                  <p className="hotel-label">Record payment</p>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={payAmount || ""}
                    placeholder={String(balance)}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="transfer">Transfer</option>
                  </select>
                  <button type="submit" className="hotel-btn hotel-btn-primary w-full">
                    Take payment
                  </button>
                </form>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/billing/${selected.id}`} className="hotel-btn hotel-btn-gold">
                View receipt
              </Link>
              {selected.status === "open" && (
                <button
                  type="button"
                  className="hotel-btn hotel-btn-secondary"
                  onClick={() => closeFolio(selected.id)}
                >
                  Close folio
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="hotel-card py-12 text-center">
            <p className="font-display text-xl text-navy">Select a folio</p>
          </div>
        )}
      </div>
    </section>
  );
}
