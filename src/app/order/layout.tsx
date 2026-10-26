import type { Metadata } from "next";

// /order is the client-rendered ordering flow (cart, login, account). The indexable catalogue is /shop,
// so search engines skip this section and treat /shop as the canonical product list (P2-8).
export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
  alternates: { canonical: "/shop" },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
