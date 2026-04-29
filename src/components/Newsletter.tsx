"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Newsletter() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".newsletter-reveal", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-brand-oat py-20 sm:py-32 md:py-48 relative overflow-hidden -mt-px z-20"
    >
      {/* Background Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <h2
          className="font-serif font-black italic uppercase text-brand-charcoal leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(8rem, 20vw, 25rem)" }}
        >
          THE SOCIETY
        </h2>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">

        {/* Badge */}
        <div className="newsletter-reveal px-5 sm:px-6 py-2 rounded-full border border-brand-charcoal/20 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-brand-charcoal/60 mb-6 sm:mb-8">
          Join the Society
        </div>

        {/* Heading */}
        <div className="newsletter-reveal text-center mb-10 sm:mb-16">
          <h2
            className="font-serif font-black text-brand-charcoal leading-[0.9] mb-4 sm:mb-6 tracking-tighter"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
          >
            Stay in the <span className="italic font-light text-brand-terracotta">Culture.</span>
          </h2>
          <p className="max-w-xs sm:max-w-xl mx-auto text-brand-charcoal/70 text-sm sm:text-base font-medium leading-relaxed">
            Notes on fermentation, small-batch arrivals, and what's slow-fermenting right now.
          </p>
        </div>

        {/* Input */}
        <div className="newsletter-reveal w-full max-w-xs sm:max-w-md md:max-w-2xl relative group">
          <input
            type="email"
            placeholder="your@email.com"
            className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 sm:py-6 md:py-8 font-serif italic text-brand-charcoal placeholder:text-brand-charcoal/30 focus:border-brand-terracotta outline-none transition-all duration-500 pr-16 sm:pr-20"
            style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}
          />
          <button className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-brand-charcoal text-brand-oat flex items-center justify-center hover:bg-brand-terracotta hover:scale-105 transition-all duration-300">
            <ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
          </button>
        </div>

      </div>
    </section>
  );
}
