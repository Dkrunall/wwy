import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessValue } from "@/lib/business";
import { cutoffRuleText, deliveryDaysLong } from "@/lib/schedule";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms that apply when you order from Wild Wild Yeast: prices, orders, cutoffs, delivery, perishables and liability.",
};

export default function TermsPage() {
  return (
    <PolicyPage eyebrow="Legal" title="Terms of Sale">
      <p>
        These terms apply to every order placed on wildwildyeast.com. By placing an order you agree to them. Please read them together with our{" "}
        <Link href="/refund">Refund and Cancellation Policy</Link>, <Link href="/delivery">Delivery Policy</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Who we are</h2>
      <p>
        {BUSINESS.brand} is operated by {BUSINESS.legalName}, a limited liability partnership registered in India.
        Registered office: {businessValue(BUSINESS.registeredAddress)}. LLPIN: {businessValue(BUSINESS.llpin)}.
        GSTIN: {businessValue(BUSINESS.gstin)}. FSSAI licence no.: {businessValue(BUSINESS.fssai)}.
      </p>

      <h2>Prices and payment</h2>
      <ul>
        <li>All prices are in Indian rupees and are the maximum retail price, inclusive of all taxes.</li>
        <li>Delivery is ₹{STANDARD_SHIPPING_FEE_PAISE / 100} on orders below ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100}, and free from ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100}.</li>
        <li>Payment is taken online through Razorpay (card, UPI or netbanking) when you place the order. We start baking only after payment is confirmed.</li>
        <li>You will receive a GST tax invoice by email after payment.</li>
      </ul>

      <h2>Orders, cutoffs and delivery days</h2>
      <p>
        Everything is made to order. We deliver on {deliveryDaysLong()}. Orders close at {cutoffRuleText()}. An order placed after a cutoff goes into the next window.
        We may decline or cancel an order, with a full refund, if an item cannot be made or your pincode is outside our delivery area.
      </p>

      <h2>Perishable food</h2>
      <p>
        Our products are fresh, perishable food. Please check each product page for ingredients, allergens, storage and best-before information.
        If you have an allergy, contact us before ordering. Our kitchen and partner kitchens handle gluten, dairy, nuts and sesame.
      </p>

      <h2>Cancellations, refunds and replacements</h2>
      <p>See our <Link href="/refund">Refund and Cancellation Policy</Link>.</p>

      <h2>Our responsibility</h2>
      <p>
        We take care to make and deliver food that is safe and as described. To the extent the law allows, our liability for any order is limited to the amount you paid for it.
        Nothing in these terms limits your rights under the Consumer Protection Act, 2019.
      </p>

      <h2>Website use</h2>
      <p>The content on this site, including text, photographs and the Wild Wild Yeast name and logo, belongs to us. Please do not copy or reuse it without asking.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. The courts at Mumbai have jurisdiction, subject to your right as a consumer to approach the consumer forum that has jurisdiction over you.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? See our <Link href="/contact">Contact page</Link>.</p>
    </PolicyPage>
  );
}
