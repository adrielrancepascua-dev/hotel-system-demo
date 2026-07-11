"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestStatusStyles, requestTypeLabels } from "@/lib/constants";
import { buildDemoRequests } from "@/lib/demo";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import type { RequestRecord } from "@/lib/types";

export function RequestFeedPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    setError(null);

    if (!supabase) {
      setRequests(buildDemoRequests());
      setLoading(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("requests")
      .select("id, room_number, request_type, status, created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setRequests((data ?? []) as RequestRecord[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`requests-live-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          void fetchRequests();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchRequests, supabase]);

  async function markCompleted(id: number) {
    setError(null);
    setWorkingId(id);

    if (!supabase) {
      setRequests((prev) =>
        prev.map((request) =>
          request.id === id ? { ...request, status: "completed" } : request,
        ),
      );
      setWorkingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: "completed" })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setWorkingId(null);
      return;
    }

    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "completed" } : request,
      ),
    );
    setWorkingId(null);
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {!hasSupabaseConfig && (
        <div className="hotel-alert hotel-alert-warning mb-5">
          Demo mode is active. Add Supabase env keys for live guest requests.
        </div>
      )}

      {!loading && requests.length > 0 && (
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

      {error && <p className="hotel-alert hotel-alert-error mb-5">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">All clear</p>
          <p className="mt-2 text-sm text-muted">No guest requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {requests.map((request) => (
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
          ))}
        </div>
      )}
    </section>
  );
}
