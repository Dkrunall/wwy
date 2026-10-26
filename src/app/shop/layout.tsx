import type { Metadata } from "next";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Sourdough, croissants and bakes, baked to order and delivered across Mumbai every Wednesday and Saturday.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop | Wild Wild Yeast", url: "/shop" },
};

// Product structured data. Offers are left out while a product still carries the ₹1 placeholder
// price, so search engines never index a wrong price. Set real prices in lib/products.ts.
const PRODUCT_JSON_LD = products.map((p) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.desc,
  image: p.image,
  category: p.category,
  brand: { "@type": "Brand", name: "Wild Wild Yeast" },
  ...(p.priceNum > 1
    ? { offers: { "@type": "Offer", priceCurrency: "INR", price: p.priceNum, availability: "https://schema.org/InStock", url: "/shop" } }
    : {}),
}));

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }} />
      {children}
    </>
  );
}
