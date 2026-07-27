import { redirect } from "next/navigation";

/** Housekeeping does not use a screen — desk updates status after radio/Messenger */
export default function HousekeepingPage() {
  redirect("/ops");
}
