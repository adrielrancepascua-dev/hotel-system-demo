"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { useToast } from "@/components/Toast";
import { PanelSkeleton } from "@/components/PanelSkeleton";
import {
  requestStatusLabels,
  requestStatusStyles,
  requestTypeLabels,
} from "@/lib/constants";
import { useDemoStore } from "@/lib/store/DemoStore";

export function RequestFeedPanel() {
  const { state, hydrated, completeRequest } = useDemoStore();
  const { notify } = useToast();
  const [showDone, setShowDone] = useState(true);

  const requests = useMemo(
    () =>
      [...state.requests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [state.requests],
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const visible = showDone ? requests : requests.filter((r) => r.status === "pending");

  if (!hydrated) {
    return <PanelSkeleton label="Loading requests" />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-6 sm:py-5">
      <div className="mb-4 flex items-stretch gap-2 sm:mb-5 sm:gap-4">
        <div className="hotel-stat hotel-card-accent flex-1">
          <p className="hotel-label">Waiting</p>
          <p className="hotel-stat-value mt-1 text-gold">{pendingCount}</p>
        </div>
        <div className="hotel-stat hotel-card-accent flex-1">
          <p className="hotel-label">All requests</p>
          <p className="hotel-stat-value mt-1">{requests.length}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          aria-pressed={!showDone}
          onClick={() => setShowDone(false)}
          className={`hotel-btn ${!showDone ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
        >
          Waiting only
        </button>
        <button
          type="button"
          aria-pressed={showDone}
          onClick={() => setShowDone(true)}
          className={`hotel-btn ${showDone ? "hotel-btn-gold" : "hotel-btn-secondary"}`}
        >
          Show all
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">All clear</p>
          <p className="mt-2 text-sm text-muted">Nothing waiting right now.</p>
        </div>
      ) : (
        <div
          style={{ "--stagger-step": "20ms" } as CSSProperties}
          className="hotel-stagger grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2"
        >
          {visible.map((request, index) => {
            const staff = state.staff.find((s) => s.id === request.completed_by_staff_id);
            return (
              <article
                key={request.id}
                style={{ "--i": index } as CSSProperties}
                className={`hotel-card hotel-card-accent staff-mode-card p-4 sm:p-5 ${
                  request.status === "pending" ? "border-gold/30" : "opacity-80"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="hotel-label text-gold">Room {request.room_number}</p>
                    <p className="font-display mt-1 text-lg font-semibold text-navy">
                      {requestTypeLabels[request.request_type]}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(request.created_at).toLocaleString("en-PH")}
                    </p>
                    {request.notes && (
                      <p className="mt-2 text-sm text-navy">{request.notes}</p>
                    )}
                    {request.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.photo_url}
                        alt={`Photo from room ${request.room_number}`}
                        className="mt-3 max-h-40 rounded-lg border border-border object-cover"
                      />
                    )}
                    {request.status === "completed" && staff && (
                      <p className="mt-2 text-xs text-muted">Handled by {staff.name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
                    <span
                      className={`staff-mode-badge rounded-full px-3 py-1 ${requestStatusStyles[request.status]}`}
                    >
                      {requestStatusLabels[request.status]}
                    </span>
                    {request.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => {
                          completeRequest(request.id);
                          notify(
                            `Done: ${requestTypeLabels[request.request_type]} · Rm ${request.room_number}`,
                          );
                        }}
                        className="hotel-btn hotel-btn-primary min-h-11 px-4 text-sm"
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
