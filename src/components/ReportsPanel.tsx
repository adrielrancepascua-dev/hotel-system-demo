"use client";

import type { CSSProperties } from "react";

import { PanelSkeleton } from "@/components/PanelSkeleton";
import { useToast } from "@/components/Toast";
import { reservationSourceLabels, roomStatusLabels } from "@/lib/constants";
import { formatMoney } from "@/lib/demo";
import { computeMetrics } from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";

export function ReportsPanel() {
  const { state, hydrated, resetDemo } = useDemoStore();
  const { notify } = useToast();
  const metrics = computeMetrics(state);

  if (!hydrated) {
    return <PanelSkeleton label="Loading reports" />;
  }

  /** Plain wording first, hotel jargon in the hint so owners can still match reports. */
  const cards = [
    {
      label: "Rooms filled",
      value: `${metrics.occupancyRate}%`,
      hint: `${metrics.occupiedRooms} of ${metrics.totalRooms} rooms · occupancy`,
    },
    {
      label: "Average room price",
      value: formatMoney(metrics.adr),
      hint: "Per room sold (ADR)",
    },
    {
      label: "Income per room",
      value: formatMoney(metrics.revpar),
      hint: "Counting empty rooms too (RevPAR)",
    },
    {
      label: "Collected today",
      value: formatMoney(metrics.revenueToday),
      hint: `This month ${formatMoney(metrics.revenueMtd)}`,
    },
    {
      label: "Still unpaid",
      value: formatMoney(metrics.openFolioBalance),
      hint: "Guests who have not paid yet",
    },
    {
      label: "Requests waiting",
      value: String(metrics.pendingRequests),
      hint: "From guest room pages",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-6 sm:py-5">
      <div
        style={{ "--stagger-step": "20ms" } as CSSProperties}
        className="hotel-stagger grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3"
      >
        {cards.map((card, index) => (
          <article
            key={card.label}
            style={{ "--i": index } as CSSProperties}
            className="hotel-stat hotel-card-accent min-w-0"
          >
            <p className="hotel-label">{card.label}</p>
            <p className="hotel-stat-value mt-1 sm:mt-2">{card.value}</p>
            <p className="mt-1 text-[0.6875rem] text-muted sm:text-xs">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-2">
        <article className="hotel-card p-4 sm:p-5">
          <p className="hotel-label">By room type</p>
          <ul className="mt-4 space-y-3">
            {metrics.byRoomType.map((row) => (
              <li
                key={row.name}
                className="rounded-lg border border-border bg-cream px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-navy">{row.name}</span>
                  <span className="text-sm text-muted">
                    {row.occupied}/{row.total} filled
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

        <article className="hotel-card p-4 sm:p-5">
          <p className="hotel-label">Where bookings came from</p>
          <ul className="mt-4 space-y-3">
            {metrics.bySource.map((row) => (
              <li
                key={row.source}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-cream px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">
                    {reservationSourceLabels[
                      row.source as keyof typeof reservationSourceLabels
                    ] ?? row.source}
                  </p>
                  <p className="text-xs text-muted">{row.count} stays</p>
                </div>
                <p className="font-display shrink-0 text-xl font-semibold text-navy">
                  {formatMoney(row.revenue)}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="hotel-card mt-4 p-4 sm:mt-6 sm:p-5">
        <p className="hotel-label">Recent room changes</p>
        {state.statusEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No room changes recorded yet.</p>
        ) : (
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
                    Room {room?.room_number} → {roomStatusLabels[event.to_status]}
                  </span>
                  <span className="text-muted">
                    {staff?.name ?? "Unassigned"} ·{" "}
                    {new Date(event.at).toLocaleString("en-PH")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Reset all rooms, guests, bills, and requests back to the sample hotel data?",
              )
            ) {
              resetDemo();
              notify("Sample data restored");
            }
          }}
          className="hotel-btn hotel-btn-secondary mt-4"
        >
          Reset sample data
        </button>
      </div>
    </section>
  );
}
