import { redirect } from "next/navigation";

// Single product page is hidden — the /order grid handles add-to-cart directly.
export default function ProductDetailPage() {
  redirect("/order");
}
