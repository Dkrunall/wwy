"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { posts } from "@/lib/journal";
 
const categories = ["All", "Process", "Ingredients", "Culture", "Recipes"];
 
const categoryColors: Record<string, string> = {
  Process:     "bg-brand-terracotta/10 text-brand-terracotta",
  Ingredients: "bg-brand-gold/20 text-amber-700",
  Culture:     "bg-brand-charcoal/10 text-brand-charcoal",
  Recipes:     "bg-[#D1E8E2] text-brand-olive",
};
 
export default function JournalPage() {
  const [activeCategory, setActiveCategory] = useState("All");
 
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
 
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    isDragging.current = false;
    dragStartPos.current = { x: e.pageX, y: e.pageY };
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftVal.current = scrollRef.current.scrollLeft;
  };
 
  const handleMouseLeave = () => {
    isDown.current = false;
  };
 
  const handleMouseUp = () => {
    isDown.current = false;
  };
 
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
 
    if (Math.abs(e.pageX - dragStartPos.current.x) > 5) {
      isDragging.current = true;
    }
 
    e.preventDefault();
    scrollRef.current.scrollLeft = scrollLeftVal.current - walk;
  };
 
  const featured = posts.find(p => p.featured);
  const rest = posts.filter(p => !p.featured);
  const filteredRest = activeCategory === "All"
    ? rest
    : rest.filter(p => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      {/* ── Hero ── */}
      <section className="w-full bg-brand-charcoal px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-16 sm:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 blur-[140px] rounded-full pointer-events-none" />
 
        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden">
          <h2 className="font-serif font-normal text-white/[0.03] tracking-tighter"
            style={{ fontSize: "clamp(10rem, 25vw, 26rem)", lineHeight: 0.85 }}>
            NOTES
          </h2>
        </div>
 
        <div className="relative z-10 max-w-2xl">
          <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
            The Journal
          </span>
          <h1
            className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05] mb-6"
            style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}
          >
            Notes on <br />
            <span className="text-brand-gold italic">fermentation.</span>
          </h1>
          <p className="text-brand-oat/40 font-bold text-sm sm:text-base leading-relaxed max-w-lg">
            On process, ingredients, culture, and what happens when you slow everything down.
          </p>
        </div>
      </section>
 
      {/* ── Featured Post ── */}
      {featured && (
        <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16 border-b border-brand-charcoal/5">
          <Link href={`/journal/${featured.id}`} className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-center group">
            <div className="w-full lg:w-1/2 rounded-[2rem] sm:rounded-[3rem] overflow-hidden aspect-[3/2] sm:aspect-[4/3] relative shadow-xl">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-brand-charcoal/20 group-hover:bg-brand-charcoal/10 transition-colors duration-500" />
              <span className="absolute top-5 left-5 bg-brand-terracotta text-white text-[9px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
                Featured
              </span>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="flex items-center gap-3 mb-5">
                <span className={`text-[9px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full ${categoryColors[featured.category]}`}>
                  {featured.category}
                </span>
                <span className="text-[10px] font-bold text-brand-charcoal/30">{featured.date}</span>
                <span className="text-[10px] font-bold text-brand-charcoal/30">· {featured.readTime} read</span>
              </div>
              <h2
                className="font-serif font-normal text-brand-charcoal tracking-tight leading-[1.1] mb-5 group-hover:text-brand-terracotta transition-colors duration-300"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
              >
                {featured.title}
              </h2>
              <p className="text-sm sm:text-base md:text-lg font-bold text-brand-charcoal/50 leading-relaxed mb-8 max-w-lg">
                {featured.excerpt}
              </p>
              <span className="inline-flex items-center gap-3 bg-brand-charcoal text-white group-hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-md">
                Read the Note
              </span>
            </div>
          </Link>
        </section>
      )}
 
      {/* ── Filter + Grid ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">
 
        {/* Filter tabs */}
        <div className="flex gap-6 sm:gap-8 mb-12 flex-wrap border-b border-brand-charcoal/10 pb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-black tracking-[0.18em] uppercase transition-all duration-200 relative pb-4 -mb-4 ${
                activeCategory === cat
                  ? "text-brand-charcoal font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-orange"
                  : "text-brand-charcoal/40 hover:text-brand-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
 
        {/* Horizontal Card Row */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 select-none cursor-grab active:cursor-grabbing"
        >
          {filteredRest.map(post => (
            <Link
              key={post.id}
              href={`/journal/${post.id}`}
              onClick={(e) => {
                if (isDragging.current) {
                  e.preventDefault();
                }
              }}
              draggable={false}
              className="group flex flex-col min-w-[280px] sm:min-w-[340px] md:min-w-[360px] bg-white rounded-[2rem] overflow-hidden border border-brand-charcoal/5 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5"
            >
              {/* Image */}
              <div className="relative w-full aspect-[1.6/1] rounded-[1.5rem] overflow-hidden mb-4 pointer-events-none">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-brand-charcoal/5 group-hover:opacity-0 transition-opacity duration-500" />
              </div>
 
              {/* Content */}
              <div className="flex flex-col flex-1 gap-2.5 pointer-events-none">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-[0.12em] uppercase text-brand-orange">
                    {post.category}
                  </span>
                  <span className="text-brand-charcoal/20 text-[10px]">|</span>
                  <span className="text-[10px] font-bold text-brand-charcoal/40">{post.readTime} read</span>
                </div>
 
                <h3 className="font-serif font-normal text-lg sm:text-xl tracking-tight text-brand-charcoal leading-[1.25] group-hover:text-brand-orange transition-colors duration-300">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-brand-charcoal/50 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-brand-charcoal/5 mt-auto">
                  <span className="text-[10px] font-bold text-brand-charcoal/30">{post.date}</span>
                  <span className="text-[10px] font-black tracking-[0.12em] uppercase text-brand-orange">
                    Read Note →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
 
        {filteredRest.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/30">
              Nothing filed here yet.
            </p>
          </div>
        )}
      </section>
 
      {/* ── Newsletter CTA ── */}
      <section className="w-full bg-brand-oat border-t border-brand-charcoal/5 px-4 sm:px-8 xl:px-16 py-16 sm:py-20 text-center">
        <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
          Stay in the Culture
        </span>
        <h3 className="font-serif font-normal text-brand-charcoal tracking-tight leading-[1.05] mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          New notes, <span className="text-brand-terracotta italic font-light">when ready.</span>
        </h3>
        <p className="text-sm sm:text-base md:text-lg font-bold text-brand-charcoal/40 max-w-md mx-auto mb-8 leading-relaxed">
          Notes on fermentation, small-batch arrivals, and what's slow-fermenting right now.
        </p>
        <Link
          href="/#newsletter"
          className="inline-block bg-brand-charcoal text-white hover:bg-brand-terracotta px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-md transition-all duration-300 active:scale-95"
        >
          Subscribe
        </Link>
      </section>

      <Footer />
    </main>
  );
}
