import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | Wild Wild Yeast Artisan Bakery, Mumbai",
  description: "Discover the story behind Wild Wild Yeast, a Mumbai bakery exploring naturally fermented sourdough, small-batch bakes and unexpected flavours.",
  alternates: { canonical: "/story" },
  openGraph: { title: "Our Story | Wild Wild Yeast", url: "/story" },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
