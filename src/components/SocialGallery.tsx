"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
          scrollTrigger: {
            trigger: ".social-text-container",
            start: "top 80%",
          }
        }
      );

      gsap.fromTo(".testimonial-box",
        { y: 100, opacity: 0, rotation: -2 },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.7)",
          scrollTrigger: {
            trigger: ".testimonial-box",
            start: "top 85%",
          }
        }
      );

      gsap.to(".marquee-content", {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });

      gsap.to(".photo-marquee-content", {
        xPercent: -50,
        ease: "none",
        duration: 35,
        repeat: -1,
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const galleryItems = [
    { img: "/f1.png", handle: "@wild.ferment", prod: "Sourdough Starter" },
    { img: "/f2.png", handle: "@karan_makes", prod: "The Iron Tin" },
    { img: "/p1.png", handle: "@pure.soda", prod: "Wild Botanicals" },
    { img: "/p3.png", handle: "@fizz_society", prod: "Golden Fizz" },
    { img: "/p5.png", handle: "@daily_provisions", prod: "Sampler Kit" },
    { img: "/f1.png", handle: "@wild.ferment", prod: "Sourdough Starter" },
    { img: "/f2.png", handle: "@karan_makes", prod: "The Iron Tin" },
    { img: "/p1.png", handle: "@pure.soda", prod: "Wild Botanicals" },
    { img: "/p3.png", handle: "@fizz_society", prod: "Golden Fizz" },
    { img: "/p5.png", handle: "@daily_provisions", prod: "Sampler Kit" },
  ];

  return (
    <section
      ref={containerRef}
      className="w-full relative flex flex-col bg-[#FFF6EC] pt-20 sm:pt-32 overflow-hidden border-t-4 border-brand-charcoal/10 -mt-8 z-20 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem]"
    >
      {/* Header Row */}
      <div className="container mx-auto px-4 sm:px-6 mb-12 sm:mb-20 md:mb-32 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-12 relative z-10">
        <div className="social-text-container text-center md:text-left">
          <span className="social-text inline-block px-4 sm:px-5 py-2 rounded-full bg-[#FEC84D] text-brand-charcoal text-[9px] sm:text-[10px] md:text-xs font-black tracking-[0.2em] uppercase mb-4 sm:mb-6 shadow-sm">
            The Community
          </span>
          <h2
            className="social-text font-black text-brand-charcoal leading-[0.9] tracking-tighter"
            style={{ fontSize: "clamp(2.8rem, 9vw, 7rem)" }}
          >
            WILD <span className="text-brand-terracotta">SIGHTINGS.</span>
          </h2>
        </div>

        {/* Testimonial Card */}
        <div className="testimonial-box w-full md:w-auto max-w-sm bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border-4 border-brand-charcoal/5 relative">
          <div className="absolute -top-4 -right-4 bg-brand-terracotta text-white w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-full text-2xl sm:text-3xl font-serif leading-none shadow-lg">"</div>
          <p className="text-brand-charcoal/80 text-sm leading-relaxed font-bold">
            Finding a natural soda that isn't packed with processed sugar is impossible. The Wild Ale soda has completely replaced my evening drink. The sourdough tin is just a gorgeous bonus.
          </p>
          <div className="mt-5 sm:mt-6 flex items-center gap-3 sm:gap-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#FFDDC1] rounded-full flex items-center justify-center text-brand-charcoal font-black text-lg sm:text-xl shadow-inner shrink-0">M</div>
            <div>
              <p className="text-brand-charcoal font-black text-xs uppercase tracking-widest">Mira S.</p>
              <p className="text-brand-terracotta font-black text-[10px] uppercase tracking-widest mt-1">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Image Marquee */}
      <div className="relative w-full overflow-hidden flex py-10 sm:py-16 mb-12 sm:mb-20 bg-[#FFDDC1] rotate-[-2deg] scale-105 border-y-8 border-brand-charcoal/5 shadow-inner">
        <div className="flex gap-4 sm:gap-6 md:gap-10 min-w-[200%] photo-marquee-content px-4">
          {galleryItems.map((item, i) => (
            <div
              key={i}
              className="relative shrink-0 aspect-[3/4] rounded-[1.5rem] sm:rounded-[2rem] bg-white border-4 border-brand-charcoal overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
              style={{ width: "clamp(160px, 42vw, 280px)" }}
            >
              <Image src={item.img} alt="Social Post" fill className="object-cover group-hover:scale-110 transition-all duration-700" />

              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 transform transition-transform duration-300">
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-brand-charcoal text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md">
                  {item.handle}
                </span>
              </div>

              <div className="absolute inset-0 rounded-[calc(1.5rem-4px)] sm:rounded-[calc(2rem-4px)] bg-[#FF6B35]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-4 sm:p-6 text-center backdrop-blur-sm z-10">
                <p className="text-white font-black text-lg sm:text-2xl mb-4 sm:mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 tracking-tight leading-none uppercase">
                  {item.prod}
                </p>
                <button className="bg-white text-brand-terracotta hover:bg-brand-charcoal hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transform translate-y-8 group-hover:translate-y-0 transition-all duration-700 active:scale-95 shadow-xl">
                  Shop Piece
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text Marquee Footer */}
      <div className="bg-brand-charcoal w-full relative py-6 sm:py-8 overflow-hidden z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 whitespace-nowrap">
          <div className="flex font-black uppercase tracking-widest text-[#FEC84D] marquee-content"
            style={{ fontSize: "clamp(1.2rem, 4vw, 2.5rem)" }}>
            <span>SLOW FERMENTED • ROOTED IN PROCESS • HONEST INGREDIENTS • LIVING FOOD • NATURALLY LEAVENED • SLOW FERMENTED • ROOTED IN PROCESS •&nbsp;</span>
            <span>SLOW FERMENTED • ROOTED IN PROCESS • HONEST INGREDIENTS • LIVING FOOD • NATURALLY LEAVENED • SLOW FERMENTED • ROOTED IN PROCESS •&nbsp;</span>
          </div>
        </div>
      </div>

    </section>
  );
}
