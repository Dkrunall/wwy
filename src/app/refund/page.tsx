import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, POLICY, businessValue } from "@/lib/business";
import { cutoffRuleText } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy",
  description: "Free cancellation until the order cutoff, and refunds or replacements for damaged or wrong items at Wild Wild Yeast.",
};

export default function RefundPage() {
  return (
    <PolicyPage eyebrow="Legal" title="Refund and Cancellation Policy">
      <p>Our food is baked to order and perishable, so the rules below are different from a shop that sells packaged goods.</p>

      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel for free until the cutoff for your delivery day: {cutoffRuleText()}.</li>
        <li>To cancel, message us on WhatsApp or email {businessValue(BUSINESS.careEmail)} with your order number before the cutoff. We refund the full amount, including delivery.</li>
        <li>After the cutoff we have already started baking, so we cannot cancel or refund the order.</li>
      </ul>

      <h2>Returns</h2>
      <p>Because our products are perishable, we cannot accept returns once an order has been delivered.</p>

      <h2>Damaged, wrong or unsafe items</h2>
      <p>If something arrives damaged, is not what you ordered, or is not fit to eat, we will refund it or send a replacement, whichever you prefer.</p>
      <ul>
        <li>Report it within {POLICY.reportWindowHours} hours of delivery.</li>
        <li>Send your order number and a clear photo of the item and its packaging on WhatsApp or by email.</li>
        <li>We will reply within one working day. If your claim is approved, a replacement goes out on the next delivery day, or we refund the item.</li>
      </ul>
      <p>Differences that come from wild fermentation, such as a slightly different crumb or crust colour from batch to batch, are not defects.</p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the original payment method through Razorpay. After approval, they usually reach you in {POLICY.refundDays}, depending on your bank.
      </p>

      <h2>Contact</h2>
      <p>Reach us through the <Link href="/contact">Contact page</Link>.</p>
    </PolicyPage>
  );
}
