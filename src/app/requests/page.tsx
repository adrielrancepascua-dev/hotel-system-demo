import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RequestFeedPanel } from "@/components/RequestFeedPanel";

export default function RequestsPage() {
  return (
    <OperationsPageLayout
      title="Staff Request Feed"
      subtitle="Incoming guest requests update instantly. Mark tasks complete when done."
      maxWidthClass="max-w-5xl"
    >
      <RequestFeedPanel />
    </OperationsPageLayout>
  );
}
