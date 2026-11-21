import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Standing Order",
  description: "Two flavoured sourdough loaves a week from Wild Wild Yeast, paid monthly. Skip bakes, pick flavours and earn Crumb Points.",
  alternates: { canonical: "/subscribe" },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
