"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    day: "Announce",
    title: "We open an order window.",
    body: "Every few days we broadcast on Instagram and WhatsApp — a link goes out, the window opens. When it closes, it closes. Nothing is made outside it.",
    tag: "Instagram · WhatsApp",
  },
  {
    number: "02",
    day: "Order",
    title: "You message us on WhatsApp.",
    body: "Click the link, tell us what you want. New customers share their delivery address once — we verify it on Google Maps and pin it to your profile. Returning customers skip straight ahead.",
    tag: "WhatsApp only",
  },
  {
    number: "03",
    day: "Confirm",
    title: "We show you your delivery date.",
    body: "Before you commit, we tell you exactly when your order arrives — Wednesday or Saturday. Brewed items take 5–6 days, baked items are ready in 1–2. You confirm or step out.",
    tag: "Wed · Sat delivery",
  },
  {
    number: "04",
    day: "Pay",
    title: "Pay via UPI within 2 hours.",
    body: "We send an invoice with a UPI link and QR code. Payment reference your order ID. If payment doesn't come through within 2 hours, the order expires — we only bake and brew against confirmed payment.",
    tag: "2-hr window · UPI",
  },
  {
    number: "05",
    day: "Ferment",
    title: "Your order enters fermentation.",
    body: "Payment confirmed — fermentation begins. Your order has a date, a batch, a destination. Nothing is made speculatively. Nothing sits waiting.",
    tag: "Bake to order",
  },
  {
    number: "06",
    day: "Deliver",
    title: "Delivered on your fixed day.",
    body: "You get a reminder on delivery morning. Your order arrives fresh — never early, never stored. After delivery, we check in to make sure everything arrived right.",
    tag: "Fresh on delivery day",
  },
];

const deliveryRules = [
  { product: "Sourdough / Bread", lead: "1–2 days", notes: "Order by midnight the day before delivery" },
  { product: "Fermented Drinks", lead: "5–6 days", notes: "Window must open at least 6 days before delivery" },
  { product: "Fermented Sauces", lead: "7–10 days", notes: "Pre-announced seasonal batches" },
  { product: "Pantry items (Vinegar etc.)", lead: "In stock", notes: "Subject to availability, ships next delivery day" },
];

const faqs = [
  {
    q: "Why can I only order when a window is open?",
    a: "We don't keep stock. Every batch is planned from confirmed orders. The window tells us exactly what to make — closing it is how we avoid waste, overproduction, and preservatives.",
  },
  {
    q: "Why only Wednesday and Saturday delivery?",
    a: "Fermentation works on a timeline. Fixed delivery days let us bake and brew at the right moment so food arrives fresh. As we grow, we'll add more days.",
  },
  {
    q: "What happens if I don't pay within 2 hours?",
    a: "Your order expires and the slot opens back up. We only start production on paid orders — we don't hold batches for unpaid reservations. You can order again in the next window.",
  },
  {
    q: "My brewed item has a longer lead time — does it come with my bread?",
    a: "Not always. If your items have different lead times we'll offer split delivery — bread on the nearest date, drinks on the next appropriate slot. Or everything together on the later date. Your choice.",
  },
  {
    q: "Can I order as a new customer?",
    a: "Yes. First time, we'll ask for your name and delivery address over WhatsApp. We verify it on Google Maps and pin it to your profile. Every order after that is faster.",
  },
];

