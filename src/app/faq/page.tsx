import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, POLICY, businessValue } from "@/lib/business";
import { cutoffRuleText, deliveryDaysLong } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Sourdough, Ordering & Delivery FAQs | Wild Wild Yeast",
  description:
    "Have questions about Wild Wild Yeast sourdough, ingredients, storage, twice-weekly baking, ordering or delivery in Mumbai? Find helpful answers in our FAQs.",
  alternates: { canonical: "/faq" },
};

type Faq = { q: string; a: string; link?: { href: string; label: string } };

const SUPPORT = `WhatsApp ${BUSINESS.carePhone} or email ${businessValue(BUSINESS.careEmail)}`;

const GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "About our products",
    items: [
      {
        q: "What is sourdough?",
        a: "Sourdough is bread made using a fermented starter containing naturally occurring yeast and bacteria. Fermentation helps develop its distinctive flavour and texture.",
      },
      {
        q: "What makes Wild Wild Yeast different?",
        a: "We bring together the craft of sourdough fermentation and a curiosity for flavour. Our range includes naturally fermented loaves, flavour-led bakes and snacks.",
      },
      {
        q: "Do you offer flavoured sourdough?",
        a: "Yes, our Crafted Bakes collection includes flavoured sourdough. Explore the current product listings for available flavours, ingredients and prices.",
        link: { href: "/flavour-lab", label: "See the Flavour Lab" },
      },
      {
        q: "Do your products contain allergens?",
        a: "Yes. Our bakes contain gluten, and many contain dairy, eggs, nuts or sesame. Review the ingredients and allergen information on each product page before ordering.",
        link: { href: "/allergens", label: "Read our allergen policy" },
      },
      {
        q: "Are your products suitable for vegans?",
        a: "Everything we make is vegetarian, but many of our bakes contain dairy or eggs, so they are not vegan. Please check the ingredient list on each product.",
      },
    ],
  },
  {
    title: "Baking and freshness",
    items: [
      {
        q: "How often do you bake?",
        a: "We bake twice a week to bring you fresh batches of our sourdough and other selected bakes.",
      },
      {
        q: "Are your products freshly baked?",
        a: "Our baking schedule is designed around fresh, small-batch production. Check the product details and current schedule for information relevant to your order.",
      },
      {
        q: "Can I order any day of the week?",
        a: `You can browse and order any day. Orders close ${cutoffRuleText()}, and an order placed after a cutoff goes into the next delivery window.`,
      },
      {
        q: "When should I place my order?",
        a: "Please refer to the displayed order cutoff and next available bake date. This helps you plan around the batch you want.",
      },
    ],
  },
  {
    title: "Ordering and delivery",
    items: [
      {
        q: "Where do you deliver?",
        a: "We deliver across Mumbai, to the pincodes we currently serve. Check yours on our Delivery page or at checkout.",
        link: { href: "/delivery", label: "Check your pincode" },
      },
      {
        q: "How do I place an order?",
        a: "Browse the shop, choose your products, add them to your cart and complete checkout with your delivery and payment details.",
      },
      {
        q: "When will my order arrive?",
        a: `We deliver on ${deliveryDaysLong()}. Your delivery date is shown during checkout, based on the baking schedule and the cutoff.`,
      },
      {
        q: "Can I change or cancel my order?",
        a: `You can cancel for free until the cutoff for your delivery day. After that we have already started baking. Contact us on ${SUPPORT} as soon as possible.`,
        link: { href: "/refund", label: "Order and cancellation policy" },
      },
      {
        q: "What payment methods are accepted?",
        a: "Payments are handled securely by Razorpay. Available payment methods are displayed at checkout.",
      },
      {
        q: "What if my order arrives damaged or incomplete?",
        a: `Contact us within ${POLICY.reportWindowHours} hours of delivery on ${SUPPORT}, with your order number and photographs, so our team can review the issue.`,
        link: { href: "/refund", label: "Refund and replacement policy" },
      },
    ],
  },
  {
    title: "Storage and freshness",
    items: [
      {
        q: "How should I store my sourdough?",
        a: "Follow the storage instructions on your product's page. Storage recommendations and shelf life may vary by recipe and product type.",
      },
      {
        q: "Can I freeze sourdough bread?",
        a: "Freezing may be suitable for certain breads. Refer to the storage instructions on the product page for the recommended method.",
      },
      {
        q: "How do I find out about new flavours?",
        a: "Explore the Flavour Lab and join our WhatsApp list for updates on new products, fresh batches and available flavours.",
        link: { href: "/flavour-lab", label: "Open the Flavour Lab" },
      },
    ],
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) => g.items).map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <PolicyPage
      eyebrow="FAQs"
      title="Good questions. Straight answers."
      showUpdated={false}
      intro="Everything you need to know about our bakes, the ordering process and getting your Wild Wild Yeast favourites delivered to your doorstep."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      {GROUPS.map((g) => (
        <div key={g.title} className="flex flex-col gap-3">
          <h2>{g.title}</h2>
          {g.items.map((f) => (
            <details key={f.q} className="group bg-white rounded-2xl border border-brand-brown/5 px-5 py-4">
              <summary className="cursor-pointer list-none font-black text-brand-brown flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden className="text-brand-orange transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3">{f.a}</p>
              {f.link && (
                <p className="mt-2">
                  <Link href={f.link.href}>{f.link.label}</Link>
                </p>
              )}
            </details>
          ))}
        </div>
      ))}

      <h2>Still have a question?</h2>
      <p>
        We&apos;re happy to help. <Link href="/contact">Contact us</Link>.
      </p>
    </PolicyPage>
  );
}
