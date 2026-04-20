"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function StorySection() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".parallax-bg", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".story-images",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.fromTo(".story-text",
        { y: 80, opacity: 0, rotation: 2 },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 1.5,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".story-text-container",
            start: "top 80%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full relative bg-brand-charcoal text-brand-oat py-20 sm:py-32 md:py-48 z-10 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem] -mt-8 sm:-mt-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        <div className="flex flex-col lg:flex-row gap-10 sm:gap-16 md:gap-24 items-center">

          {/* Left: Images */}
          <div className="w-full lg:w-1/2 flex gap-3 sm:gap-4 md:gap-8 story-images h-[50vw] sm:h-[60vh] md:h-[80vh] max-h-[520px] relative overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
            <div className="w-1/2 h-[120%] -top-[10%] relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 border-brand-charcoal">
              <Image src="/f1.png" alt="Wheat field" fill className="parallax-bg object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="w-1/2 h-[120%] -top-[10%] relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 border-brand-charcoal mt-12 sm:mt-16 md:mt-32">
              <Image src="/f2.png" alt="Process" fill className="parallax-bg object-cover transition-transform duration-700 hover:scale-105" />
            </div>

            {/* Floating Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFDDC1] text-brand-charcoal w-24 sm:w-32 h-24 sm:h-32 rounded-full flex flex-col justify-center items-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.1),0_25px_50px_-12px_rgba(0,0,0,0.25)] z-20 hover:scale-110 transition-transform cursor-pointer border-4 border-brand-charcoal">
              <span className="font-black text-2xl sm:text-3xl leading-none">ZERO</span>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Artificial<br />Additives</span>
            </div>
          </div>

          {/* Right: Text */}
          <div className="w-full lg:w-1/2 story-text-container flex flex-col justify-center lg:pl-10">
            <span className="story-text inline-block px-4 sm:px-5 py-2 rounded-full bg-brand-terracotta text-white text-[9px] sm:text-[10px] md:text-xs font-black tracking-[0.2em] uppercase mb-6 sm:mb-8 shadow-sm w-fit">
              The Philosophy
            </span>

            <h2
              className="story-text font-black leading-[0.9] tracking-tighter mb-6 sm:mb-10 text-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              TIME IS OUR <br />
              <span className="text-[#FEC84D]">ONLY ADDITIVE.</span>
            </h2>

            <p className="story-text text-sm sm:text-base md:text-xl text-brand-oat/80 font-bold leading-relaxed max-w-xl mb-6 sm:mb-8">
              We believe in the slow, chaotic magic of wild fermentation. There are no shortcuts, no lab-made cultures, and zero artificial sweeteners.
            </p>

            <p className="story-text text-sm sm:text-base md:text-xl text-brand-oat/80 font-bold leading-relaxed max-w-xl mb-10 sm:mb-16">
              From our botanical soda to our artisan sourdough, everything is cultivated using 100-year-old starters and locally sourced ingredients.
            </p>

            <div className="story-text flex">
              <button className="w-full sm:w-auto bg-[#FEC84D] text-brand-charcoal hover:bg-brand-terracotta hover:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95">
                Read our Journal
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
