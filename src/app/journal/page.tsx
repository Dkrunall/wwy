"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

const categories = ["All", "Process", "Ingredients", "Culture", "Recipes"];

const posts = [
  {
    id: 1,
    category: "Process",
    title: "Why Wild Yeast Behaves Differently Every Time",
    excerpt: "Wild fermentation is never consistent in the way commercial yeast is. That's not a flaw — it's the whole point. A note on unpredictability and character.",
    date: "14 Apr 2026",
    readTime: "5 min",
    image: "/f1.png",
    featured: true,
  },
  {
    id: 2,
    category: "Ingredients",
    title: "Sourcing Hibiscus: What the Farm Tells the Bottle",
    excerpt: "The hibiscus in Wild Botanicals comes from a single cooperative in Rajasthan. Here's why that matters, and what it changes in the ferment.",
    date: "07 Apr 2026",
    readTime: "4 min",
    image: "/f2.png",
    featured: false,
  },
  {
    id: 3,
    category: "Culture",
    title: "The Century-Old Starter: A Brief History",
    excerpt: "Our sourdough culture has been passed down across three generations. What makes an old starter different from a new one — and why it takes time to understand.",
    date: "28 Mar 2026",
    readTime: "6 min",
    image: "/p2.png",
    featured: false,
  },
  {
    id: 4,
    category: "Recipes",
    title: "Using Golden Fizz as a Cooking Base",
    excerpt: "Beyond the glass. Turmeric ferment as a braising liquid, a dressing acid, a glaze. Three ways to use Golden Fizz in the kitchen.",
    date: "19 Mar 2026",
    readTime: "3 min",
    image: "/p3.png",
    featured: false,
  },
  {
    id: 5,
    category: "Process",
    title: "Temperature, Time, and the Art of the Long Ferment",
    excerpt: "Every degree changes the outcome. A practical guide to understanding how ambient temperature shapes the character of a slow ferment.",
    date: "08 Mar 2026",
    readTime: "7 min",
    image: "/p1.png",
    featured: false,
  },
  {
    id: 6,
    category: "Culture",
    title: "What 'Living Food' Actually Means",
    excerpt: "The phrase gets used often. Here is what it means specifically — biologically, culinarily, and in the context of what we make.",
    date: "22 Feb 2026",
    readTime: "5 min",
    image: "/p5.png",
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  Process:     "bg-brand-terracotta/10 text-brand-terracotta",
  Ingredients: "bg-brand-gold/20 text-amber-700",
  Culture:     "bg-brand-charcoal/10 text-brand-charcoal",
  Recipes:     "bg-[#D1E8E2] text-brand-olive",
};

export default function JournalPage() {
  const [activeCategory, setActiveCategory] = useState("All");

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
          <h2 className="font-black text-white/[0.03] tracking-tighter"
            style={{ fontSize: "clamp(10rem, 25vw, 26rem)", lineHeight: 0.85 }}>
            NOTES
          </h2>
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-6 block">
            The Journal
          </span>
          <h1
            className="font-black text-brand-oat tracking-tighter leading-[0.85] mb-6"
            style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
          >
            NOTES ON <br />
            <span className="text-brand-gold">FERMENTATION.</span>
          </h1>
          <p className="text-brand-oat/40 font-bold text-sm sm:text-base leading-relaxed max-w-lg">
            On process, ingredients, culture, and what happens when you slow everything down.
          </p>
        </div>
      </section>

      {/* ── Featured Post ── */}
      {featured && (
        <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16 border-b border-brand-charcoal/5">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-center group cursor-pointer">
            <div className="w-full lg:w-1/2 rounded-[2rem] sm:rounded-[3rem] overflow-hidden aspect-[4/3] relative shadow-xl">
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
                className="font-black text-brand-charcoal tracking-tighter leading-[0.9] mb-5 group-hover:text-brand-terracotta transition-colors duration-300"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
              >
                {featured.title}
              </h2>
              <p className="text-sm font-bold text-brand-charcoal/50 leading-relaxed mb-8 max-w-lg">
                {featured.excerpt}
              </p>
              <button className="inline-flex items-center gap-3 bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 shadow-md">
                Read the Note
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Filter + Grid ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">

        {/* Filter tabs */}
        <div className="flex gap-2 sm:gap-3 mb-10 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 sm:px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-200 active:scale-95 ${
                activeCategory === cat
                  ? "bg-brand-charcoal text-white shadow-md"
                  : "bg-white border border-brand-charcoal/10 text-brand-charcoal/50 hover:border-brand-charcoal/30 hover:text-brand-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredRest.map(post => (
            <article
              key={post.id}
              className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-brand-charcoal/5 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
            >
              {/* Image */}
              <div className="relative w-full aspect-[3/2] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-brand-charcoal/10 group-hover:bg-brand-charcoal/0 transition-colors duration-500" />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                  <span className="text-[10px] font-bold text-brand-charcoal/30">{post.readTime} read</span>
                </div>

                <h3 className="font-black text-base sm:text-lg tracking-tight text-brand-charcoal leading-[1.1] group-hover:text-brand-terracotta transition-colors duration-300">
                  {post.title}
                </h3>
                <p className="text-xs font-bold text-brand-charcoal/40 leading-relaxed line-clamp-2 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-brand-charcoal/5 mt-auto">
                  <span className="text-[10px] font-bold text-brand-charcoal/30">{post.date}</span>
                  <span className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta group-hover:underline">
                    Read →
                  </span>
                </div>
              </div>
            </article>
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
        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-4 block">
          Stay in the Culture
        </span>
        <h3 className="font-black text-brand-charcoal tracking-tighter leading-[0.9] mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          NEW NOTES, <span className="text-brand-terracotta">WHEN READY.</span>
        </h3>
        <p className="text-sm font-bold text-brand-charcoal/40 max-w-md mx-auto mb-8 leading-relaxed">
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
