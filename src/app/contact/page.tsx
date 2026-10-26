import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessValue } from "@/lib/business";
import { WHATSAPP_CONTACT_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Wild Wild Yeast: customer care, WhatsApp, grievance officer and registered business details.",
};

export default function ContactPage() {
  const g = BUSINESS.grievanceOfficer;
  return (
    <PolicyPage eyebrow="Get in touch" title="Contact Us">
      <h2>Customer care</h2>
      <ul>
        <li>WhatsApp: <a href={WHATSAPP_CONTACT_URL} target="_blank" rel="noopener noreferrer">{BUSINESS.carePhone}</a></li>
        <li>Phone: {BUSINESS.carePhone}</li>
        <li>Email: {businessValue(BUSINESS.careEmail)}</li>
        <li>Instagram: <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer">@{BUSINESS.instagramHandle}</a></li>
      </ul>
      <p>Please include your order number. For damaged or wrong items, see our <Link href="/refund">Refund and Cancellation Policy</Link>.</p>

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
