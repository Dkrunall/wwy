"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    day: "Browse",
    title: "Browse the current menu.",
    body: "Check what's available for the upcoming window. Some products need more lead time — croissants need 48 hours — so check each item before ordering.",
    tag: "wildwildyeast.com",
  },
  {
    number: "02",
    day: "Order",
    title: "Order right on our website.",
    body: "Add what you want to your cart and check out securely with Razorpay — card, UPI, or netbanking. Your order is confirmed instantly, no waiting on a reply.",
    tag: "Razorpay checkout",
  },
  {
    number: "03",
    day: "Receive",
    title: "Receive on Wednesday or Saturday.",
    body: "Your order is made fresh and delivered on your chosen window day. Not before. Not after. The schedule is the schedule.",
    tag: "Wed · Sat delivery",
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
    q: "Why can I only order before the weekly cutoff?",
    a: "We don't keep stock. Every batch is planned from confirmed, paid orders. The cutoff tells us exactly what to make for that window — closing it is how we avoid waste, overproduction, and preservatives.",
  },
  {
    q: "Why only Wednesday and Saturday delivery?",
    a: "Fermentation works on a timeline. Fixed delivery days let us bake and brew at the right moment so food arrives fresh. As we grow, we'll add more days.",
  },
  {
    q: "What if my payment doesn't go through?",
    a: "Your order stays pending — nothing is made against it. You can retry checkout from your order history, or place a fresh order. We only start production once payment is confirmed.",
  },
  {
    q: "Can I order as a new customer?",
    a: "Yes. First time, we'll ask for your name, delivery address, and pincode — we check it against our current delivery area before you can place the order. Every order after that is faster.",
  },
  {
    q: "Why does the bread look different batch to batch?",
    a: "Wild fermentation responds to temperature, humidity, and the health of the starter on any given day. A Mumbai June batch and a December batch will taste different. That variation isn't a defect — it's evidence that the fermentation is real.",
  },
  {
    q: "How should I store my sourdough?",
    a: "Keep it cut-side down on a board, wrapped in a cotton cloth or bread bag — not plastic. It'll stay good for a couple of days at room temperature. Slice and freeze what you won't eat in that time; it toasts straight from frozen.",
  },
  {
    q: "Can I order for a specific event or larger quantity?",
    a: "Reach out to us directly and we'll work out what's possible. Larger orders need more lead time — we'll be upfront if something isn't doable by your date.",
  },
  {
    q: "Where in Mumbai do you deliver?",
    a: "Enter your pincode at checkout and we'll tell you instantly if we deliver to your area. Delivery zones expand as we grow.",
  },
];

