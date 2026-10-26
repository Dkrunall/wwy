import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description: "How Wild Wild Yeast started with a jar of flour and water in Bandra, and why everything is baked to order.",
  alternates: { canonical: "/story" },
  openGraph: { title: "Our Story | Wild Wild Yeast", url: "/story" },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
