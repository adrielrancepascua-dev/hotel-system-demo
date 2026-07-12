import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReservationsPanel } from "@/components/ReservationsPanel";

export default function ReservationsPage() {
  return (
    <OperationsPageLayout
      title="Reservations"
      subtitle="Bookings with guest details, stay dates, and source. Walk-ins and OTAs land here; check-in opens a folio automatically."
    >
      <ReservationsPanel />
    </OperationsPageLayout>
  );
}
