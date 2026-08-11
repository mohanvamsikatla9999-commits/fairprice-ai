import { redirect } from "next/navigation";

/** Jobs is a real marketplace category now. */
export default function JobsRedirect() {
  redirect("/category/jobs");
}
