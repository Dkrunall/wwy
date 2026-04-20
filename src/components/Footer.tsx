"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-white pt-16 sm:pt-24 md:pt-32 pb-6 sm:pb-8 overflow-hidden relative z-30 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[6rem] -mt-8 sm:-mt-12 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] border-t border-brand-charcoal/10">

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">

        {/* Footer Grid */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start gap-10 sm:gap-12 mb-12 sm:mb-20 md:mb-32">

          {/* CTA & Description */}
          <div className="flex flex-col gap-4 sm:gap-6 md:w-1/3">
            <h3
              className="font-black text-brand-oat tracking-tighter leading-none"
              style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}
            >
              FERMENT YOUR <br /> <span className="text-brand-terracotta">ROUTINE.</span>
            </h3>
            <p className="text-brand-oat/60 font-bold text-xs sm:text-sm max-w-xs">
              Authentic natural sodas and wild sourdough starters delivered raw to your door.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10 sm:gap-16 text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-brand-oat/60">
            <div className="flex flex-col gap-4 sm:gap-6">
              <span className="text-brand-terracotta mb-1">Shop</span>
              <Link href="#" className="hover:text-white transition-colors">All Products</Link>
              <Link href="#" className="hover:text-white transition-colors">Botanical Sodas</Link>
              <Link href="#" className="hover:text-white transition-colors">Wild Starter</Link>
            </div>
            <div className="flex flex-col gap-4 sm:gap-6">
              <span className="text-brand-terracotta mb-1">Company</span>
              <Link href="#" className="hover:text-white transition-colors">Our Story</Link>
              <Link href="#" className="hover:text-white transition-colors">Journal</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

        </div>

        {/* Bottom Legal */}
        <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-brand-oat/40 mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div className="flex gap-6 sm:gap-8 border border-white/10 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full">
            <Link href="#" className="hover:text-brand-terracotta transition-colors">IG</Link>
            <Link href="#" className="hover:text-brand-terracotta transition-colors">TT</Link>
            <Link href="#" className="hover:text-brand-terracotta transition-colors">PIN</Link>
          </div>
          <div className="flex justify-center flex-1 text-center">
            <span className="opacity-50">© 2026 WILD WILD YEAST. All Rights Reserved.</span>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <Link href="#" className="hover:text-brand-terracotta transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-brand-terracotta transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Gigantic bottom text */}
      <div className="w-full overflow-hidden relative z-10 px-4 mt-4 sm:mt-8 mb-2">
        <h1
          className="font-black text-brand-oat/5 tracking-tighter whitespace-nowrap select-none drop-shadow-xl text-center"
          style={{ fontSize: "clamp(3rem, 14vw, 12rem)", lineHeight: 0.75 }}
        >
          WILD WILD YEAST
        </h1>
      </div>

    </footer>
  );
}
