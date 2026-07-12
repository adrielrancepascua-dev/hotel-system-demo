import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { UnifiedOpsBoard } from "@/components/UnifiedOpsBoard";
import type { OpsFilter } from "@/lib/types";

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter =
    params.filter === "frontdesk" || params.filter === "housekeeping"
      ? (params.filter as OpsFilter)
      : "all";

  return (
    <OperationsPageLayout
      title="Operations Console"
      subtitle="One board for every room action — check-in, checkout, cleaning, and maintenance. Status drives the next step; staff on shift gets the credit."
    >
      <UnifiedOpsBoard initialFilter={filter} />
    </OperationsPageLayout>
  );
}
