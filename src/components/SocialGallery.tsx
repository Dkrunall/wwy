"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { BUSINESS } from "@/lib/business";

gsap.registerPlugin(ScrollTrigger);

// Our own photos, each linking to our Instagram. No invented handles or reviews (P0-6, D3 option B).
const PHOTOS = [
  { img: "/product_img/4-dutch-oven.jpg", alt: "Sourdough loaf, straight out of the Dutch oven" },
  { img: "/product_img/6-top-shot.jpg", alt: "Three baked sourdough loaves with cheese, cooling on a wire rack" },
  { img: "/product_img/5-crumb.jpg", alt: "A sourdough loaf cut in half to show its open crumb" },
  { img: "/product_img/2-starter-side.jpg", alt: "Sourdough starter, fed and ready to leaven" },
  { img: "/product_img/7-from-the-oven.jpg", alt: "A loaf fresh from the oven" },
  { img: "/product_img/8-the-crust.jpg", alt: "The crackling crust of a baked sourdough loaf" },
];

export default function SocialGallery() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".social-text",
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.5,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: ".social-text-container", start: "top 80%" },
        }
      );

      gsap.to(".marquee-content", {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full relative flex flex-col bg-[#FFF6EC] pt-16 sm:pt-32 overflow-hidden border-t-4 border-brand-charcoal/10 -mt-8 z-20 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem]"
    >
      {/* Header Row */}
      <div className="container mx-auto px-4 sm:px-6 mb-10 sm:mb-16 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-12 relative z-10">
        <div className="social-text-container text-center md:text-left">
          <span className="social-text text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            On Instagram
          </span>
          <h2
            className="social-text font-black text-brand-charcoal tracking-tight leading-none"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
          >
            FROM OUR <br className="hidden sm:block" />
            <span className="text-brand-terracotta">OVEN.</span>
          </h2>
        </div>

        <a
          href={BUSINESS.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-text inline-flex items-center gap-2 bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-4 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-colors active:scale-95 shadow-lg"
        >
          Follow @{BUSINESS.instagramHandle}
        </a>
      </div>

      {/* Photo grid: six of our own photos */}
      <div className="container mx-auto px-4 sm:px-6 mb-12 sm:mb-20 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 relative z-10">
        {PHOTOS.map((p) => (
          <a
            key={p.img}
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.alt}. Open our Instagram`}
            className="group relative aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <Image src={p.img} alt={p.alt} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
          </a>
        ))}
      </div>

      {/* Text Marquee Footer */}
      <div className="bg-brand-charcoal w-full relative py-6 sm:py-8 overflow-hidden z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 whitespace-nowrap">
          <div className="flex font-black uppercase tracking-widest text-[#FEC84D] marquee-content"
            style={{ fontSize: "clamp(1.2rem, 4vw, 2.5rem)" }}>
            <span>SLOW FERMENTED • ROOTED IN PROCESS • HONEST INGREDIENTS • BAKED TO ORDER • NATURALLY LEAVENED • SLOW FERMENTED • ROOTED IN PROCESS •&nbsp;</span>
            <span>SLOW FERMENTED • ROOTED IN PROCESS • HONEST INGREDIENTS • BAKED TO ORDER • NATURALLY LEAVENED • SLOW FERMENTED • ROOTED IN PROCESS •&nbsp;</span>
          </div>
        </div>
      </div>

    </section>
  );
}
