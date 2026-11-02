import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import PincodeCheck from "@/components/PincodeCheck";
import { BUSINESS, businessValue } from "@/lib/business";
import { scheduleWindows, deliveryDaysLong, cutoffRuleText } from "@/lib/schedule";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Delivery Information & Ordering | Wild Wild Yeast Mumbai",
  description:
    "Find out how to order Wild Wild Yeast sourdough and bakes online, including delivery coverage, order timelines and twice-weekly baking schedules.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  const windows = scheduleWindows();
  return (
    <PolicyPage
      eyebrow="Delivery and ordering"
      title="From our batch to your table."
      updated="October 2026"
      bannerImage="/product_img/7-from-the-oven.jpg"
      intro="Freshly baked. Thoughtfully prepared. Delivered to your doorstep."
    >
      <p>
        At Wild Wild Yeast, we bake twice a week to bring you our range of sourdough and flavour-led bakes. Here&apos;s everything you need to know
        about placing an order, checking delivery availability and planning for your next fresh batch.
      </p>

      <h2>How ordering works</h2>
      <ul>
        <li><strong>Step 1, find your favourites:</strong> browse our collections, explore the available flavours and add your chosen products to your cart.</li>
        <li><strong>Step 2, confirm your details:</strong> enter your delivery address and contact information at checkout. Available delivery options are shown based on your location.</li>
        <li><strong>Step 3, review your order:</strong> check your products, quantities, order total and delivery details before completing payment.</li>
        <li><strong>Step 4, look out for updates:</strong> follow the order confirmation and delivery information provided after your purchase.</li>
      </ul>

      <h2>Do we deliver to you?</h2>
      <p>We currently serve Mumbai, on the pincodes we have partnered for delivery. Check yours here, or at checkout:</p>
      <div className="bg-white rounded-[1.5rem] border border-brand-brown/5 p-5 w-fit">
        <PincodeCheck />
      </div>

      <h2>Twice a week. Always worth the wait.</h2>
      <p>We bake twice a week, so your favourite loaves and bakes follow a set rhythm. We deliver on {deliveryDaysLong()}.</p>
      <ul>
        {windows.map((w) => (
          <li key={w.delivery}>
            <strong>{w.delivery} delivery:</strong> order by {w.time} on {w.cutoff}.
          </li>
        ))}
      </ul>
      <p>Orders close {cutoffRuleText()}. An order placed after a cutoff goes into the next delivery window. At checkout you can see the delivery date your order will arrive on.</p>

      <h2>Delivery charges</h2>
      <ul>
        <li>₹{STANDARD_SHIPPING_FEE_PAISE / 100} on orders below ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100}.</li>
        <li>Free on orders of ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100} and above. The threshold is measured on your cart total before any discount.</li>
      </ul>

      <h2>When your order arrives</h2>
      <ul>
        <li>We deliver during the day on your delivery date. Please make sure someone can receive the order.</li>
        <li>Food is best eaten fresh. Storage advice is on each product page.</li>
        <li>If an order is late, damaged or wrong, see our <Link href="/refund">Refund and Cancellation Policy</Link>.</li>
      </ul>

      <h2>Need help?</h2>
      <p>
        For questions about an order, delivery or product availability, contact us on WhatsApp at {BUSINESS.carePhone} or email {businessValue(BUSINESS.careEmail)}, or use
        the <Link href="/contact">Contact page</Link>. Ready to order? <Link href="/shop">Shop the latest batch</Link>.
      </p>
    </PolicyPage>
  );
}
