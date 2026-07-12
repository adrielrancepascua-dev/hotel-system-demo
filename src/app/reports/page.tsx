import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReportsPanel } from "@/components/ReportsPanel";

export default function ReportsPage() {
  return (
    <OperationsPageLayout
      title="Owner Reports"
      subtitle="Occupancy, ADR, RevPAR, and revenue at a glance — the numbers that tell you how the property is performing."
    >
      <ReportsPanel />
    </OperationsPageLayout>
  );
}
