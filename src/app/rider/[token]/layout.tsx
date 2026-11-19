import type { Metadata } from "next";

// The rider's private deliveries page. Never indexed.
export const metadata: Metadata = {
  title: "Deliveries",
  robots: { index: false, follow: false },
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
