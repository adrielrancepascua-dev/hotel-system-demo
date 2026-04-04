import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RoomOperationsBoard } from "@/components/RoomOperationsBoard";

export default function DashboardPage() {
  return (
    <OperationsPageLayout
      title="Manager Room Status Dashboard"
      subtitle="Monitor live room state and apply role-specific operations."
      topSlot={
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
            <p className="font-semibold">Demo Guide for Managers</p>
            <p title="Rooms 101-120 are seeded to show occupancy and cleaning movement.">
              Rooms 101-120 are preloaded with mixed statuses for walkthroughs.
            </p>
          </article>
          <article className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
            <p className="font-semibold">Realtime Quick Tip</p>
            <p title="Open /frontdesk, /housekeeping, and /requests in separate tabs and perform an action.">
              Open multiple staff pages in different tabs to observe instant sync.
            </p>
          </article>
        </div>
      }
    >
      <RoomOperationsBoard mode="manager" />
    </OperationsPageLayout>
  );
}
