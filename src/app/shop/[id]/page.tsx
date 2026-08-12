import { redirect } from "next/navigation";

// Single product page is hidden for now — send visitors back to the shop listing.
export default function ProductDetailPage() {
  redirect("/shop");
}
