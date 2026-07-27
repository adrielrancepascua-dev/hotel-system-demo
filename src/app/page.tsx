import { redirect } from "next/navigation";

/** Desk is the home — landing is just a hop for demos */
export default function Home() {
  redirect("/ops");
}
