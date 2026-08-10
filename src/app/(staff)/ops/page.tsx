import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { UnifiedOpsBoard } from "@/components/UnifiedOpsBoard";

export default function OpsPage() {
  return (
    <OperationsPageLayout subtitle="Tap a room to check a guest in or out, add a charge, or change its status.">
      <UnifiedOpsBoard />
    </OperationsPageLayout>
  );
}
