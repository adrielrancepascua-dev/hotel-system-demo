import { OperationsPageLayout } from "@/components/OperationsPageLayout";
import { RoomOperationsBoard } from "@/components/RoomOperationsBoard";

export default function FrontDeskPage() {
  return (
    <OperationsPageLayout
      title="Front Desk Console"
      subtitle="Check in and check out guests while tracking room availability."
    >
      <RoomOperationsBoard mode="frontdesk" />
    </OperationsPageLayout>
  );
}
