"use client";

import { use } from "react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { formatMoney } from "@/lib/demo";
import { folioBalance } from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";

export default function FolioReceiptPage({
  params,
}: {
  params: Promise<{ folioId: string }>;
}) {
  const { folioId: folioIdParam } = use(params);
  const folioId = Number(folioIdParam);
  const { state, hydrated } = useDemoStore();

  const folio = state.folios.find((f) => f.id === folioId);
  const reservation = folio
    ? state.reservations.find((r) => r.id === folio.reservation_id)
    : null;
  const room = reservation
    ? state.rooms.find((r) => r.id === reservation.room_id)
    : null;
  const charges = state.charges.filter((c) => c.folio_id === folioId);
  const payments = state.payments.filter((p) => p.folio_id === folioId);
  const balance = folio ? folioBalance(folio.id, state.charges, state.payments) : 0;
  const totalCharges = charges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="hotel-page">
      <AppHeader />
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {!hydrated ? (
          <p className="text-sm text-muted">Loading receipt…</p>
        ) : !folio || !reservation ? (
          <div className="hotel-card p-8 text-center">
            <p className="font-display text-xl text-navy">Folio not found</p>
            <Link href="/billing" className="hotel-btn hotel-btn-secondary mt-4 inline-flex">
              Back to billing
            </Link>
          </div>
        ) : (
          <article className="hotel-card hotel-card-accent print:shadow-none p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="hotel-label text-gold">Harborlight Hotel</p>
                <h1 className="font-display mt-1 text-3xl font-semibold text-navy">
                  Guest Receipt
                </h1>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="hotel-btn hotel-btn-secondary print:hidden"
              >
                Print
              </button>
            </div>

            <div className="hotel-divider my-5" />

            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="hotel-label">Guest</dt>
                <dd className="text-navy">{reservation.guest_name}</dd>
              </div>
              <div>
                <dt className="hotel-label">Room</dt>
                <dd className="text-navy">{room?.room_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="hotel-label">Stay</dt>
                <dd className="text-navy">
                  {reservation.check_in_date} → {reservation.check_out_date}
                </dd>
              </div>
              <div>
                <dt className="hotel-label">Folio</dt>
                <dd className="text-navy">
                  #{folio.id} · {folio.status}
                </dd>
              </div>
            </dl>

            <h2 className="hotel-label mt-8">Charges</h2>
            <ul className="mt-2 divide-y divide-border">
              {charges.map((charge) => (
                <li key={charge.id} className="flex justify-between py-2 text-sm">
                  <span>{charge.description}</span>
                  <span>{formatMoney(charge.amount)}</span>
                </li>
              ))}
            </ul>

            <h2 className="hotel-label mt-6">Payments</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No payments recorded.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {payment.method} · {new Date(payment.paid_at).toLocaleDateString()}
                    </span>
                    <span>−{formatMoney(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span>Total charges</span>
                <span>{formatMoney(totalCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total paid</span>
                <span>{formatMoney(totalPaid)}</span>
              </div>
              <div className="flex justify-between font-display text-xl font-semibold text-navy">
                <span>Balance due</span>
                <span>{formatMoney(balance)}</span>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-muted">
              Thank you for staying with Harborlight Hotel.
            </p>

            <div className="mt-6 flex justify-center print:hidden">
              <Link href="/billing" className="hotel-btn hotel-btn-secondary">
                Back to billing
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
