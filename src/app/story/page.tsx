"use client";
 
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
 
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
 
const howWeThink = [
  {
    label: "Time is the ingredient",
    body: "Not speed, not shortcuts. Dough that needs resting. Flavours that change quietly. Drinks that continue to live after they leave us.",
  },
  {
    label: "Honesty over claims",
    body: "Some days the loaf is different. Some days the bubbles are louder. That's not inconsistency — that's life.",
  },
  {
    label: "Made for someone",
    body: "Every loaf and every bottle is made with a recipient in mind. Not mass-produced. Not sitting idle. Not waiting to be sold.",
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
      gsap.fromTo(".think-card",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: "back.out(1.2)",
          scrollTrigger: { trigger: ".think-container", start: "top 80%" } }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);
 
  return (
    <main className="min-h-screen bg-brand-oat" ref={heroRef}>
      <Navbar />
      <CartDrawer />
 
      {/* ── CINEMATIC HERO ── */}
      <section className="w-full relative overflow-hidden min-h-[85vh] flex items-end pb-16 sm:pb-24 px-4 sm:px-8 xl:px-16 pt-36 bg-brand-brown">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/f1.png"
            alt="Wheat Field Sunset"
            fill
            className="object-cover opacity-[0.22] mix-blend-luminosity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-brown via-brand-brown/80 to-transparent"></div>
        </div>
        
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none z-0"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
 
        <div className="relative z-10 max-w-4xl">
          <span className="story-hero-text text-brand-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            Our Story
          </span>
          <h1 className="story-hero-text font-serif font-normal text-brand-oat tracking-tight leading-[1.05] mb-4"
            style={{ fontSize: "clamp(3.2rem, 10vw, 7.5rem)" }}>
            Wild by nature.<br />
            <span className="text-brand-gold italic font-light">Crafted by time.</span>
          </h1>
          <p className="story-hero-text text-base sm:text-lg md:text-xl font-bold text-brand-oat/60 max-w-xl leading-relaxed">
            A fermentation studio built on waiting. Nothing made in advance. Everything alive when it reaches you.
          </p>
        </div>
      </section>
 
      {/* ── EDITORIAL STATEMENT & NARRATIVE ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column: Big Statement */}
          <div className="w-full lg:w-5/12 flex flex-col justify-start">
            <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 block">
              About The Craft
            </span>
            <h2 className="font-serif font-normal text-brand-brown leading-[1.1] tracking-tight mb-6"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              What is in <br />
              <span className="italic text-brand-orange">your plate.</span>
            </h2>
            <p className="text-sm font-bold text-brand-brown/40 uppercase tracking-widest leading-relaxed mb-6">
              Wild Wild Yeast started in a home kitchen out of a pure obsession with the ancient alchemy of wild cultures.
            </p>
            
            {/* Tag pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {["Wild, but credible", "Craft, but approachable", "Premium, but not stiff", "Veg only"].map(tag => (
                <span key={tag} className="px-4.5 py-2 rounded-full border border-brand-brown/10 text-[9px] font-black tracking-[0.12em] uppercase text-brand-brown/40 bg-white/40">
                  {tag}
                </span>
              ))}
            </div>
          </div>
 
          {/* Right Column: Detailed Narrative */}
          <div className="w-full lg:w-7/12 flex flex-col gap-6 text-sm sm:text-base font-medium text-brand-brown/70 leading-relaxed lg:border-l lg:border-brand-brown/10 lg:pl-16">
            <p>The beauty of sourdough starts with a wild yeast. Don’t worry, it’s not a bad thing—in fact, wild yeast is present on nearly everything we see and touch, including your own hands.</p>
            <p>When combined with water, flour, and <strong>TIME</strong>, you are left with nature’s very own yeast pack: a wild yeast starter. This starter is fed daily to keep it alive and active. There is nothing artificial in this process and there are no shortcuts—no commercial yeast is ever added.</p>
            <p>From there, it’s a slow process. A 12–24 hour fermentation ensures that time does the work. Time is the actual catalyst: it builds the crumb structure you see when the loaf is cut and shapes the crust.</p>
            <p>Our focus is freshness, which is why we bake and brew only against a confirmed order. Nothing sits waiting, and no batch is made using stock production models. What is ordered at the cutoff is what goes into the oven or the ferment tank. Nothing ships until it is actually ready.</p>
            <p className="text-brand-brown font-serif italic text-lg sm:text-xl mt-4">Wild by nature. Crafted by time.</p>
          </div>
          
        </div>
 
        {/* Integrated Clean Split Images */}
        <div className="flex gap-4 sm:gap-6 h-[45vw] sm:h-[350px] md:h-[420px] mt-16 max-w-5xl mx-auto px-2">
          <div className="w-1/2 rounded-[2rem] overflow-hidden shadow-xl border border-brand-brown/5">
            <div className="relative w-full h-full">
              <Image src="/product_img/1-starter-top.jpg" alt="The wild starter, alive and bubbling" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
          <div className="w-1/2 rounded-[2rem] overflow-hidden shadow-xl border border-brand-brown/5 mt-6 sm:mt-10">
            <div className="relative w-full h-full">
              <Image src="/product_img/6-top-shot.jpg" alt="Fresh loaves, cooling before delivery" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>
 
      {/* ── TIMELINE ── */}
      <section className="w-full bg-brand-brown px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto">
          
          <span className="text-brand-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center md:text-left">
            How We Got Here
          </span>
          <h2 className="font-serif font-normal text-brand-oat tracking-tight leading-none mb-16 sm:mb-24 text-center md:text-left"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.2rem)" }}>
            The culture <br className="hidden sm:block" />
            <span className="text-brand-gold italic">evolves.</span>
          </h2>
 
          {/* Vertical Typography Rows */}
          <div className="max-w-4xl mx-auto flex flex-col gap-12 sm:gap-16">
            {timeline.map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-12 pb-12 border-b border-white/10 last:border-b-0 group">
                {/* Year Label */}
                <div className="w-full md:w-3/12">
                  <span className="font-serif font-light text-5xl sm:text-6xl md:text-7xl text-brand-gold leading-none tracking-tight block group-hover:scale-105 group-hover:translate-x-1 transition-transform duration-500 origin-left">
                    {item.year}
                  </span>
                </div>
                {/* Year Details */}
                <div className="w-full md:w-9/12 flex flex-col justify-center">
                  <h3 className="font-serif font-normal text-xl sm:text-2xl md:text-3xl text-brand-oat mb-3 group-hover:text-brand-gold transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-brand-oat/60 font-bold text-sm sm:text-base leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── HOW WE THINK ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center">
            Fermentation Is Our Operating System
          </span>
          <h2 className="font-serif font-normal text-brand-brown tracking-tight leading-none mb-8 text-center"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.2rem)" }}>
            How we <span className="text-brand-orange italic font-light">think.</span>
          </h2>
          <div className="max-w-2xl mx-auto text-center flex flex-col gap-4 mb-16">
            <p className="text-sm sm:text-base font-bold text-brand-brown/60 leading-relaxed">
              At Wild Wild Yeast, fermentation isn&apos;t a feature. It&apos;s the organising principle. Everything we make uses time, microbes, and natural transformation — not preservatives, additives, stabilisers, or chemical shortcuts.
            </p>
            <p className="text-sm sm:text-base font-bold text-brand-brown/60 leading-relaxed">
              Because fermented food is alive, it cannot be treated like inventory. We produce only against orders. High-quality ingredients are not a choice. They are the only way this system works.
            </p>
          </div>
          <div className="think-container grid grid-cols-1 sm:grid-cols-3 gap-6">
            {howWeThink.map((v, i) => (
              <div key={i} className="think-card bg-white rounded-[2rem] p-8 sm:p-10 border border-brand-brown/5 shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.01]">
                <span className="font-serif italic font-normal text-3xl sm:text-4xl text-brand-orange mb-4 block">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif font-normal text-2xl sm:text-3xl text-brand-brown mb-4">{v.label}</h3>
                <p className="text-sm font-bold text-brand-brown/50 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      <HowItWorks />
 
      {/* ── CTA ── */}
      <section className="w-full bg-brand-orange px-4 sm:px-8 xl:px-16 py-20 sm:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <h2 className="font-serif font-normal text-white tracking-tight leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            You set it <br />
            <span className="italic font-light">in motion.</span>
          </h2>
          <p className="text-white/80 font-bold text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Every provision is made to order. Slow-fermented. Nothing added that doesn't belong.
          </p>
          <Link href="/shop"
            className="inline-block bg-white text-brand-orange hover:bg-brand-brown hover:text-white px-12 py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl transition-all duration-300 active:scale-95">
            Shop the Range
          </Link>
        </div>
      </section>
 
      <Footer />
    </main>
  );
}
