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
 
const howWeThink = [
  {
    label: "Time is the ingredient",
    body: "Not speed, not shortcuts. Dough that needs resting. Flavours that change quietly. Bakes made close to the day they reach you.",
  },
  {
    label: "Honesty over claims",
    body: "Some days the loaf is different. Some days the bubbles are louder. Wild fermentation moves with the weather.",
  },
  {
    label: "Made for someone",
    body: "Every loaf is made against an order with a name on it.",
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
            alt="Wheat field at sunset, the grain behind our flour"
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
            A little wildness<br />
            <span className="text-brand-gold italic font-light">goes a long way.</span>
          </h1>
          <p className="story-hero-text text-base sm:text-lg md:text-xl font-bold text-brand-oat/60 max-w-xl leading-relaxed">
            Wild Wild Yeast began with a simple idea: good food doesn&apos;t have to follow the usual rules.
          </p>
        </div>
      </section>
 
      {/* ── EDITORIAL STATEMENT & NARRATIVE ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column: Big Statement */}
          <div className="w-full lg:w-5/12 flex flex-col justify-start">
            <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 block">
              About The Craft
            </span>
            <h2 className="font-serif font-normal text-brand-brown leading-[1.1] tracking-tight mb-6"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              What if bread <br />
              <span className="italic text-brand-orange">were adventurous?</span>
            </h2>
            <p className="text-sm font-bold text-brand-brown/40 uppercase tracking-widest leading-relaxed mb-6">
              What if familiar flavours found new combinations? What if a neighbourhood bakery could keep giving you something new to look forward to?
            </p>
            
            {/* Tag pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {["Veg only"].map(tag => (
                <span key={tag} className="px-4.5 py-2 rounded-full border border-brand-brown/10 text-[9px] font-black tracking-[0.12em] uppercase text-brand-brown/40 bg-white/40">
                  {tag}
                </span>
              ))}
            </div>
          </div>
 
          {/* Right Column: Detailed Narrative */}
          <div className="w-full lg:w-7/12 flex flex-col gap-6 text-sm sm:text-base font-medium text-brand-brown/70 leading-relaxed lg:border-l lg:border-brand-brown/10 lg:pl-16">
            <p>We love the patience behind sourdough, the character of fermentation and the possibilities that open up when you start asking, &ldquo;What if?&rdquo;</p>
            <p>What if bread could be a little more adventurous? What if familiar flavours found new combinations? What if a neighbourhood bakery could keep giving you something new to look forward to?</p>
            <p>That&apos;s the spirit behind Wild Wild Yeast. We&apos;re here for naturally fermented sourdough, thoughtfully made bakes and a growing world of flavours that invite you to look at everyday food a little differently.</p>
            <p>Our loaves are leavened with a wild yeast starter, with no commercial yeast added, and given a slow 12 to 24 hour ferment. We bake against confirmed orders, so nothing sits waiting and no batch is made for stock.</p>
            <p className="text-brand-brown font-serif italic text-lg sm:text-xl mt-4">Wild by nature. Crafted by time.</p>
          </div>
          
        </div>
 
        {/* Integrated Clean Split Images */}
        <div className="flex gap-4 sm:gap-6 h-[45vw] sm:h-[350px] md:h-[420px] mt-16 max-w-7xl mx-auto px-2">
          <div className="w-1/2 rounded-[2rem] overflow-hidden shadow-xl border border-brand-brown/5">
            <div className="relative w-full h-full">
              <Image src="/product_img/1-starter-top.jpg" alt="Our wild yeast starter in a jar, bubbling" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
          <div className="w-1/2 rounded-[2rem] overflow-hidden shadow-xl border border-brand-brown/5 mt-6 sm:mt-10">
            <div className="relative w-full h-full">
              <Image src="/product_img/6-top-shot.jpg" alt="Fresh loaves, cooling before delivery" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>
 
      {/* ── HOW WE THINK ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto">
          <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center">
            Our philosophy
          </span>
          <h2 className="font-serif font-normal text-brand-brown tracking-tight leading-none mb-8 text-center"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.2rem)" }}>
            Rooted in craft. <span className="text-brand-orange italic font-light">Driven by curiosity.</span>
          </h2>
          <div className="max-w-2xl mx-auto text-center flex flex-col gap-4 mb-16">
            <p className="text-sm sm:text-base font-bold text-brand-brown/60 leading-relaxed">
              We respect the process, take our time with the details and keep exploring what comes next.
            </p>
            <p className="text-sm sm:text-base font-bold text-brand-brown/60 leading-relaxed">
              From our Crafted Bakes to our Be-sides, each part of the range reflects our belief that good food should be well considered, full of character and enjoyable to discover. We bake twice a week, bringing our approach to freshness and flavour to every batch.
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
            Wild by nature. <br />
            <span className="italic font-light">Crafted by time.</span>
          </h2>
          <p className="text-white/80 font-bold text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            For us, the words aren&apos;t just a brand line. They&apos;re a reminder of what matters: a respect for the process, an open mind about flavour and a commitment to making things worth coming back for. We&apos;re glad you&apos;re here.
          </p>
          <Link href="/shop"
            className="inline-block bg-white text-brand-orange hover:bg-brand-brown hover:text-white px-12 py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl transition-all duration-300 active:scale-95">
            Explore the shop
          </Link>
        </div>
      </section>
 
      <Footer />
    </main>
  );
}
