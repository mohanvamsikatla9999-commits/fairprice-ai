import { redirect } from "next/navigation";

/** Property sale is a real marketplace category now. */
export default function PropertySaleRedirect() {
  redirect("/category/properties");
}
