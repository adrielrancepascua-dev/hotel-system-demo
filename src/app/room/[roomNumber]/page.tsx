import { GuestConciergePanel } from "@/components/GuestConciergePanel";

export default async function RoomConciergePage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;

  return <GuestConciergePanel roomNumber={roomNumber} />;
}
