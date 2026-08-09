import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RequestFeedPanel } from "@/components/RequestFeedPanel";

export default function RequestsPage() {
  return (
    <OperationsPageLayout
      subtitle="Everything guests asked for from their room. Tap Done when it is handled."
      maxWidthClass="max-w-5xl"
    >
      <RequestFeedPanel />
    </OperationsPageLayout>
  );
}