function Faq({ item }: { item: typeof faqs[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-brand-charcoal/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 leading-snug">
          {item.q}
        </span>
        <ChevronDown
          size={15}
          className={`text-brand-charcoal/30 shrink-0 mt-0.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${open ? "max-h-48 pb-5" : "max-h-0"}`}>
        <p className="text-sm sm:text-base md:text-lg font-bold text-brand-charcoal/60 leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hiw-step",
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: "power2.out",
          scrollTrigger: { trigger: ".hiw-grid", start: "top 82%" },
        }
      );
      gsap.fromTo(".hiw-lead-row",
        { x: -20, opacity: 0 },
        {
          x: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".hiw-leads", start: "top 85%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-brand-oat py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden z-20"
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <p className="font-black text-brand-charcoal/[0.025] tracking-tighter whitespace-nowrap"
          style={{ fontSize: "clamp(5rem, 18vw, 18rem)" }}>
          ORDER
        </p>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14 sm:mb-20">
          <div>
            <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              How Ordering Works
            </span>
            <h2
              className="font-black text-brand-charcoal tracking-tight leading-none"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              MADE TO ORDER.<br className="hidden sm:block" />
              <span className="text-brand-terracotta">VIA WHATSAPP.</span>
            </h2>
          </div>
          <div className="max-w-sm lg:pb-2 flex flex-col gap-2">
            <p className="text-sm sm:text-base md:text-xl font-bold text-brand-charcoal/60 leading-relaxed">
              We don't have a traditional cart. Every order starts with a WhatsApp message. We plan batches from confirmed orders, bake and brew to order, and deliver on fixed days.
            </p>
            <p className="text-xs sm:text-sm md:text-base font-black tracking-[0.15em] uppercase text-brand-charcoal/40 italic">
              We don't rush food. We plan for it.
            </p>
          </div>
        </div>

        {/* Delivery days pill */}
        <div className="flex flex-wrap gap-3 mb-12 sm:mb-16">
          {[
            { label: "Delivery: Wed & Sat only" },
            { label: "Orders via WhatsApp" },
            { label: "UPI payment · 2hr window" },
            { label: "Bake to order — no advance stock" },
          ].map(({ label }) => (
            <span key={label} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-brand-charcoal/8 text-[10px] sm:text-xs md:text-sm font-black tracking-[0.12em] uppercase text-brand-charcoal/60 shadow-sm">
              {label}
            </span>
          ))}
        </div>

        {/* ── 6-step flow ── */}
        <div className="hiw-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-16 sm:mb-24">
          {steps.map((step, i) => (
            <div
              key={i}
              className="hiw-step group bg-white rounded-[2rem] p-6 sm:p-7 border border-brand-charcoal/5 shadow-sm hover:shadow-xl hover:border-brand-terracotta/20 transition-all duration-500 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-brand-terracotta">{step.number}</span>
                <span className="text-[9px] sm:text-xs font-black tracking-[0.12em] uppercase text-brand-charcoal/40 bg-brand-charcoal/5 px-3 sm:px-4 py-1.5 rounded-full">
                  {step.tag}
                </span>
              </div>
              <div className="w-12 h-1 bg-brand-charcoal/10 group-hover:bg-brand-terracotta group-hover:w-20 transition-all duration-500 rounded-full" />
              <div>
                <p className="text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-brand-charcoal/40 mb-2">{step.day}</p>
                <h3 className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight text-brand-charcoal leading-tight group-hover:text-brand-terracotta transition-colors duration-300">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm sm:text-base font-bold text-brand-charcoal/50 leading-relaxed flex-1">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Product lead times ── */}
        <div className="mb-16 sm:mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-px bg-brand-terracotta" />
            <span className="text-sm sm:text-base md:text-lg font-bold tracking-[0.2em] uppercase text-brand-terracotta">
              Lead Times by Product
            </span>
          </div>
          <div className="hiw-leads bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm overflow-hidden">
            {deliveryRules.map((row, i) => (
              <div key={i} className="hiw-lead-row flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 px-6 sm:px-8 py-4 sm:py-5 border-b border-brand-charcoal/5 last:border-0 hover:bg-brand-oat/40 transition-colors duration-200">
                <span className="font-black text-sm sm:text-base md:text-lg text-brand-charcoal sm:w-1/3">{row.product}</span>
                <span className="font-black text-brand-terracotta text-sm sm:text-base md:text-lg sm:w-1/6">{row.lead}</span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-brand-charcoal/50 sm:flex-1">{row.notes}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-brand-charcoal/30 mt-4 italic text-center">
            Mixed carts with different lead times are offered as split delivery or combined on the later date.
          </p>
        </div>

        {/* ── FAQ ── */}
        <div className="mb-16 sm:mb-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="lg:w-72 shrink-0">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-8 h-px bg-brand-terracotta" />
                <span className="text-sm sm:text-base md:text-lg font-bold tracking-[0.2em] uppercase text-brand-terracotta">Common Questions</span>
              </div>
              <h3
                className="font-black text-brand-charcoal tracking-tighter leading-[0.9]"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              >
                WHY WWY<br />
                <span className="text-brand-terracotta">WORKS THIS WAY.</span>
              </h3>
              <p className="text-sm sm:text-base font-bold text-brand-charcoal/50 leading-relaxed mt-4 max-w-xs">
                Our constraints are our credibility. Order windows, fixed delivery days, and a 2-hour payment window are not inconveniences — they are how fresh food without preservatives works.
              </p>
            </div>
            <div className="flex-1 bg-white rounded-[2rem] px-6 sm:px-8 border border-brand-charcoal/5 shadow-sm">
              {faqs.map((item, i) => (
                <Faq key={i} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-brand-charcoal/5 pt-10">
          <div className="flex flex-col gap-1">
            <p className="font-black text-brand-charcoal/50 text-sm sm:text-base tracking-tight max-w-lg leading-relaxed text-center sm:text-left">
              "You don't buy our food off a shelf.{" "}
              <span className="text-brand-charcoal">You set it in motion.</span>"
            </p>
            <p className="font-bold text-brand-charcoal/25 text-xs tracking-tight text-center sm:text-left italic">
              Food that is still becoming.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {["No preservatives", "Veg only", "Small batch", "Fixed delivery days"].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full border border-brand-charcoal/10 text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/40">
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
