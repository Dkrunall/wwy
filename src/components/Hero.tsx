"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-text",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 1.2,
          ease: "back.out(1.2)",
          delay: 0.1
        }
      );

      gsap.fromTo(".hero-card",
        { scale: 0.8, opacity: 0, rotation: -5 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.75)",
          delay: 0.4
        }
      );

      gsap.to(".hero-float", {
        y: -20,
        rotation: 2,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full relative min-h-screen bg-brand-oat overflow-hidden flex items-center pt-32 sm:pt-36 md:pt-28 pb-16 sm:pb-20 border-b border-brand-charcoal/5"
    >
      {/* Dynamic Background Texture & Orbs */}
      <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <div className="absolute -top-[10%] -right-[10%] w-[500px] sm:w-[700px] lg:w-[900px] h-[500px] sm:h-[700px] lg:h-[900px] bg-brand-terracotta/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-[#FEC84D]/20 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      {/* Massive Background Text watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-0 opacity-[0.03] select-none">
        <h1 className="font-serif font-black tracking-tighter whitespace-nowrap" style={{ fontSize: "clamp(10rem, 25vw, 30rem)", lineHeight: 0.8 }}>WILD<br/>FERMENT</h1>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row items-center gap-10 sm:gap-16 lg:gap-8 w-full">

        {/* Left: Typography & Actions */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">

          <div className="hero-text inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white text-brand-charcoal text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 shadow-sm border border-brand-charcoal/5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-brand-terracotta animate-pulse shrink-0"></span>
            Now Available Worldwide
          </div>

          <h1 className="hero-text font-black tracking-tighter text-brand-charcoal mb-6 sm:mb-8 leading-[0.85]"
            style={{ fontSize: "clamp(3rem, 14vw, 7.5rem)" }}>
            WILD <br /> <span className="text-brand-terracotta">YEAST.</span>
          </h1>

          <p className="hero-text text-base sm:text-lg md:text-xl font-bold text-brand-charcoal/70 max-w-sm sm:max-w-md mb-8 sm:mb-12">
            Unapologetically natural sodas and sourdough cultures, fermented with pure wild energy.
          </p>

          <div className="hero-text flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-brand-charcoal text-brand-oat hover:bg-brand-terracotta hover:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95">
              Shop The Range
            </button>
            <button className="w-full sm:w-auto bg-white text-brand-charcoal hover:bg-brand-oat px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-sm border border-brand-charcoal/5 active:scale-95">
              Our Story
            </button>
          </div>
        </div>

        {/* Right: Playful Product Frame */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative mt-4 sm:mt-0">
          <div className="hero-card hero-float relative rounded-[2.5rem] sm:rounded-[3rem] bg-white p-3 sm:p-4 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-4 border-white rotate-3 group z-20"
            style={{ width: "min(320px, 88vw)", height: "min(400px, 110vw)", maxWidth: "450px", maxHeight: "550px" }}>
            <div className="relative w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-brand-oat/50 shadow-[inset_0_10px_30px_rgba(0,0,0,0.08)] mask-image-rounded">
              <Image src="/p1.png" alt="Sourdough Soda" fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
            </div>

            {/* Decorative floating badge */}
            <div className="absolute -bottom-5 sm:-bottom-6 -left-5 sm:-left-6 bg-[#FEC84D] text-brand-charcoal w-20 sm:w-24 h-20 sm:h-24 rounded-full flex flex-col justify-center items-center -rotate-12 shadow-lg border-2 border-brand-oat z-30">
              <span className="font-black text-xl sm:text-2xl leading-none">100%</span>
              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest">Natural</span>
            </div>
          </div>

          {/* Accent floating element — visible on more screens, more vibrant */}
          <div className="hero-card hidden sm:block absolute top-[5%] -left-[10%] md:right-[85%] w-28 sm:w-32 lg:w-48 h-28 sm:h-32 lg:h-48 rounded-[2rem] bg-white p-2 sm:p-3 shadow-[0_30px_60px_rgba(0,0,0,0.15)] rotate-[-15deg] z-10 hover:scale-110 hover:rotate-0 transition-transform duration-500 cursor-pointer">
            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,0.08)]">
              <Image src="/p3.png" alt="Can" fill className="object-cover" />
            </div>
          </div>
        </div>

      </div>

      {/* Scroll Down Indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-20"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.3em] rotate-180 [writing-mode:vertical-lr] text-brand-charcoal hidden sm:block">Scroll</span>
        <div className="w-[1px] h-10 bg-brand-charcoal/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-terracotta animate-scroll-line"></div>
        </div>
      </div>

    </section>
  );
}
