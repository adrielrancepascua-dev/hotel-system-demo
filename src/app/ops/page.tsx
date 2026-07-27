import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { UnifiedOpsBoard } from "@/components/UnifiedOpsBoard";

export default function OpsPage() {
  return (
    <OperationsPageLayout
      title="Front Desk"
      subtitle="Your notebook for the shift — check guests in and out, log charges, and update room status after you radio housekeeping."
    >
      <UnifiedOpsBoard />
    </OperationsPageLayout>
  );
}
