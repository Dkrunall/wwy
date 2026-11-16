import { redirect } from "next/navigation";

// The menu now lives at /shop. Old /order links (and ?q= searches) land there.
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q } = await searchParams;
  redirect(typeof q === "string" && q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
}
