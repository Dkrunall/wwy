"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

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
    title: "Small Batch. Intentional.",
    body: "Wild Wild Yeast launched publicly. No investors. No shortcuts. Every batch made to order, in small quantities, with honest ingredients.",
  },
];

const principles = [
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

const objections = [
  {
    q: "Why can't I get it today?",
    a: "Fermented food takes time to develop properly. Once you order, we plan and begin fermentation specifically for your batch. A short wait — but the food reaches you fresh and naturally made.",
  },
  {
    q: "Why does it look different each time?",
    a: "Our bread is naturally fermented without stabilisers or dough conditioners. Small differences in crust, crumb, and flavour are part of natural fermentation. The character stays consistent. Each batch develops in its own way.",
  },
  {
    q: "Why only fixed delivery days?",
    a: "Fermentation works on a timeline. Fixed delivery days allow us to bake and brew at the right moment — so food reaches you fresh rather than sitting on shelves.",
  },
  {
    q: "Is variation a quality issue?",
    a: "No. In fermented food, controlled variation is a sign of life, not inconsistency. The goal is recognisability, not sameness.",
  },
  {
    q: "Why is it priced higher than store bread?",
    a: "Because it isn't store bread. There is no preservative masking age, no volume discount built on overproduction. You are paying for time — specifically, the time taken to ferment properly, using ingredients that don't need correction.",
  },
  {
    q: "The shelf life is only 2–3 days. Is that normal?",
    a: "Yes. And it's deliberate. A shelf life of 2–3 days means the food is real — not stabilised, not preserved, not treated to last longer than it should. Natural fermentation gives it more stability than unfermented bread, but it is still living food. Treat it accordingly.",
  },
  {
    q: "Is fermented food safe to eat?",
    a: "Yes. Natural fermentation is one of the oldest food preservation techniques in the world. The acidic environment created during fermentation is inhospitable to harmful bacteria. Our process is controlled, consistent, and free from additives or shortcuts.",
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
      gsap.fromTo(".principle-card",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: "back.out(1.2)",
          scrollTrigger: { trigger: ".principles-container", start: "top 80%" } }
      );
      gsap.fromTo(".objection-item",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: ".objections-container", start: "top 80%" } }
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <h2 className="font-black text-white/[0.03] tracking-tighter whitespace-nowrap"
            style={{ fontSize: "clamp(8rem, 22vw, 22rem)", lineHeight: 0.85 }}>STORY</h2>
        </div>

        <div className="relative z-10 max-w-4xl">
          <span className="story-hero-text text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            Our Story
          </span>
          <h1 className="story-hero-text font-black text-brand-oat tracking-tighter leading-[0.85] mb-4"
            style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}>
            WILD BY NATURE.<br />
            <span className="text-brand-terracotta">CRAFTED BY TIME.</span>
          </h1>
          <p className="story-hero-text text-base sm:text-xl font-bold text-brand-oat/50 max-w-xl leading-relaxed">
            A fermentation studio built on waiting. Nothing made in advance. Everything alive when it reaches you.
          </p>
        </div>
      </section>

      {/* ── About ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-3xl mx-auto">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            What WWY Is
          </span>
          <p className="font-black text-brand-charcoal leading-[1.05] tracking-tight mb-10"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>
            An online, bake-to-order studio focused entirely on fermented food. Bread and naturally fermented beverages — using time, microbes, and high-quality ingredients. Without preservatives, additives, stabilisers, or chemical shortcuts.
          </p>
          <div className="flex flex-col gap-5 text-sm sm:text-base font-bold text-brand-charcoal/50 leading-relaxed border-t border-brand-charcoal/5 pt-8">
            <p>Everything we produce begins with an order. There is no advance baking, no inventory, no waste built into the system. Fermentation doesn't suit shelves — so we work with timelines instead.</p>
            <p>Our ingredients are simple and recognisable. Their quality matters because there is nothing in the process designed to correct, mask, or artificially extend shelf life.</p>
            <p className="text-brand-charcoal font-black">The food we make is alive, fresh, and imperfect by nature. Variation is expected. Waiting is part of the experience.</p>
          </div>

          {/* Brand personality */}
          <div className="flex flex-wrap gap-3 mt-10 pt-8 border-t border-brand-charcoal/5">
            {["Wild, but credible", "Craft, but approachable", "Premium, but not stiff", "Fermentation-led, but flavour-first"].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full border border-brand-charcoal/10 text-[10px] font-black tracking-[0.12em] uppercase text-brand-charcoal/40">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Manifesto ── */}
      <section className="w-full bg-brand-charcoal px-4 sm:px-8 xl:px-16 py-24 sm:py-44 relative overflow-hidden">
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />

        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/8 blur-[180px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-terracotta/8 blur-[160px] rounded-full pointer-events-none" />

        {/* Background watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-serif italic font-medium text-white/[0.025] whitespace-nowrap leading-none"
            style={{ fontSize: "clamp(8rem, 25vw, 28rem)" }}>
            BELIEVE
          </span>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">

          {/* Badge */}
          <div className="flex items-center gap-4 mb-24 sm:mb-32 justify-center">
            <div className="w-8 h-px bg-brand-terracotta" />
            <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase">
              The Manifesto
            </span>
            <div className="w-8 h-px bg-brand-terracotta" />
          </div>

          <div className="grid grid-cols-1 gap-24 sm:gap-40">
            {/* Block 1 */}
            <div className="flex flex-col md:flex-row gap-10 md:gap-20 items-start md:items-center">
              <div className="md:w-3/5">
                <h2
                  className="font-serif italic font-medium text-brand-oat leading-[0.85] mb-6"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
                >
                  We believe food<br />should take time.
                </h2>
              </div>
              <div className="md:w-2/5 border-l-2 border-brand-terracotta/40 pl-6 sm:pl-8">
                <p className="text-brand-oat/50 font-bold text-sm sm:text-base md:text-lg leading-relaxed">
                  Not because it is fashionable —<br />but because it always has.
                </p>
              </div>
            </div>

            {/* Block 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-10 md:gap-20 items-start md:items-center">
              <div className="md:w-3/5 md:text-right">
                <h2
                  className="font-serif italic font-medium text-brand-oat leading-[0.85] mb-6"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
                >
                  We don't aim for perfection.<br />
                  <span className="text-brand-gold">We aim for honesty.</span>
                </h2>
              </div>
              <div className="md:w-2/5 border-r-2 border-white/[0.08] pr-6 sm:pr-8 md:text-right">
                <p className="text-brand-oat/40 font-bold text-sm sm:text-base md:text-lg leading-relaxed">
                  We work with processes that cannot be rushed — dough that needs resting, flavours that change quietly, drinks that continue to live after they leave us.
                </p>
              </div>
            </div>

            {/* Block 3 */}
            <div className="flex flex-col md:flex-row gap-10 md:gap-20 items-start md:items-center">
              <div className="md:w-3/5">
                <h2
                  className="font-serif italic font-medium text-brand-oat leading-[0.85] mb-6"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
                >
                  We don't explain fermentation.<br />
                  <span className="text-brand-terracotta">We let you experience it.</span>
                </h2>
              </div>
              <div className="md:w-2/5 border-l-2 border-white/[0.08] pl-6 sm:pl-8">
                <p className="text-brand-oat/40 font-bold text-sm sm:text-base md:text-lg leading-relaxed">
                  Some days the loaf is different. Some days the bubbles are louder. That's not inconsistency — that's life.
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="mt-32 sm:mt-48 pt-16 border-t border-white/[0.05] text-center">
            <p className="text-brand-oat/30 font-bold text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              WWY exists for people who are comfortable with waiting,<br className="hidden sm:block" />
              curious about change,<br className="hidden sm:block" />
              and willing to trust the process.
            </p>
          </div>

        </div>
      </section>

      {/* ── Split Image ── */}
      <section className="w-full bg-white px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-24 items-center max-w-7xl mx-auto">
          <div className="w-full lg:w-1/2 flex gap-4 h-[75vw] sm:h-[500px] min-h-[240px] max-h-[600px]">
            <div className="w-1/2 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl mt-6 sm:mt-8">
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
            <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              The Operating System
            </span>
            <h2 className="font-black text-brand-charcoal tracking-tight leading-none mb-8"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
              FERMENTATION ISN'T A FEATURE.<br className="hidden sm:block" />
              <span className="text-brand-terracotta">IT'S THE FOUNDATION.</span>
            </h2>
            <div className="flex flex-col gap-5 text-brand-charcoal/60 font-bold text-sm sm:text-base md:text-lg leading-relaxed">
              <p>WWY is not a bakery that happens to ferment. Not a beverage label using the word craft casually. Fermentation is the organising principle — bread, beverages, and flavour development all rely on time, microbes, and natural transformation.</p>
              <p>Because fermented food is alive, it cannot be treated like inventory. We produce only against orders, using whole ingredients that don't need correction or concealment.</p>
              <p>Veg only. No onion. No garlic. No compromise on flavour.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="w-full bg-brand-charcoal px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            How We Got Here
          </span>
          <h2 className="font-black text-brand-oat tracking-tight leading-none mb-16 sm:mb-20"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            THE CULTURE <br className="hidden sm:block" /><span className="text-brand-gold">EVOLVES.</span>
          </h2>

          <div className="timeline-container flex flex-col gap-0">
            {timeline.map((item, i) => (
              <div key={i} className="timeline-item flex gap-6 sm:gap-12 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-brand-terracotta/20 border border-brand-terracotta/30 flex items-center justify-center shrink-0 group-hover:bg-brand-terracotta transition-colors duration-300">
                    <span className="font-black text-[9px] tracking-widest text-brand-terracotta group-hover:text-white transition-colors">{item.year}</span>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-brand-oat/10 mt-3 mb-3" />
                  )}
                </div>
                <div className="pb-12 flex-1">
                  <h3 className="font-black text-lg sm:text-xl tracking-[0.05em] uppercase text-brand-oat mb-2">{item.title}</h3>
                  <p className="text-brand-oat/50 font-bold text-sm sm:text-base md:text-lg leading-relaxed max-w-lg">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center">
            What We Stand For
          </span>
          <h2 className="font-black text-brand-charcoal tracking-tight leading-none mb-16 text-center"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            FOUR <span className="text-brand-terracotta">PRINCIPLES.</span>
          </h2>
          <div className="principles-container grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {principles.map((v, i) => (
              <div key={i} className="principle-card bg-white rounded-[2rem] p-8 sm:p-10 border border-brand-charcoal/5 shadow-sm hover:shadow-xl transition-shadow duration-500 group">
                <span className="font-black text-3xl sm:text-4xl tracking-[0.2em] text-brand-terracotta mb-4 block">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-black text-2xl sm:text-3xl tracking-tight text-brand-charcoal mb-4 group-hover:text-brand-terracotta transition-colors duration-300">{v.label}</h3>
                <p className="text-sm sm:text-base md:text-lg font-bold text-brand-charcoal/50 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Constraints as Credibility ── */}
      <section className="w-full bg-white px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            Common Questions
          </span>
          <h2 className="font-black text-brand-charcoal tracking-tight leading-none mb-4"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            OUR CONSTRAINTS ARE<br className="hidden sm:block" />
            <span className="text-brand-terracotta">OUR CREDIBILITY.</span>
          </h2>
          <p className="text-sm font-bold text-brand-charcoal/40 max-w-xl leading-relaxed mb-14 sm:mb-16">
            Most brands apologise for limitations. We don't. Order windows, fixed delivery days, natural variation — these aren't flaws. They're what makes the food real.
          </p>

          <div className="objections-container grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {objections.map((item, i) => (
              <div key={i} className="objection-item bg-brand-oat rounded-[2rem] p-7 sm:p-8 border border-brand-charcoal/5 group hover:bg-brand-charcoal transition-all duration-500">
                <p className="font-black text-base sm:text-lg md:text-xl tracking-tight text-brand-charcoal group-hover:text-brand-gold mb-4 transition-colors duration-300">
                  "{item.q}"
                </p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-brand-charcoal/50 group-hover:text-brand-oat/60 leading-relaxed transition-colors duration-300">
                  {item.a}
                </p>
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
          <h2 className="font-black text-white tracking-tighter leading-[0.88] mb-4"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}>
            YOU SET IT<br />IN MOTION.
          </h2>
          <p className="text-white/70 font-bold text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Every provision is made to order. Slow-fermented. Nothing added that doesn't belong.
          </p>
          <Link href="/shop"
            className="inline-block bg-white text-brand-terracotta hover:bg-brand-charcoal hover:text-white px-12 py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl transition-all duration-300 active:scale-95">
            Shop the Range
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
