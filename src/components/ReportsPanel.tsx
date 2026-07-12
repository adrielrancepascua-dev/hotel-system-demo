"use client";

import { reservationSourceLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import { computeMetrics } from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";

export function ReportsPanel() {
  const { state, hydrated, resetDemo } = useDemoStore();
  const metrics = computeMetrics(state);

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading reports…</p>;
  }

  const cards = [
    {
      label: "Occupancy",
      value: `${metrics.occupancyRate}%`,
      hint: `${metrics.occupiedRooms} of ${metrics.totalRooms} rooms`,
    },
    {
      label: "ADR",
      value: formatMoney(metrics.adr),
      hint: "Average daily rate (in-house)",
    },
    {
      label: "RevPAR",
      value: formatMoney(metrics.revpar),
      hint: "Revenue per available room",
    },
    {
      label: "Revenue today",
      value: formatMoney(metrics.revenueToday),
      hint: `MTD ${formatMoney(metrics.revenueMtd)}`,
    },
    {
      label: "Open folio balance",
      value: formatMoney(metrics.openFolioBalance),
      hint: "Outstanding guest balances",
    },
    {
      label: "Pending requests",
      value: String(metrics.pendingRequests),
      hint: "Guest concierge queue",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="hotel-stat hotel-card-accent min-w-0">
            <p className="hotel-label">{card.label}</p>
            <p className="hotel-stat-value mt-1 sm:mt-2">{card.value}</p>
            <p className="mt-1 text-[0.6875rem] text-muted sm:text-xs">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-2">
        <article className="hotel-card p-5">
          <p className="hotel-label">By room type</p>
          <ul className="mt-4 space-y-3">
            {metrics.byRoomType.map((row) => (
              <li key={row.name} className="rounded-lg border border-border bg-cream px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-navy">{row.name}</span>
                  <span className="text-sm text-muted">
                    {row.occupied}/{row.total} occupied
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Collected {formatMoney(row.revenue)}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{
                      width: `${row.total ? Math.round((row.occupied / row.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="hotel-card p-5">
          <p className="hotel-label">By reservation source</p>
          <ul className="mt-4 space-y-3">
            {metrics.bySource.map((row) => (
              <li
                key={row.source}
                className="flex items-center justify-between rounded-lg border border-border bg-cream px-3 py-3"
              >
                <div>
                  <p className="font-medium text-navy">
                    {reservationSourceLabels[row.source as keyof typeof reservationSourceLabels] ??
                      row.source}
                  </p>
                  <p className="text-xs text-muted">{row.count} stays</p>
                </div>
                <p className="font-display text-xl font-semibold text-navy">
                  {formatMoney(row.revenue)}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-6 hotel-card p-5">
        <p className="hotel-label">Staff attribution (recent room changes)</p>
        <ul className="mt-3 space-y-2">
          {state.statusEvents.slice(0, 8).map((event) => {
            const room = state.rooms.find((r) => r.id === event.room_id);
            const staff = state.staff.find((s) => s.id === event.staff_id);
            return (
              <li
                key={event.id}
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-cream px-3 py-2 text-sm"
              >
                <span className="text-navy">
                  Room {room?.room_number} → {event.to_status.replace("_", " ")}
                </span>
                <span className="text-muted">
                  {staff?.name ?? "Unassigned"} · {new Date(event.at).toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={resetDemo} className="hotel-btn hotel-btn-secondary mt-4">
          Reset demo data
        </button>
      </div>
    </section>
  );
}
