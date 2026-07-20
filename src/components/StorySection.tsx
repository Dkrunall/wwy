"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import WhatsAppIcon from "./WhatsAppIcon";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function StorySection() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
      className="w-full relative bg-brand-brown text-brand-oat py-16 sm:py-32 md:py-40 z-10 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem] -mt-8 sm:-mt-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        <div className="flex flex-col lg:flex-row gap-10 sm:gap-16 md:gap-24 items-center">

          {/* Left: Images */}
          <div className="w-full lg:w-1/2 flex gap-4 sm:gap-6 md:gap-10 story-images h-[65vw] sm:h-[55vh] md:h-[75vh] min-h-[240px] max-h-[500px] relative px-4">
            <div className="w-1/2 h-[95%] relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/15">
              <Image src="/f1.png" alt="Wheat field" fill className="object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="w-1/2 h-[95%] relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/15 mt-10 sm:mt-12 md:mt-20">
              <Image src="/f2.png" alt="Process" fill className="object-cover transition-transform duration-700 hover:scale-105" />
            </div>

            {/* Floating Badge */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFDDC1] text-brand-brown w-24 sm:w-32 h-24 sm:h-32 rounded-full flex flex-col justify-center items-center shadow-2xl z-20 hover:scale-110 transition-transform cursor-pointer border-4 border-brand-brown">
              <span className="font-serif italic font-normal text-2xl sm:text-3xl leading-none">Zero</span>
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-center leading-tight mt-1">Artificial<br />Additives</span>
            </div>
          </div>

          {/* Right: Text */}
          <div className="w-full lg:w-1/2 story-text-container flex flex-col justify-center lg:pl-10">
            <span className="story-text text-brand-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              The Philosophy
            </span>

            <h2
              className="story-text font-serif font-normal tracking-tight leading-[1.05] mb-6 sm:mb-10 text-white"
              style={{ fontSize: "clamp(2.5rem, 7.5vw, 5.2rem)" }}
            >
              Nothing made <br className="hidden sm:block" />
              <span className="text-brand-gold italic">before you order.</span>
            </h2>

            <p className="story-text text-sm sm:text-base md:text-lg text-brand-oat/75 font-bold leading-relaxed max-w-xl mb-6 sm:mb-8">
              Every loaf and every bottle begins with an order. There is no shelf, no display counter, no excess waiting to be cleared.
            </p>

            <p className="story-text text-sm sm:text-base md:text-lg text-brand-oat/75 font-bold leading-relaxed max-w-xl mb-10 sm:mb-16">
              Fermentation resists urgency. We work with that resistance — not against it. Time does the work. Honest ingredients do the rest.
            </p>

            <div className="story-text flex flex-col sm:flex-row gap-3">
              <Link
                href="/order"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-brand-gold text-brand-brown hover:bg-brand-orange hover:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95"
              >
                <WhatsAppIcon size={14} />
                Order Now
              </Link>
              <p className="text-[10px] font-black tracking-[0.12em] uppercase text-brand-oat/30 self-center">
                Wed & Sat delivery
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
