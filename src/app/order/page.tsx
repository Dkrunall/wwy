import { redirect } from "next/navigation";

// The menu lives at /shop. Old /order links (with ?q= or ?category=) land there.
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, category } = await searchParams;
  const params = new URLSearchParams();
  if (typeof q === "string" && q.trim()) params.set("q", q.trim());
  if (typeof category === "string" && category.trim()) params.set("category", category.trim());
  const qs = params.toString();
  redirect(qs ? `/shop?${qs}` : "/shop");
}
