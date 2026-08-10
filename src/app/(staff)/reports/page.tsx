import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { ReportsPanel } from "@/components/ReportsPanel";

export default function ReportsPage() {
  return (
    <OperationsPageLayout subtitle="How the hotel is doing today — rooms filled, money collected, and what is still unpaid.">
      <ReportsPanel />
    </OperationsPageLayout>
  );
}
