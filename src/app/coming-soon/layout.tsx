import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Wild Wild Yeast | Sourdough, Mumbai" },
  description: "Bake-to-order sourdough, delivered across Mumbai every Wednesday and Saturday. Opening soon.",
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
