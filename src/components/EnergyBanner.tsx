"use client";
 
import React from "react";
import Image from "next/image";
import Link from "next/link";
 
export default function EnergyBanner() {
  return (
    <section
      className="w-full bg-brand-brown py-20 sm:py-32 relative overflow-hidden flex flex-col items-center justify-center rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem] -mt-8 sm:-mt-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-10"
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
 
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-gold/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-orange/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
 
      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center w-full max-w-[1200px]">
 
        {/* Main Heading */}
        <h3
          className="font-serif font-normal text-brand-oat text-center leading-[1.05] mb-12 sm:mb-20 tracking-tight drop-shadow-2xl relative z-30 px-4"
          style={{ fontSize: "clamp(2.8rem, 7.5vw, 6.2rem)" }}
        >
          Alive in{" "}
          <span className="italic font-light text-brand-gold relative inline-block">
            every batch.
            <svg className="absolute -bottom-3 sm:-bottom-4 left-0 w-full h-6 sm:h-8 text-brand-orange opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
          </span>
        </h3>
 
        {/* Beautiful Editorial Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
          
          {/* Card 1: Soda */}
          <Link href="/shop" className="group flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-500 cursor-pointer shadow-lg">
            <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-brand-oat/5">
              <Image src="/p3.png" alt="Can" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-gold uppercase mb-1">PROBIOTIC SODA</span>
            <h4 className="font-serif font-normal text-brand-oat text-xl sm:text-2xl tracking-tight leading-tight group-hover:text-brand-gold transition-colors">Botanical Soda Series</h4>
            <p className="text-xs text-brand-oat/60 font-bold leading-relaxed mt-2">Naturally fermented botanicals brewed slow over 72 hours. Alive in every single sip.</p>
          </Link>
 
          {/* Card 2: Sampler Set */}
          <Link href="/shop" className="group flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-[2.2rem] p-6 sm:p-8 hover:bg-white/[0.15] hover:border-white/30 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-500 cursor-pointer shadow-2xl relative">
            <span className="absolute top-4 right-4 bg-brand-gold text-brand-brown text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest rotate-6 z-20">LIMITED</span>
            <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-brand-oat/5">
              <Image src="/p5.png" alt="Bundle" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-gold uppercase mb-1">SIGNATURE BUNDLES</span>
            <h4 className="font-serif font-normal text-brand-oat text-xl sm:text-2xl tracking-tight leading-tight group-hover:text-brand-gold transition-colors">The Starter Sampler Kit</h4>
            <p className="text-xs text-brand-oat/60 font-bold leading-relaxed mt-2">A complete curated kit featuring our daily-fed sourdough cultures and signature soda blend.</p>
          </Link>
 
          {/* Card 3: Sourdough */}
          <Link href="/shop" className="group flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-500 cursor-pointer shadow-lg">
            <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-brand-oat/5">
              <Image src="/p1.png" alt="Sourdough" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-gold uppercase mb-1">ARTISAN BREAD</span>
            <h4 className="font-serif font-normal text-brand-oat text-xl sm:text-2xl tracking-tight leading-tight group-hover:text-brand-gold transition-colors">Classic Sourdough Loaf</h4>
            <p className="text-xs text-brand-oat/60 font-bold leading-relaxed mt-2">Wild fermented with only flour, water, and sea salt. Baked fresh to order only.</p>
          </Link>
 
        </div>
 
        {/* CTA Button */}
        <Link href="/shop" className="mt-12 sm:mt-20 inline-flex bg-brand-oat text-brand-brown rounded-full px-8 sm:px-16 py-4 sm:py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-brand-orange hover:text-white hover:scale-105 transition-all duration-500 shadow-xl whitespace-nowrap z-30">
          Shop the Set
        </Link>
 
      </div>
    </section>
  );
}
