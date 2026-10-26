import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessValue } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Wild Wild Yeast collects, uses and protects your personal data under the Digital Personal Data Protection Act, 2023.",
};

export default function PrivacyPage() {
  const g = BUSINESS.grievanceOfficer;
  return (
    <PolicyPage eyebrow="Legal" title="Privacy Policy">
      <p>
        This policy explains what personal data {BUSINESS.legalName} (trading as {BUSINESS.brand}) collects when you use wildwildyeast.com,
        why we collect it, who sees it, and how you can ask us to correct or delete it. We handle your data in line with the Digital
        Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Name, email address and phone number, to create your account and contact you about your order.</li>
        <li>Delivery address, flat number and pincode, to deliver your order and check that we serve your area.</li>
        <li>Order details: what you ordered, delivery date, amount paid and coupons used.</li>
        <li>If you join our WhatsApp updates: your WhatsApp number and the time you agreed.</li>
      </ul>
      <p>We do not store your card, UPI or bank details. Payments are handled by Razorpay.</p>

      <h2>Why we use it</h2>
      <ul>
        <li>To take, bake, pack and deliver your order, and to send order updates and your tax invoice.</li>
        <li>To run your account, order history and repeat orders.</li>
        <li>To prevent fraud and meet our tax, accounting and food-safety obligations.</li>
        <li>To send you news and menu updates, only if you have opted in. You can opt out at any time.</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li>Razorpay, our payment processor, to take payment and process refunds.</li>
        <li>Our baking and delivery partners, who see only what they need to prepare and deliver your order (name, address, phone, order contents).</li>
        <li>Service providers that host our website and database and send our emails and messages, under contract and only to run our service.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account details: until you ask us to delete your account.</li>
        <li>Order and invoice records: for 8 years, because tax and accounting law requires us to keep them.</li>
        <li>WhatsApp update subscriptions: until you opt out.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask us to show you the data we hold about you, correct it, or delete it, and you can withdraw consent for updates at any time.
        Email {businessValue(BUSINESS.careEmail)} with the subject &quot;Data request&quot; from the email address or phone number on your account.
        We will respond within 30 days. Where we must keep records by law, we will tell you which ones and why.
      </p>

      <h2>Grievance officer</h2>
      <p>
        {businessValue(g.name)}<br />
        Email: {businessValue(g.email)}<br />
        Phone: {businessValue(g.phone)}<br />
        Available {g.hours}
      </p>
      <p>If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a way that matters, we will update the date above and, where needed, tell you directly.</p>
    </PolicyPage>
  );
}
