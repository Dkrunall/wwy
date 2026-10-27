import type { Metadata } from "next";
import { getShopProducts } from "@/lib/shopProducts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  description: "Sourdough, croissants and bakes, baked to order and delivered across Mumbai every Wednesday and Saturday.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop | Wild Wild Yeast", url: "/shop" },
};

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Product structured data, priced from the database. Offers are left out while a product
  // still carries the ₹1 placeholder price, so search engines never index a wrong price.
  const products = await getShopProducts();
  const productJsonLd = products.map((p) => ({
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {children}
    </>
  );
}