function Faq({ item }: { item: typeof faqs[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-brand-brown/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="font-serif font-normal text-lg sm:text-xl md:text-2xl tracking-tight text-brand-brown group-hover:text-brand-orange transition-colors duration-300 leading-snug">
          {item.q}
        </span>
        <ChevronDown
          size={15}
          className={`text-brand-brown/30 shrink-0 mt-0.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${open ? "max-h-48 pb-5" : "max-h-0"}`}>
        <p className="text-xs sm:text-sm md:text-base font-bold text-brand-brown/60 leading-relaxed">{item.a}</p>
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
        <p className="font-black text-brand-brown/[0.025] tracking-tighter whitespace-nowrap"
          style={{ fontSize: "clamp(5rem, 18vw, 18rem)" }}>
          ORDER
        </p>
      </div>
 
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14 sm:mb-20">
          <div>
            <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              How Ordering Works
            </span>
            <h2
              className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]"
              style={{ fontSize: "clamp(2.5rem, 7.5vw, 5.2rem)" }}
            >
              Made to order.<br className="hidden sm:block" />
              <span className="text-brand-orange italic font-light">Right on our website.</span>
            </h2>
          </div>
          <div className="max-w-sm lg:pb-2 flex flex-col gap-2">
            <p className="text-sm sm:text-base md:text-lg font-bold text-brand-brown/60 leading-relaxed">
              Add to cart, check out with Razorpay, done. We plan batches from confirmed, paid orders — bake and brew to order, and deliver on fixed days.
            </p>
            <p className="text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-brand-brown/40 italic">
              We don't rush food. We plan for it.
            </p>
          </div>
        </div>
 
        {/* Delivery days pill */}
        <div className="flex flex-wrap gap-3 mb-12 sm:mb-16">
          {[
            { label: "Delivery: Wed & Sat only" },
            { label: "Order online, pay by card / UPI / netbanking" },
            { label: "Free shipping over ₹599 · ₹65 below" },
            { label: "Bake to order — no advance stock" },
          ].map(({ label }) => (
            <span key={label} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-brand-brown/8 text-[10px] sm:text-xs md:text-sm font-black tracking-[0.12em] uppercase text-brand-brown/60 shadow-sm">
              {label}
            </span>
          ))}
        </div>
 
        {/* ── 3-step flow ── */}
        <div className="hiw-grid grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-16 sm:mb-24">
          {steps.map((step, i) => (
            <div
              key={i}
              className="hiw-step group bg-white rounded-[2rem] p-6 sm:p-7 border border-brand-brown/5 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all duration-500 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-light text-2xl sm:text-3xl md:text-4xl tracking-tight text-brand-orange">{step.number}</span>
                <span className="text-[9px] sm:text-xs font-black tracking-[0.12em] uppercase text-brand-brown/40 bg-brand-brown/5 px-3 sm:px-4 py-1.5 rounded-full">
                  {step.tag}
                </span>
              </div>
              <div className="w-12 h-1 bg-brand-brown/10 group-hover:bg-brand-orange group-hover:w-20 transition-all duration-500 rounded-full" />
              <div>
                <p className="text-[10px] sm:text-xs font-black tracking-[0.15em] uppercase text-brand-brown/40 mb-2">{step.day}</p>
                <h3 className="font-serif font-normal text-xl sm:text-2xl md:text-3xl tracking-tight text-brand-brown leading-tight group-hover:text-brand-orange transition-colors duration-300">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm sm:text-base font-bold text-brand-brown/50 leading-relaxed flex-1">
                {step.body}
              </p>
            </div>
          ))}
        </div>
 
        {/* ── Product lead times ── */}
        <div className="mb-16 sm:mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-px bg-brand-orange" />
            <span className="text-sm sm:text-base md:text-lg font-bold tracking-[0.2em] uppercase text-brand-orange">
              Lead Times by Product
            </span>
          </div>
          <div className="hiw-leads bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-brand-brown/5 shadow-sm overflow-hidden">
            {deliveryRules.map((row, i) => (
              <div key={i} className="hiw-lead-row flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 px-6 sm:px-10 py-5 border-b border-brand-brown/5 last:border-0 hover:bg-brand-orange/5 transition-all duration-300">
                <span className="font-serif font-normal text-base sm:text-lg md:text-xl text-brand-brown sm:w-1/3">{row.product}</span>
                <span className="font-serif italic font-light text-brand-orange text-sm sm:text-base md:text-lg sm:w-1/6">{row.lead}</span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-brand-brown/40 sm:flex-1">{row.notes}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-brand-brown/30 mt-4 italic text-center">
            Mixed carts with different lead times are offered as split delivery or combined on the later date.
          </p>
        </div>
 
        {/* ── FAQ ── */}
        <div className="mb-16 sm:mb-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="lg:w-72 shrink-0">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-8 h-px bg-brand-orange" />
                <span className="text-sm sm:text-base md:text-lg font-bold tracking-[0.2em] uppercase text-brand-orange">Common Questions</span>
              </div>
              <h3
                className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Why WWY<br />
                <span className="text-brand-orange italic font-light">works this way.</span>
              </h3>
              <p className="text-sm sm:text-base font-bold text-brand-brown/50 leading-relaxed mt-4 max-w-xs">
                Our constraints are our credibility. A weekly order cutoff and fixed delivery days are not inconveniences — they are how fresh food without preservatives works.
              </p>
            </div>
            <div className="flex-1 bg-white/80 backdrop-blur-md rounded-[2.5rem] px-6 sm:px-8 border border-brand-brown/5 shadow-sm">
              {faqs.map((item, i) => (
                <Faq key={i} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-brand-brown/5 pt-10">
          <div className="flex flex-col gap-1">
            <p className="font-black text-brand-brown/50 text-sm sm:text-base tracking-tight max-w-lg leading-relaxed text-center sm:text-left">
              "You don't buy our food off a shelf.{" "}
              <span className="text-brand-brown">You set it in motion.</span>"
            </p>
            <p className="font-bold text-brand-brown/25 text-xs tracking-tight text-center sm:text-left italic">
              Food that is still becoming.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {["No preservatives", "Veg only", "Small batch", "Fixed delivery days"].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full border border-brand-brown/10 text-[10px] font-black tracking-[0.15em] uppercase text-brand-brown/40">
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
