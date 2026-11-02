"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS } from "@/lib/reviews";

gsap.registerPlugin(ScrollTrigger);



const AUTOPLAY_MS = 6000;
const PER_ROW = 5;
const PAGE_COUNT = Math.ceil(REVIEWS.length / PER_ROW);

export default function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setPage(((next % PAGE_COUNT) + PAGE_COUNT) % PAGE_COUNT);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".testimonials-heading",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".testimonials-heading", start: "top 85%" } }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (rowRef.current) {
      gsap.fromTo(
        rowRef.current.querySelectorAll(".testimonial-card"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, [page]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => goTo(page + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [page, paused, goTo]);

  const items = Array.from({ length: PER_ROW }, (_, i) => REVIEWS[(page * PER_ROW + i) % REVIEWS.length]);

  return (
    <section
      ref={containerRef}
      className="w-full bg-white px-4 sm:px-8 xl:px-16 py-16 sm:py-24 border-t border-brand-charcoal/5"
    >
      <div className="max-w-7xl mx-auto">
        <span className="testimonials-heading text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center">
          Good bread has a way of bringing people back.
        </span>
        <h2
          className="testimonials-heading font-black text-brand-charcoal tracking-tight leading-none mb-12 sm:mb-16 text-center"
          style={{ fontSize: "clamp(2.2rem, 7vw, 4.5rem)" }}
        >
          THE WORD ON THE <span className="text-brand-terracotta">WILD SIDE.</span>
        </h2>

        <div
          className="relative flex items-stretch gap-2 sm:gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            onClick={() => goTo(page - 1)}
            aria-label="Previous testimonials"
            className="shrink-0 self-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-oat/60 hover:bg-brand-terracotta hover:text-white text-brand-charcoal/60 flex items-center justify-center transition-colors duration-300 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            ref={rowRef}
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          >
            {items.map((review, i) => (
              <div
                key={`${page}-${i}`}
                className="testimonial-card min-h-[220px] flex flex-col bg-brand-oat/40 rounded-[1.5rem] p-5 border border-brand-charcoal/5"
              >
                <span className="text-brand-terracotta text-3xl font-serif leading-none block mb-2">&quot;</span>
                <p className="text-brand-charcoal/70 text-xs sm:text-[13px] font-bold leading-relaxed mb-4 line-clamp-6">
                  {review.quote}
                </p>
                <p className="mt-auto text-brand-charcoal font-black text-[11px] uppercase tracking-widest">{review.name}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => goTo(page + 1)}
            aria-label="Next testimonials"
            className="shrink-0 self-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-oat/60 hover:bg-brand-terracotta hover:text-white text-brand-charcoal/60 flex items-center justify-center transition-colors duration-300 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonials page ${i + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${i === page ? "w-6 h-1.5 bg-brand-terracotta" : "w-1.5 h-1.5 bg-brand-charcoal/15 hover:bg-brand-charcoal/30"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
