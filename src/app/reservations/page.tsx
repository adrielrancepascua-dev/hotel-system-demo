import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReservationsPanel } from "@/components/ReservationsPanel";

export default function ReservationsPage() {
  return (
    <OperationsPageLayout
      title="Bookings"
      subtitle="Future stays and walk-in bookings. Day-to-day check-in still happens on Front Desk."
    >
      <ReservationsPanel />
    </OperationsPageLayout>
  );
}
