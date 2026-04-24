"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

gsap.registerPlugin(ScrollTrigger);

const timeline = [
  {
    year: "2019",
    title: "The First Culture",
    body: "It started with a single jar of flour and water left on a windowsill in Bandra. Three days later, something was alive inside it.",
  },
  {
    year: "2021",
    title: "Going Wild",
    body: "What began as a personal obsession became a small operation. Starters were shared with neighbours, then strangers, then strangers' strangers.",
  },
  {
    year: "2023",
    title: "The Soda Experiments",
    body: "The same wild yeast that leavened bread began fermenting botanicals. Hibiscus. Ginger. Green cardamom. Each batch different from the last.",
  },
  {
    year: "2024",
    title: "Small Batch, Intentional",
    body: "Wild Wild Yeast launched publicly. No investors. No shortcuts. Every batch made slowly, in small quantities, with honest ingredients.",
  },
];

const values = [
  {
    label: "Time",
    body: "Fermentation cannot be rushed. Every product we make is given the hours and days it needs — nothing less.",
  },
  {
    label: "Honesty",
    body: "What goes in is exactly what's on the label. Honest ingredients. No fillers. No compromises.",
  },
  {
    label: "Process",
    body: "The method is the product. Wild fermentation is layered, unpredictable, and alive — and that's precisely the point.",
  },
  {
    label: "Character",
    body: "Every batch carries the character of its season, its source, and its culture. No two are identical. That's not a flaw.",
  },
];

export default function StoryPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".story-hero-text",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 1.2, ease: "back.out(1.2)", delay: 0.1 }
      );
      gsap.fromTo(".timeline-item",
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.15, duration: 1, ease: "power2.out",
          scrollTrigger: { trigger: ".timeline-container", start: "top 80%" } }
      );
      gsap.fromTo(".value-card",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: "back.out(1.2)",
          scrollTrigger: { trigger: ".values-container", start: "top 80%" } }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-brand-oat" ref={heroRef}>
      <Navbar />
      <CartDrawer />

      {/* ── Hero ── */}
      <section className="w-full bg-brand-charcoal relative overflow-hidden min-h-[90vh] flex items-end pb-16 sm:pb-24 px-4 sm:px-8 xl:px-16 pt-36">
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-brand-terracotta/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-gold/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <h2 className="font-black text-white/[0.03] tracking-tighter whitespace-nowrap"
            style={{ fontSize: "clamp(8rem, 22vw, 22rem)", lineHeight: 0.85 }}>
            STORY
          </h2>
        </div>

        <div className="relative z-10 max-w-4xl">
          <span className="story-hero-text text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-6 block">
            Our Story
          </span>
          <h1
            className="story-hero-text font-black text-brand-oat tracking-tighter leading-[0.85] mb-8"
            style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}
          >
            MADE WITH <br />
            <span className="text-brand-terracotta">TIME.</span>
          </h1>
          <p className="story-hero-text text-base sm:text-xl font-bold text-brand-oat/50 max-w-xl leading-relaxed">
            Wild Wild Yeast began with a jar, a windowsill, and the patience to let something living take shape on its own terms.
          </p>
        </div>
      </section>

      {/* ── Opening Statement ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-black text-brand-charcoal leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
            "TIME IS OUR{" "}
            <span className="text-brand-terracotta">ONLY ADDITIVE.</span>"
          </p>
          <p className="mt-8 text-base sm:text-lg font-bold text-brand-charcoal/50 leading-relaxed max-w-xl mx-auto">
            No shortcuts. No lab-made cultures. No artificial sweeteners. Wild fermentation moves at its own pace — and we follow its lead.
          </p>
        </div>
      </section>

      {/* ── Split Image + Text ── */}
      <section className="w-full bg-white px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-24 items-center max-w-7xl mx-auto">
          <div className="w-full lg:w-1/2 flex gap-4 h-[60vw] sm:h-[500px] max-h-[600px]">
            <div className="w-1/2 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl mt-8">
              <div className="relative w-full h-full">
                <Image src="/f1.png" alt="Process" fill className="object-cover" />
              </div>
            </div>
            <div className="w-1/2 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="relative w-full h-full">
                <Image src="/f2.png" alt="Ingredients" fill className="object-cover" />
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-5 block">
              The Philosophy
            </span>
            <h2 className="font-black text-brand-charcoal tracking-tighter leading-[0.88] mb-8"
              style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)" }}>
              ROOTED IN <br /> PROCESS.
            </h2>
            <div className="flex flex-col gap-5 text-brand-charcoal/60 font-bold text-sm sm:text-base leading-relaxed">
              <p>Wild fermentation is not a technique. It's an environment — one where living organisms convert raw ingredients into something layered, expressive, and full of character.</p>
              <p>Everything we make is built on that foundation. From botanical sodas to naturally leavened starters, each product carries the depth of its process. Slow. Honest. Alive.</p>
              <p>We source from local farms. We use century-old cultures. We let time do the work it's always done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="w-full bg-brand-charcoal px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-5 block">
            How We Got Here
          </span>
          <h2 className="font-black text-brand-oat tracking-tighter leading-[0.88] mb-16 sm:mb-20"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            THE CULTURE <br /><span className="text-brand-gold">EVOLVES.</span>
          </h2>

          <div className="timeline-container flex flex-col gap-0">
            {timeline.map((item, i) => (
              <div key={i} className="timeline-item flex gap-6 sm:gap-12 group">
                {/* Year + line */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-brand-terracotta/20 border border-brand-terracotta/30 flex items-center justify-center shrink-0 group-hover:bg-brand-terracotta transition-colors duration-300">
                    <span className="font-black text-[9px] tracking-widest text-brand-terracotta group-hover:text-white transition-colors">{item.year}</span>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-brand-oat/10 mt-3 mb-3" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-12 flex-1">
                  <h3 className="font-black text-base sm:text-lg tracking-[0.05em] uppercase text-brand-oat mb-2">{item.title}</h3>
                  <p className="text-brand-oat/50 font-bold text-sm leading-relaxed max-w-lg">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-5 block text-center">
            What We Stand For
          </span>
          <h2 className="font-black text-brand-charcoal tracking-tighter leading-[0.88] mb-16 text-center"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            THE FOUR <span className="text-brand-terracotta">PRINCIPLES.</span>
          </h2>
          <div className="values-container grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((v, i) => (
              <div key={i} className="value-card bg-white rounded-[2rem] p-8 sm:p-10 border border-brand-charcoal/5 shadow-sm hover:shadow-xl transition-shadow duration-500 group">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-4 block">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-black text-2xl sm:text-3xl tracking-tight text-brand-charcoal mb-4 group-hover:text-brand-terracotta transition-colors duration-300">{v.label}</h3>
                <p className="text-brand-charcoal/50 font-bold text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full bg-brand-terracotta px-4 sm:px-8 xl:px-16 py-20 sm:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <h2 className="font-black text-white tracking-tighter leading-[0.88] mb-6"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}>
            TASTE THE <br /> PROCESS.
          </h2>
          <p className="text-white/70 font-bold text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Every provision we make is slow-fermented, small batch, and built on honest ingredients.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-white text-brand-terracotta hover:bg-brand-charcoal hover:text-white px-12 py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl transition-all duration-300 active:scale-95"
          >
            Shop the Range
          </Link>
        </div>
      </section>

    </main>
  );
}
