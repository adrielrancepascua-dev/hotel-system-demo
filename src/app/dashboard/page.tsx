import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RoomOperationsBoard } from "@/components/RoomOperationsBoard";

export default function DashboardPage() {
  return (
    <OperationsPageLayout
      title="Manager Room Status Dashboard"
      subtitle="Monitor live room state and apply role-specific operations."
      topSlot={
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <article className="hotel-alert hotel-alert-info">
            <p className="font-semibold text-navy">Demo Guide for Managers</p>
            <p
              className="mt-1"
              title="Rooms 101-120 are seeded to show occupancy and cleaning movement."
            >
              Rooms 101–120 are preloaded with mixed statuses for walkthroughs.
            </p>
          </article>
          <article className="hotel-alert hotel-alert-info">
            <p className="font-semibold text-navy">Realtime Quick Tip</p>
            <p
              className="mt-1"
              title="Open /frontdesk, /housekeeping, and /requests in separate tabs and perform an action."
            >
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
