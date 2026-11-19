import type { Metadata } from "next";

// A customer's private order tracking page. Never indexed.
export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
