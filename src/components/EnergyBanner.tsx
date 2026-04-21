"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function EnergyBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(textRef.current, {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".floating-item", {
        y: "random(-20, 20)",
        x: "random(-10, 10)",
        rotation: "random(-5, 5)",
        duration: "random(4, 6)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-brand-olive py-28 sm:py-48 md:py-64 relative overflow-hidden flex items-center justify-center -mt-px shadow-inner"
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-gold/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-terracotta/15 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Massive Parallax Text */}
      <h2
        ref={textRef}
        className="font-serif font-black italic text-brand-oat absolute z-0 opacity-[0.07] select-none pointer-events-none whitespace-nowrap text-center drop-shadow-2xl"
        style={{ fontSize: "clamp(5rem, 18vw, 20rem)", lineHeight: 0.7 }}
      >
        CHARACTER CHARACTER CHARACTER
      </h2>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center w-full max-w-[1400px]">

        {/* Main Heading */}
        <h3
          className="font-serif font-black text-brand-oat text-center leading-[0.8] mb-12 sm:mb-20 tracking-tighter drop-shadow-2xl relative z-30"
          style={{ fontSize: "clamp(4rem, 12vw, 8rem)" }}
        >
          Alive in <span className="italic font-light text-brand-gold relative">every sip.
            <svg className="absolute -bottom-4 left-0 w-full h-8 text-brand-terracotta opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
          </span>
        </h3>

        {/* Floating Items Container - Expanded to fill screen */}
        <div className="relative w-full h-[350px] sm:h-[450px] md:h-[600px] flex items-center justify-center mt-8">
          
          {/* Center item - Hero Product */}
          <div className="floating-item relative w-[60%] sm:w-[40%] md:w-[30%] aspect-[3/4] z-20 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-[6px] sm:border-[8px] border-brand-oat shadow-[0_30px_60px_rgba(0,0,0,0.4)] rotate-2 group cursor-pointer">
            <Image src="/p5.png" alt="Bundle" fill className="object-cover group-hover:scale-110 transition-transform duration-700 hover:rotate-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/60 to-transparent flex items-end p-6 sm:p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white font-black uppercase tracking-widest text-sm sm:text-lg">Sampler Kit</span>
            </div>
          </div>

          {/* Far Left item */}
          <div className="floating-item absolute left-0 sm:left-[5%] md:left-[10%] top-[10%] sm:top-0 w-[45%] sm:w-[30%] md:w-[22%] aspect-[3/4] z-10 rotate-[-12deg] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-4 sm:border-8 border-white/90 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:z-30 hover:rotate-0 transition-all duration-500 group cursor-pointer">
            <Image src="/p3.png" alt="Can" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* Far Right item */}
          <div className="floating-item absolute right-0 sm:right-[5%] md:right-[10%] bottom-[10%] sm:-bottom-[10%] w-[40%] sm:w-[28%] md:w-[25%] aspect-[3/4] z-30 rotate-[8deg] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border-4 sm:border-8 border-[#FEC84D] shadow-[0_25px_50px_rgba(0,0,0,0.35)] hover:z-40 hover:rotate-0 transition-all duration-500 group cursor-pointer">
            <Image src="/p1.png" alt="Sourdough" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
          
          {/* Small decorative accent 1 */}
          <div className="floating-item absolute left-[20%] bottom-[5%] md:bottom-[20%] w-16 sm:w-24 h-16 sm:h-24 bg-brand-terracotta rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm -rotate-12 shadow-xl z-20 border-4 border-brand-olive cursor-default">
            NEW
          </div>

          {/* Small decorative accent 2 */}
          <div className="floating-item absolute right-[25%] top-[5%] md:top-[15%] w-12 sm:w-20 h-12 sm:h-20 bg-white rounded-full flex items-center justify-center text-brand-charcoal font-black text-xl sm:text-2xl rotate-12 shadow-xl z-10 border-4 border-brand-olive cursor-default">
            ✦
          </div>

        </div>

        {/* CTA Button */}
        <button className="mt-16 sm:mt-24 bg-brand-oat text-brand-olive rounded-full px-12 sm:px-16 py-4 sm:py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-brand-terracotta hover:text-white hover:scale-105 transition-all duration-500 shadow-[0_15px_30px_rgba(0,0,0,0.2)] whitespace-nowrap z-30">
          Shop the Set
        </button>

      </div>

    </section>
  );
}
