"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { products, type Product } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger);

export default function ProductSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      const slider = containerRef.current;
      if (!slider) return;

      const getScrollAmount = () => -(slider.scrollWidth - window.innerWidth + 100);

      gsap.to(slider, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "center center",
          end: () => `+=${slider.scrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });

      gsap.fromTo(
        ".product-card",
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 1.5,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isDesktop]);

  return (
    <section
      ref={sectionRef}
      className="bg-brand-oat w-full relative z-20 flex flex-col justify-center lg:overflow-hidden py-12 sm:py-20 lg:py-12 lg:min-h-screen"
    >
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl mb-8 sm:mb-12 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-center lg:text-left">
          <div>
            <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              Shop The Range
            </span>
            <h2 className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]"
              style={{ fontSize: "clamp(2.5rem, 7.5vw, 5.2rem)" }}>
              Fermented <br className="hidden sm:block" />
              with <span className="text-brand-orange italic font-light">wild energy.</span>
            </h2>
          </div>
          <div className="flex flex-col items-center lg:items-end gap-4 lg:pb-2 max-w-xs lg:max-w-sm lg:ml-auto">
            <p className="text-sm sm:text-base md:text-lg font-bold text-brand-brown/60 leading-relaxed text-center lg:text-right">
              Small-batch ferments made when you order — never before. Slow time, honest ingredients.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-brand-brown text-white hover:bg-brand-orange
                px-7 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase
                transition-all duration-300 active:scale-95 shadow-md"
            >
              Browse All →
            </Link>
          </div>
        </div>
      </div>
 
      {/* Desktop: GSAP Horizontal Scroll */}
      {isDesktop && (
        <div
          ref={containerRef}
          className="flex gap-8 md:gap-12 px-[8vw] w-max flex-nowrap items-center will-change-transform"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          <BrowseAllCard />
        </div>
      )}
 
      {/* Mobile / Tablet: Native horizontal scroll */}
      {!isDesktop && (
        <div className="w-full overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex gap-4 sm:gap-6 px-4 sm:px-6 w-max">
            {products.map((product) => (
              <div
                key={product.id}
                className="shrink-0"
                style={{ width: "clamp(260px, 78vw, 320px)" }}
              >
                <ProductCard product={product} />
              </div>
            ))}
            <div className="shrink-0 flex items-center justify-center px-4 sm:px-6" style={{ width: "clamp(160px, 45vw, 200px)" }}>
              <button className="flex flex-col justify-center items-center gap-4 font-black text-brand-brown text-xs uppercase tracking-widest hover:text-brand-orange transition-colors group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-brand-brown/5 flex items-center justify-center group-hover:bg-brand-orange/10 group-hover:scale-110 transition-all duration-500 rotate-12 group-hover:rotate-0">
                  <ArrowUpRight size={28} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-center">Browse Full<br />Collection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
 
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card group flex flex-col h-full shrink-0 w-full lg:w-[22vw]">
      {/* Image Container — clickable */}
      <Link href={`/shop/${product.id}`} className="block">
        <div className={`relative w-full aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] ${product.bgColor} overflow-hidden mb-4 sm:mb-6 p-6 sm:p-8 flex items-center justify-center border-4 border-transparent hover:border-brand-brown/5 transition-all duration-300 shadow-[inset_0_10px_30px_rgba(0,0,0,0.08)] group-hover:shadow-[inset_0_10px_30px_rgba(0,0,0,0.08),0_25px_50px_-12px_rgba(0,0,0,0.25)]`}>
          {product.badge && (
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
              <span className="text-[9px] sm:text-[10px] font-black bg-brand-brown text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-widest shadow-lg rotate-[-5deg] inline-block group-hover:rotate-0 transition-transform">
                {product.badge}
              </span>
            </div>
          )}
 
          <div className="relative w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-2 shadow-xl border-4 border-white/20">
            <Image
              src={product.photo ?? product.image}
              alt={product.name}
              fill
              className="object-cover object-center"
            />
          </div>
        </div>
      </Link>
 
      {/* Text Info — clickable */}
      <Link href={`/shop/${product.id}`} className="flex flex-col items-center text-center px-2 sm:px-4 group/text">
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-brown/60 uppercase mb-1 sm:mb-2">
          {product.category}
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-normal text-brand-brown tracking-tight mb-1 sm:mb-2 group-hover/text:text-brand-orange transition-colors duration-200">
          {product.name}
        </h3>
        <span className="font-bold text-brand-orange text-base sm:text-lg">
          {product.price}
        </span>
      </Link>
    </div>
  );
}

function BrowseAllCard() {
  return (
    <div className="shrink-0 w-[30vw] sm:w-[25vw] lg:w-[18vw] flex items-center justify-center p-6 sm:p-8">
      <button className="flex flex-col justify-center items-center gap-4 sm:gap-6 font-black text-brand-brown text-xs sm:text-sm uppercase tracking-widest hover:text-brand-orange transition-colors group">
        <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-brand-brown/5 flex items-center justify-center group-hover:bg-brand-orange/10 group-hover:scale-110 transition-all duration-500 rotate-12 group-hover:rotate-0">
          <ArrowUpRight size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-center">Browse Full<br />Collection</span>
      </button>
    </div>
  );
}
