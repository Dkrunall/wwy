import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import ContactForm from "@/components/ContactForm";
import { BUSINESS, businessValue } from "@/lib/business";
import { WHATSAPP_CONTACT_URL, WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Wild Wild Yeast | Mumbai Bakery & Online Orders",
  description: "Contact Wild Wild Yeast for questions about sourdough, products, online orders, baking schedules and delivery in Mumbai.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const g = BUSINESS.grievanceOfficer;
  return (
    <PolicyPage
      eyebrow="Get in touch"
      title="Let's talk good food."
      showUpdated={false}
      intro="A question about a loaf? Need help with an order? Curious about what's baking next? We're here to help."
    >
      <h2>Order support</h2>
      <p>Questions about existing orders, delivery updates, upcoming bake schedules or product availability.</p>
      <ul>
        <li>WhatsApp: <a href={WHATSAPP_CONTACT_URL} target="_blank" rel="noopener noreferrer">{BUSINESS.carePhone}</a></li>
        <li>Email: {businessValue(BUSINESS.careEmail)}</li>
      </ul>

      <h2>General enquiries</h2>
      <p>For collaborations, business enquiries and everything else. Gifting enquiries are on the <Link href="/gifting">Gifting page</Link>.</p>
      <ul>
        <li>Email: {businessValue(BUSINESS.careEmail)}</li>
        <li>Instagram: <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer">@{BUSINESS.instagramHandle}</a></li>
      </ul>

      <h2>Send us a message</h2>
      <ContactForm whatsappNumber={WHATSAPP_NUMBER} />
      <p>For damaged or wrong items, see our <Link href="/refund">Refund and Cancellation Policy</Link>.</p>

      <h2>Grievance officer</h2>
      <p>
        As required by the Consumer Protection (E-Commerce) Rules, 2020:<br />
        {businessValue(g.name)}<br />
        Email: {businessValue(g.email)}<br />
        Phone: {businessValue(g.phone)}<br />
        Available {g.hours}. We acknowledge complaints within 48 hours and resolve them within one month.
      </p>

      <h2>Business details</h2>
      <p>
        {BUSINESS.legalName}, trading as {BUSINESS.brand}<br />
        Registered office: {businessValue(BUSINESS.registeredAddress)}<br />
        LLPIN: {businessValue(BUSINESS.llpin)}<br />
        GSTIN: {businessValue(BUSINESS.gstin)}<br />
        FSSAI licence no.: {businessValue(BUSINESS.fssai)}
      </p>
    </PolicyPage>
  );
}
