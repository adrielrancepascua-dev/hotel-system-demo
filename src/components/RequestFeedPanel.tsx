"use client";

import { useMemo, useState } from "react";

import { requestStatusStyles, requestTypeLabels } from "@/lib/constants";
import { useDemoStore } from "@/lib/store/DemoStore";

export function RequestFeedPanel() {
  const { state, hydrated, completeRequest } = useDemoStore();
  const [workingId, setWorkingId] = useState<number | null>(null);

  const requests = useMemo(
    () =>
      [...state.requests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [state.requests],
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function markCompleted(id: number) {
    setWorkingId(id);
    completeRequest(id);
    setWorkingId(null);
  }

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading requests…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {requests.length > 0 && (
        <div className="mb-5 flex items-center gap-4">
          <div className="hotel-stat flex-1">
            <p className="hotel-label">Total Requests</p>
            <p className="hotel-stat-value mt-1">{requests.length}</p>
          </div>
          <div className="hotel-stat flex-1">
            <p className="hotel-label">Awaiting Action</p>
            <p className="hotel-stat-value mt-1 text-gold">{pendingCount}</p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">All clear</p>
          <p className="mt-2 text-sm text-muted">No guest requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const staff = state.staff.find((s) => s.id === request.completed_by_staff_id);
            return (
              <article
                key={request.id}
                className={`hotel-card hotel-card-accent staff-mode-card p-5 transition ${
                  request.status === "pending" ? "border-gold/30" : "opacity-80"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="hotel-label text-gold">Room {request.room_number}</p>
                    <p className="mt-1 font-display text-lg font-semibold text-navy">
                      {requestTypeLabels[request.request_type]}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.notes && (
                      <p className="mt-2 text-sm text-navy">{request.notes}</p>
                    )}
                    {request.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.photo_url}
                        alt="Guest attachment"
                        className="mt-3 max-h-40 rounded-lg border border-border object-cover"
                      />
                    )}
                    {request.status === "completed" && staff && (
                      <p className="mt-2 text-xs text-muted">Completed by {staff.name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
                    <span
                      className={`staff-mode-badge rounded-full px-3 py-1 ${requestStatusStyles[request.status]}`}
                    >
                      {request.status}
                    </span>
                    {request.status === "pending" && (
                      <button
                        type="button"
                        disabled={workingId === request.id}
                        onClick={() => {
                          void markCompleted(request.id);
                        }}
                        className="hotel-btn hotel-btn-primary min-h-10 px-4 text-sm disabled:opacity-60"
                      >
                        Mark Completed
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
