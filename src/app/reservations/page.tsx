import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReservationsPanel } from "@/components/ReservationsPanel";

export default function ReservationsPage() {
  return (
    <OperationsPageLayout
      title="Bookings"
      subtitle="Save future stays here. Day-to-day check-in is on Front Desk."
    >
      <ReservationsPanel />
    </OperationsPageLayout>
  );
}
