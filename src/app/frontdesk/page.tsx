import { redirect } from "next/navigation";

export default function FrontDeskPage() {
  redirect("/ops?filter=frontdesk");
}
