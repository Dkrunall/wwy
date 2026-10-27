import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessValue } from "@/lib/business";

export const metadata: Metadata = {
  title: "Allergen and Food Safety Policy",
  description: "Allergen information, kitchen cross-contact and food safety practices at Wild Wild Yeast.",
};

export default function AllergensPage() {
  return (
    <PolicyPage eyebrow="Legal" title="Allergen and Food Safety Policy">
      <p>
        Everything we sell is vegetarian. This page explains the allergens you should know about before you order, and how we handle food safety.
      </p>

      <h2>Allergens in our food</h2>
      <ul>
        <li>All our breads and bakes contain <strong>gluten</strong> (wheat).</li>
        <li>Many items contain <strong>milk and milk products</strong> (butter, cheese, paneer, curd), <strong>eggs</strong>, <strong>nuts</strong> or <strong>sesame</strong>. Flavours rotate every week, so ingredients change.</li>
        <li>Each product page lists its ingredients and allergens under &ldquo;Product details&rdquo;. Please read it before you order.</li>
      </ul>

      <h2>Cross-contact</h2>
      <p>
        Our products are baked in a kitchen that handles gluten, dairy, eggs, nuts and sesame. We cannot guarantee that any item is free of
        these allergens, even if it is not on the ingredient list. If you have a severe allergy, please do not rely on our products.
      </p>

      <h2>Asking before you order</h2>
      <p>
        If you have an allergy or a dietary need, message us on WhatsApp at {BUSINESS.carePhone} or through the <Link href="/contact">Contact page</Link> before ordering.
        We will tell you what is in this week&apos;s batch.
      </p>

      <h2>Food safety</h2>
      <ul>
        <li>We bake to order and deliver on set delivery days, so nothing sits in stock.</li>
        <li>Our bakes are fresh food, so eat them within the &ldquo;best before&rdquo; time shown on the product. Storage advice is on each product page.</li>
        <li>Fermentation continues after baking, so a loaf will change slowly in texture and taste. Store it as the product page advises.</li>
        <li>Some items, such as Be-Sides, are made for us by partner kitchens. Their manufacturer name and FSSAI number are shown on the product page.</li>
      </ul>

      <h2>Our licence</h2>
      <p>FSSAI licence number: {businessValue(BUSINESS.fssai)}</p>

      <h2>If something is wrong</h2>
      <p>
        If you think an item is unsafe, stop eating it and report it within 24 hours of delivery with a photo. See the <Link href="/refund">Refund and Cancellation Policy</Link> for how we make it right.
      </p>
    </PolicyPage>
  );
}
