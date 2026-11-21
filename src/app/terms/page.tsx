import { DELIVERY_CHARGE_TEXT } from "@/lib/shipping";
import { CART_TIERS, EXPIRY_BAKE_CYCLES, MAX_CREDIT_SHARE, SUB_CREDIT_PERCENT } from "@/lib/crumbPoints";
import { MAX_SKIPS_PER_PERIOD, STREAK_BAKES, SUB_LOAVES_PER_WEEK, SUB_PERIOD_WEEKS } from "@/lib/subscriptions";
import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessValue } from "@/lib/business";
import { cutoffRuleText, deliveryDaysLong } from "@/lib/schedule";

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
        <li>We deliver within Mumbai only. {DELIVERY_CHARGE_TEXT} The charge, if any, is shown at checkout before you pay.</li>
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

      <h2>Crumb Points</h2>
      <ul>
        <li>Crumb Points are promotional credit. You earn them on qualifying orders ({CART_TIERS.slice().reverse().map((t) => `${t.percent}% back on orders of ₹${t.minPaise / 100} or more`).join(", ")}), added once the order is delivered and paid.</li>
        <li>Points come off your next order automatically, up to {MAX_CREDIT_SHARE * 100}% of the order value. One rupee of points is worth one rupee off.</li>
        <li>Points cannot be bought, topped up, transferred or exchanged for cash. They can only be used on Wild Wild Yeast orders.</li>
        <li>If an order is cancelled or refunded, the points it earned are taken back and the points it used are returned.</li>
        <li>Points expire if you place no order for {EXPIRY_BAKE_CYCLES} bake days in a row.</li>
      </ul>

      <h2>Standing Order</h2>
      <ul>
        <li>A Standing Order is {SUB_LOAVES_PER_WEEK} flavoured sourdough loaves a week on the days you choose, paid in advance for {SUB_PERIOD_WEEKS} weeks at a time. Your payment is an advance for those loaves, not stored value.</li>
        <li>You can pick a flavour for each bake or leave it to the baker, and skip up to {MAX_SKIPS_PER_PERIOD} bakes a month before the order cutoff. Skipped loaves come off your next payment.</li>
        <li>We email a payment link before each paid month ends. If it isn&apos;t paid by the next order cutoff, deliveries pause with no penalty and restart from the first open bake after you pay.</li>
        <li>Each Standing Order bake earns {SUB_CREDIT_PERCENT}% of its value in Crumb Points once delivered. When your balance reaches the price of a loaf, it becomes a free loaf on your next bake.</li>
        <li>{STREAK_BAKES} bakes in a row without a skip earns two free Baker&apos;s Choice loaves, one sweet and one savoury, on your next bake.</li>
        <li>You can stop renewing at any time. Bakes already paid for are still delivered.</li>
      </ul>

      <h2>Cancellations and refunds</h2>
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
