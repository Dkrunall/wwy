"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { ShoppingBag } from "lucide-react";
import { products } from "@/lib/products";

const WA_LINK = "https://wa.me/919999999999";
const categories = ["All", "Sodas", "Starters", "Storage", "Bundles"];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />

      {/* ── Hero ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-12 sm:pb-16 border-b border-brand-brown/5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 max-w-full">
          <div>
            <span className="text-brand-orange text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              This Week's Fermentation
            </span>
            <h1
              className="font-black text-brand-brown tracking-tighter leading-none"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
            >
              PROVISIONS.
            </h1>
            <p className="text-xs font-black tracking-[0.15em] uppercase text-brand-brown/25 mt-3">
              Made when ordered, not before.
            </p>
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <p className="text-sm font-bold text-brand-brown/40 max-w-xs leading-relaxed">
              WWY food is made with time, not shortcuts. Small batch. Slow-fermented. Honest ingredients.
            </p>
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-brown/30">
              Orders taken via WhatsApp · Delivery Wed & Sat only
            </p>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 bg-brand-brown text-white hover:bg-brand-orange px-6 py-3 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-300 active:scale-95 w-fit shadow-md"
            >
              <WhatsAppIcon size={13} />
              Order via WhatsApp
            </a>
          </div>
        </div>

        {/* Seasonal drop note */}
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/25 mt-6">
          Seasonal drops announced weekly — follow the journal to stay ahead.
        </p>

        {/* Category Filter */}
        <div className="flex gap-2 sm:gap-3 mt-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 sm:px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-200 active:scale-95 ${
                activeCategory === cat
                  ? "bg-brand-brown text-white shadow-md"
                  : "bg-white border border-brand-brown/10 text-brand-brown/50 hover:border-brand-brown/30 hover:text-brand-brown"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <ShoppingBag size={40} className="text-brand-brown/20" />
            <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-brown/30">
              Nothing in this range yet.
            </p>
          </div>
        )}
      </section>

      {/* ── Bottom Banner ── */}
      <section className="w-full bg-brand-brown mx-0 px-4 sm:px-8 xl:px-16 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="font-black text-brand-oat tracking-tighter leading-none mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            ORDER VIA <span className="text-brand-orange">WHATSAPP.</span>
          </h3>
          <p className="text-brand-oat/40 font-bold text-sm">Tell us what you want. We'll confirm and deliver.</p>
          <p className="text-brand-oat/20 font-bold text-xs mt-1 italic">Delivery Wed &amp; Sat only.</p>
        </div>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 bg-brand-orange text-white hover:bg-brand-oat hover:text-brand-brown px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl active:scale-95 transition-all duration-300"
        >
          <WhatsAppIcon size={13} />
          Order Now
        </a>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product }: { product: typeof products[0] }) {
  return (
    <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-brand-brown/5 shadow-sm hover:shadow-xl transition-all duration-500">
      {/* Image — clickable */}
      <Link href={`/shop/${product.id}`} className="block">
        <div className={`relative w-full aspect-square ${product.bgColor} p-5 sm:p-8 flex items-center justify-center`}>
          {product.badge && (
            <span className="absolute top-4 left-4 z-10 text-[9px] font-black bg-brand-brown text-white px-3 py-1.5 rounded-full uppercase tracking-widest">
              {product.badge}
            </span>
          )}
          <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-110">
            <Image src={product.image} alt={product.name} fill className="object-contain mix-blend-multiply drop-shadow-xl" />
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
        <Link href={`/shop/${product.id}`} className="block">
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-brown/40 mb-1 block">
            {product.category}
          </span>
          <h3 className="font-black text-lg tracking-tight text-brand-brown group-hover:text-brand-orange transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-xs font-bold text-brand-brown/40 mt-2 leading-relaxed line-clamp-2">
            {product.desc}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-brown/5">
          <span className="font-black text-brand-orange text-lg">{product.price}</span>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-brand-brown text-white hover:bg-brand-orange transition-all duration-300 active:scale-95 shadow-sm"
          >
            <WhatsAppIcon size={11} />
            Order Now
          </a>
        </div>
      </div>
    </div>
  );
}
