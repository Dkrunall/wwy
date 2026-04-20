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
      className="w-full bg-brand-olive py-28 sm:py-48 md:py-64 relative overflow-hidden flex items-center justify-center -mt-px"
    >
      {/* Massive Parallax Text */}
      <h2
        ref={textRef}
        className="font-serif font-black italic text-brand-oat absolute z-0 opacity-5 select-none pointer-events-none whitespace-nowrap text-center"
        style={{ fontSize: "clamp(5rem, 15vw, 15rem)", lineHeight: 0.7 }}
      >
        VITALITY VITALITY VITALITY
      </h2>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">

        {/* Main Heading */}
        <h3
          className="font-serif font-black text-brand-oat text-center leading-[0.8] mb-10 sm:mb-16 tracking-tighter drop-shadow-2xl"
          style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
        >
          Unwrap <span className="italic font-light text-brand-gold">Energy.</span>
        </h3>

        {/* Floating Items */}
        <div className="relative w-full max-w-xs sm:max-w-md md:max-w-2xl h-[220px] sm:h-[300px] md:h-[400px] flex items-center justify-center">
          {/* Center item */}
          <div className="floating-item relative w-40 h-40 sm:w-56 sm:h-56 md:w-80 md:h-80 z-20 mix-blend-screen drop-shadow-[-20px_20px_30px_rgba(24,26,24,0.5)]">
            <Image src="/p5.png" alt="Bundle" fill className="object-contain" />
          </div>

          {/* Left */}
          <div className="floating-item absolute -left-4 sm:-left-8 md:-left-16 top-6 sm:top-10 w-20 h-20 sm:w-32 sm:h-32 md:w-56 md:h-56 z-10 rotate-[-10deg] mix-blend-screen opacity-90 blur-[1px]">
            <Image src="/p3.png" alt="Can" fill className="object-contain" />
          </div>

          {/* Right */}
          <div className="floating-item absolute -right-2 sm:-right-6 md:-right-12 bottom-6 sm:bottom-10 w-16 h-16 sm:w-24 sm:h-24 md:w-48 md:h-48 z-30 rotate-[15deg] mix-blend-screen blur-[0.5px]">
            <Image src="/p2.png" alt="Drops" fill className="object-contain" />
          </div>
        </div>

        {/* CTA Button */}
        <button className="mt-12 sm:mt-20 border border-brand-oat text-brand-oat rounded-full px-10 sm:px-12 py-3 sm:py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-oat hover:text-brand-olive hover:scale-105 transition-all duration-500 shadow-2xl whitespace-nowrap">
          Shop the Set
        </button>

      </div>

    </section>
  );
}
