import { redirect } from "next/navigation";

export default function HousekeepingPage() {
  redirect("/ops?filter=housekeeping");
}
