"use client";
 
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
 
gsap.registerPlugin(ScrollTrigger);
 
const STAGES = [
  {
    src: "/product_img/2-starter-side.jpg",
    stage: "Starter",
    title: "It begins alive.",
    body: "Flour, water, and time — nothing else. Fed daily, growing until it's ready to leaven.",
  },
  {
    src: "/product_img/3-score.jpg",
    stage: "Score",
    title: "Scored by hand.",
    body: "Every loaf is cut just before the oven — the mark that decides how it opens up.",
  },
  {
    src: "/product_img/4-bloom.jpg",
    stage: "Bloom",
    title: "Oven spring.",
    body: "The heat hits and the loaf pushes upward — the moment fermentation shows its work.",
  },
  {
    src: "/product_img/7-from-the-oven.jpg",
    stage: "Bake",
    title: "No shortcuts in the oven.",
    body: "Stone-baked, watched closely. This is where the crust gets its character.",
  },
  {
    src: "/product_img/8-the-crust.jpg",
    stage: "Crust",
    title: "The sound when you cut it.",
    body: "Thick, crackling, and dark where it needs to be. You'll hear it before you taste it.",
  },
  {
    src: "/product_img/5-crumb-sliced.jpg",
    stage: "Table",
    title: "Sliced, and yours.",
    body: "Open, airy crumb — the payoff for every hour that came before it.",
  },
];
 
export default function ProcessStory() {
  const containerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".process-grid-item",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
        }
      );
    }, containerRef);
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      ctx.revert();
    };
  }, []);
 
  return (
    <section
      ref={containerRef}
      className="w-full bg-brand-charcoal px-4 sm:px-8 xl:px-16 py-20 sm:py-36 overflow-hidden relative"
    >
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
 
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Block */}
        <div className="max-w-xl mb-16 sm:mb-24">
          <span className="text-brand-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            From Starter to Table
          </span>
          <h2
            className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(2.2rem, 7vw, 4.8rem)" }}
          >
            The whole <span className="text-brand-gold italic font-light">process.</span>
          </h2>
        </div>
 
        {/* Responsive Staggered Grid Layout */}
        <div ref={gridRef} className="process-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-x-12 sm:gap-y-16 pb-12">
          {STAGES.map((s, i) => {
            // Apply vertical offsets to alternating columns on desktop
            const staggerClass = i % 2 === 1 ? "lg:translate-y-12" : "";
            
            return (
              <div
                key={s.stage}
                className={`process-grid-item flex flex-col group transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${staggerClass}`}
              >
                {/* Image Frame with Letterbox Ratio */}
                <div className="relative w-full aspect-[1.5/1] rounded-[2rem] overflow-hidden mb-5 border border-white/5 shadow-md pointer-events-none">
                  <Image
                    src={s.src}
                    alt={s.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                  
                  {/* Numeric Stage Badge */}
                  <div className="absolute bottom-4 left-4 bg-brand-charcoal/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="font-sans font-black text-[10px] tracking-wider text-brand-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                    <span className="font-sans font-black text-[9px] uppercase tracking-[0.1em] text-brand-oat/70">
                      {s.stage}
                    </span>
                  </div>
                </div>
 
                {/* Text Meta & Info Container */}
                <div className="relative overflow-hidden pt-1">
                  {/* Big background numeral overlay */}
                  <div className="absolute right-0 bottom-0 select-none pointer-events-none font-serif italic text-7xl font-bold text-brand-gold/[0.04] leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  
                  <h3 className="font-serif font-normal text-brand-oat text-xl sm:text-2xl tracking-tight leading-snug mb-2 group-hover:text-brand-gold transition-colors duration-300 relative z-10">
                    {s.title}
                  </h3>
                  <p className="text-brand-oat/60 text-sm font-medium leading-relaxed relative z-10 max-w-[90%]">
                    {s.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
 
      </div>
    </section>
  );
}
