"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";

import { useToast } from "@/components/Toast";
import { roomStatusStyles } from "@/lib/constants";
import { getRoomType } from "@/lib/metrics";
import { useDemoStore } from "@/lib/store/DemoStore";

export function GuestLinksPanel() {
  const { state, hydrated } = useDemoStore();
  const { notify } = useToast();
  const [origin, setOrigin] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const rooms = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return state.rooms;
    return state.rooms.filter((r) => r.room_number.toLowerCase().includes(search));
  }, [state.rooms, query]);

  async function copyLink(roomNumber: string) {
    const url = `${origin}/room/${roomNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      notify(`Link copied for Room ${roomNumber}`);
    } catch {
      notify("Could not copy. Long-press the link to copy it.", { tone: "error" });
    }
  }

  if (!hydrated) {
    return <p className="px-4 text-sm text-muted sm:px-6">Loading rooms…</p>;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-6 sm:py-5">
      <label htmlFor="guest-link-search" className="sr-only">
        Search room number
      </label>
      <input
        id="guest-link-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search room number…"
        className="hotel-input mb-4"
      />

      <div
        style={{ "--stagger-step": "18ms" } as CSSProperties}
        className="hotel-stagger grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
      >
        {rooms.map((room, index) => {
          const type = getRoomType(room, state.roomTypes);
          const theme = roomStatusStyles[room.status];
          return (
            <article
              key={room.id}
              style={{ "--i": index } as CSSProperties}
              className="hotel-card flex items-center justify-between gap-3 p-3 sm:p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${theme.dot}`} />
                  <p className="hotel-label truncate text-muted">
                    {type?.name ?? "Room"}
                  </p>
                </div>
                <p className="font-display text-2xl font-semibold text-navy">
                  {room.room_number}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link
                  href={`/room/${room.room_number}`}
                  className="hotel-btn hotel-btn-secondary text-xs"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => copyLink(room.room_number)}
                  className="hotel-btn hotel-btn-secondary text-xs"
                >
                  Copy link
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="hotel-card py-12 text-center">
          <p className="font-display text-xl text-navy">No room matches that number</p>
        </div>
      )}
    </section>
  );
}
