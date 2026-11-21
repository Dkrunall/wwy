"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { deliveryDaysShort } from "@/lib/schedule";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    day: "Browse",
    title: "Browse the current menu.",
    body: "Check what's available for the upcoming window. Every item is baked to order for a Wednesday or Saturday delivery.",
    tag: "wildwildyeast.com",
  },
  {
    number: "02",
    day: "Order",
    title: "Order right on our website.",
    body: "Add what you want to your cart and pay securely online by card, UPI or netbanking. Your order is confirmed instantly, no waiting on a reply.",
    tag: "Secure checkout",
  },
  {
    number: "03",
    day: "Receive",
    title: "Receive on Wednesday or Saturday.",
    body: "Your order is made fresh and delivered on your chosen window day. Not before. Not after. The schedule is the schedule.",
    tag: "Wed · Sat delivery",
  },
];


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
    }, sectionRef);
    return () => ctx.revert();
  }, []);
 
  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="w-full bg-brand-oat py-20 sm:py-32 px-4 sm:px-8 xl:px-16 relative overflow-hidden z-20"
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <p className="font-black text-brand-brown/[0.025] tracking-tighter whitespace-nowrap"
          style={{ fontSize: "clamp(5rem, 18vw, 18rem)" }}>
          ORDER
        </p>
      </div>
 
      <div className="mx-auto max-w-7xl relative z-10">
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
              Add to your cart, pay securely online, done. We plan every batch from confirmed orders, so we bake to order and deliver on fixed days.
            </p>
            <p className="text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-brand-brown/60 italic">
              We don't rush food. We plan for it.
            </p>
          </div>
        </div>
 
        {/* Delivery days pill */}
        <div className="flex flex-wrap gap-3 mb-12 sm:mb-16">
          {[
            { label: `Delivery: ${deliveryDaysShort()} only` },
            { label: "Order online, pay by card / UPI / netbanking" },
            { label: "Free delivery over ₹300" },
            { label: "Baked to order, no advance stock" },
          ].map(({ label }) => (
            <span key={label} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-brand-brown/8 text-[11px] sm:text-xs md:text-sm font-black tracking-[0.12em] uppercase text-brand-brown/60 shadow-sm">
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
                <span className="text-[11px] sm:text-xs font-black tracking-[0.12em] uppercase text-brand-brown/60 bg-brand-brown/5 px-3 sm:px-4 py-1.5 rounded-full">
                  {step.tag}
                </span>
              </div>
              <div className="w-12 h-1 bg-brand-brown/10 group-hover:bg-brand-orange group-hover:w-20 transition-all duration-500 rounded-full" />
              <div>
                <p className="text-[11px] sm:text-xs font-black tracking-[0.15em] uppercase text-brand-brown/60 mb-2">{step.day}</p>
                <h3 className="font-serif font-normal text-xl sm:text-2xl md:text-3xl tracking-tight text-brand-brown leading-tight group-hover:text-brand-orange transition-colors duration-300">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm sm:text-base font-bold text-brand-brown/65 leading-relaxed flex-1">
                {step.body}
              </p>
            </div>
          ))}
        </div>
 
        <p className="mb-12 sm:mb-16 text-sm sm:text-base font-bold text-brand-brown/75">
          More questions? <Link href="/faq" className="text-brand-orange underline">Read our FAQs</Link>.
        </p>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-brand-brown/5 pt-10">
          <div className="flex flex-col gap-1">
            <p className="font-black text-brand-brown/65 text-sm sm:text-base tracking-tight max-w-lg leading-relaxed text-center sm:text-left">
              "You don't buy our food off a shelf.{" "}
              <span className="text-brand-brown">You set it in motion.</span>"
            </p>
            <p className="font-bold text-brand-brown/55 text-xs tracking-tight text-center sm:text-left italic">
              Food that is still becoming.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {["No preservatives", "Veg only", "Small batch", "Fixed delivery days"].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full border border-brand-brown/10 text-[11px] font-black tracking-[0.15em] uppercase text-brand-brown/60">
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
