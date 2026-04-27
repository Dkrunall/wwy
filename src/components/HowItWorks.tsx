"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "You order.",
    body: "Nothing exists before this point. Every loaf, every bottle begins the moment you place an order. There is no shelf. No display stock. No excess.",
  },
  {
    number: "02",
    title: "We plan.",
    body: "Orders are grouped by delivery cycle. Quantities are fixed. No buffers, no overproduction. What is made has a destination.",
  },
  {
    number: "03",
    title: "Fermentation does the work.",
    body: "Time, microbes, and high-quality ingredients — no preservatives, additives, stabilisers, or chemicals. The process builds flavour, structure, and natural stability.",
  },
  {
    number: "04",
    title: "Delivered fresh on fixed days.",
    body: "Fixed delivery days allow food to develop naturally and reach you at the right moment. Shelf life is protected by timing, not formulation.",
  },
  {
    number: "05",
    title: "Zero waste by design.",
    body: "No clearance. No end-of-day markdowns. No food made to sit idle. WWY replaces inventory with intention.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hiw-step",
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: "power2.out",
          scrollTrigger: { trigger: ".hiw-container", start: "top 80%" },
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <p className="font-black text-brand-charcoal/[0.025] tracking-tighter whitespace-nowrap"
          style={{ fontSize: "clamp(5rem, 18vw, 18rem)" }}>
          PROCESS
        </p>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 sm:mb-20">
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-4 block">
              How Ordering Works
            </span>
            <h2
              className="font-black text-brand-charcoal tracking-tighter leading-[0.88]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              MADE FOR SOMEONE,<br />
              <span className="text-brand-terracotta">NOT EVERYONE.</span>
            </h2>
          </div>
          <p className="text-sm font-bold text-brand-charcoal/40 max-w-sm leading-relaxed lg:pb-2">
            We work a little differently. Everything at WWY is made to order — nothing is baked or brewed in advance.
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-16 sm:mb-20">
          {steps.map((step, i) => (
            <div
              key={i}
              className="hiw-step group bg-white rounded-[2rem] p-6 sm:p-7 border border-brand-charcoal/5 shadow-sm hover:shadow-xl hover:border-brand-terracotta/20 transition-all duration-500 flex flex-col gap-4"
            >
              <span className="font-black text-[10px] tracking-[0.3em] text-brand-terracotta">{step.number}</span>
              <div className="w-8 h-px bg-brand-charcoal/10 group-hover:bg-brand-terracotta group-hover:w-14 transition-all duration-500" />
              <h3 className="font-black text-base sm:text-lg tracking-tight text-brand-charcoal leading-tight group-hover:text-brand-terracotta transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-xs font-bold text-brand-charcoal/40 leading-relaxed flex-1">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-brand-charcoal/5 pt-10">
          <p className="font-black text-brand-charcoal/50 text-sm sm:text-base tracking-tight max-w-lg leading-relaxed text-center sm:text-left">
            "You don't buy our food off a shelf.{" "}
            <span className="text-brand-charcoal">You set it in motion.</span>"
          </p>
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
