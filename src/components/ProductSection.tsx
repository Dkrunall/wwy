"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { useCart } from "./CartContext";

gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    id: 1,
    name: "Wild Botanicals",
    category: "Signature Series",
    badge: "BEST SELLER",
    price: "₹180",
    priceNum: 180,
    image: "/p1.png",
    bgColor: "bg-[#FFDDC1]",
  },
  {
    id: 2,
    name: "Artisan Starter",
    category: "Baking Core",
    price: "₹450",
    priceNum: 450,
    image: "/p2.png",
    bgColor: "bg-[#D1E8E2]",
  },
  {
    id: 3,
    name: "Golden Fizz",
    category: "Probiotic Soda",
    price: "₹180",
    priceNum: 180,
    image: "/p3.png",
    bgColor: "bg-[#FCEEA7]",
  },
  {
    id: 4,
    name: "The Iron Tin",
    category: "Storage Tech",
    badge: "NEW",
    price: "₹850",
    priceNum: 850,
    image: "/p4.png",
    bgColor: "bg-[#E2D4E0]",
  },
  {
    id: 5,
    name: "Sampler Kit",
    category: "Bundle Drop",
    badge: "LIMITED",
    price: "₹1200",
    priceNum: 1200,
    image: "/p5.png",
    bgColor: "bg-[#FFDDC1]",
  },
];

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
      className="bg-brand-oat w-full relative z-20 flex flex-col justify-center overflow-hidden py-16 sm:py-20 lg:py-12 lg:min-h-screen"
    >
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl mb-8 sm:mb-12 flex-shrink-0">
        <div className="text-center lg:text-left">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            Shop The Range
          </span>
          <h2 className="font-black text-brand-charcoal tracking-tight leading-none"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            FERMENTED{" "}
            <br className="hidden sm:block" />
            WITH{" "}
            <span className="text-brand-terracotta">WILD ENERGY.</span>
          </h2>
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
                style={{ width: "clamp(240px, 75vw, 320px)" }}
              >
                <ProductCard product={product} />
              </div>
            ))}
            <div className="shrink-0 flex items-center justify-center px-6" style={{ width: "clamp(140px, 40vw, 200px)" }}>
              <button className="flex flex-col justify-center items-center gap-4 font-black text-brand-charcoal text-xs uppercase tracking-widest hover:text-brand-terracotta transition-colors group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-brand-charcoal/5 flex items-center justify-center group-hover:bg-brand-terracotta/10 group-hover:scale-110 transition-all duration-500 rotate-12 group-hover:rotate-0">
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

function ProductCard({ product }: { product: typeof products[0] }) {
  const { addItem } = useCart();

  return (
    <div className="product-card group flex flex-col h-full shrink-0 w-full lg:w-[28vw]">
      {/* Image Container */}
      <div className={`relative w-full aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] ${product.bgColor} overflow-hidden mb-4 sm:mb-6 p-6 sm:p-8 flex items-center justify-center border-4 border-transparent hover:border-brand-charcoal/5 transition-all duration-300 shadow-[inset_0_10px_30px_rgba(0,0,0,0.08)] group-hover:shadow-[inset_0_10px_30px_rgba(0,0,0,0.08),0_25px_50px_-12px_rgba(0,0,0,0.25)]`}>
        {product.badge && (
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
            <span className="text-[9px] sm:text-[10px] font-black bg-brand-charcoal text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-widest shadow-lg rotate-[-5deg] inline-block group-hover:rotate-0 transition-transform">
              {product.badge}
            </span>
          </div>
        )}

        <div className="relative w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-2 shadow-xl border-4 border-white/20">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center"
          />
        </div>

        <div className="absolute inset-x-0 bottom-6 sm:bottom-8 z-20 flex justify-center opacity-0 transform translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
          <button
            onClick={() => addItem({ id: product.id, name: product.name, price: product.price, priceNum: product.priceNum, image: product.image, bgColor: product.bgColor })}
            className="bg-brand-charcoal text-brand-oat hover:bg-brand-terracotta hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 active:scale-95 transition-all">
            Add to Cart
          </button>
        </div>
      </div>

      {/* Text Info */}
      <div className="flex flex-col items-center text-center px-2 sm:px-4">
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-charcoal/60 uppercase mb-1 sm:mb-2">
          {product.category}
        </span>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-charcoal tracking-tight mb-1 sm:mb-2">
          {product.name}
        </h3>
        <span className="font-black text-brand-terracotta text-base sm:text-lg">
          {product.price}
        </span>
      </div>
    </div>
  );
}

function BrowseAllCard() {
  return (
    <div className="shrink-0 w-[30vw] sm:w-[25vw] lg:w-[18vw] flex items-center justify-center p-6 sm:p-8">
      <button className="flex flex-col justify-center items-center gap-4 sm:gap-6 font-black text-brand-charcoal text-xs sm:text-sm uppercase tracking-widest hover:text-brand-terracotta transition-colors group">
        <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-brand-charcoal/5 flex items-center justify-center group-hover:bg-brand-terracotta/10 group-hover:scale-110 transition-all duration-500 rotate-12 group-hover:rotate-0">
          <ArrowUpRight size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-center">Browse Full<br />Collection</span>
      </button>
    </div>
  );
}
