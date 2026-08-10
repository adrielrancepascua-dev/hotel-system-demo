import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReservationsPanel } from "@/components/ReservationsPanel";

export default function ReservationsPage() {
  return (
    <OperationsPageLayout subtitle="Save guests who are arriving later. Walk-ins are faster on Front Desk.">
      <ReservationsPanel />
    </OperationsPageLayout>
  );
}
