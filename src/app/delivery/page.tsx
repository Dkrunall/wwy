import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import PincodeCheck from "@/components/PincodeCheck";
import { scheduleWindows, deliveryDaysLong } from "@/lib/schedule";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: "Wild Wild Yeast delivers across Mumbai every Wednesday and Saturday. Order cutoffs, delivery charges and areas we serve.",
};

export default function DeliveryPage() {
  const windows = scheduleWindows();
  return (
    <PolicyPage eyebrow="Legal" title="Delivery Policy">
      <p>We deliver across Mumbai on {deliveryDaysLong()}. Everything is baked to order for your delivery day.</p>

      <h2>Delivery windows and cutoffs</h2>
      <ul>
        {windows.map((w) => (
          <li key={w.delivery}>
            <strong>{w.delivery} delivery:</strong> order by {w.time} on {w.cutoff}.
          </li>
        ))}
      </ul>
      <p>An order placed after a cutoff goes into the next delivery window. At checkout you can see the delivery date your order will arrive on.</p>

      <h2>Delivery charges</h2>
      <ul>
        <li>₹{STANDARD_SHIPPING_FEE_PAISE / 100} on orders below ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100}.</li>
        <li>Free on orders of ₹{FREE_SHIPPING_THRESHOLD_PAISE / 100} and above. The threshold is measured on your cart total before any discount.</li>
      </ul>

      <h2>Where we deliver</h2>
      <p>We deliver only to serviceable pincodes in Mumbai, and the list grows as we do. Check yours here:</p>
      <div className="bg-white rounded-[1.5rem] border border-brand-brown/5 p-5 w-fit">
        <PincodeCheck />
      </div>

      <h2>When your order arrives</h2>
      <ul>
        <li>We deliver during the day on your delivery date. Please make sure someone can receive the order.</li>
        <li>Food is best eaten fresh. Storage advice is on each product page.</li>
        <li>If an order is late, damaged or wrong, see our <Link href="/refund">Refund and Cancellation Policy</Link>.</li>
      </ul>
    </PolicyPage>
  );
}
