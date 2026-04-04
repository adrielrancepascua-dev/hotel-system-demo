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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      {!hasSupabaseConfig && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Demo mode is active. Add Supabase env keys for live guest requests.
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">No guest requests right now.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="staff-mode-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                    Room {request.room_number} - {requestTypeLabels[request.request_type]}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <span
                    className={`staff-mode-badge rounded-full px-3 py-1 text-xs font-semibold ${requestStatusStyles[request.status]}`}
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
                      className="staff-mode-action staff-mode-action-primary bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
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
