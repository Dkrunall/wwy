"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";
import { products } from "@/lib/products";

const categories = ["All", "Sodas", "Starters", "Storage", "Bundles"];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      {/* ── Hero ── */}
      <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-12 sm:pb-16 border-b border-brand-charcoal/5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 max-w-full">
          <div>
            <span className="text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
              This Week's Fermentation
            </span>
            <h1
              className="font-black text-brand-charcoal tracking-tighter leading-none"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
            >
              PROVISIONS.
            </h1>
            <p className="text-xs font-black tracking-[0.15em] uppercase text-brand-charcoal/25 mt-3">
              Made when ordered, not before.
            </p>
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <p className="text-sm font-bold text-brand-charcoal/40 max-w-xs leading-relaxed">
              WWY food is made with time, not shortcuts. Small batch. Slow-fermented. Honest ingredients.
            </p>
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/30">
              Orders taken via WhatsApp · Delivery Wed & Sat only
            </p>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 bg-brand-charcoal text-white hover:bg-brand-terracotta px-6 py-3 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-300 active:scale-95 w-fit shadow-md"
            >
              Order via WhatsApp
            </a>
          </div>
        </div>

        {/* Seasonal drop note */}
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/25 mt-6">
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
                  ? "bg-brand-charcoal text-white shadow-md"
                  : "bg-white border border-brand-charcoal/10 text-brand-charcoal/50 hover:border-brand-charcoal/30 hover:text-brand-charcoal"
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
            <ShoppingBag size={40} className="text-brand-charcoal/20" />
            <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/30">
              Nothing in this range yet.
            </p>
          </div>
        )}
      </section>

      {/* ── Bottom Banner ── */}
      <section className="w-full bg-brand-charcoal mx-0 px-4 sm:px-8 xl:px-16 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="font-black text-brand-oat tracking-tighter leading-none mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            FREE SHIPPING <span className="text-brand-terracotta">OVER ₹500.</span>
          </h3>
          <p className="text-brand-oat/40 font-bold text-sm">On all provisions. Delivered slowly, carefully.</p>
          <p className="text-brand-oat/20 font-bold text-xs mt-1 italic">Time is our main ingredient.</p>
        </div>
        <Link
          href="/cart"
          className="shrink-0 bg-brand-terracotta text-white hover:bg-brand-oat hover:text-brand-charcoal px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl active:scale-95 transition-all duration-300"
        >
          View Cart
        </Link>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.some(i => i.id === product.id);

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price, priceNum: product.priceNum, image: product.image, bgColor: product.bgColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-brand-charcoal/5 shadow-sm hover:shadow-xl transition-all duration-500">
      {/* Image — clickable */}
      <Link href={`/shop/${product.id}`} className="block">
        <div className={`relative w-full aspect-square ${product.bgColor} p-5 sm:p-8 flex items-center justify-center`}>
          {product.badge && (
            <span className="absolute top-4 left-4 z-10 text-[9px] font-black bg-brand-charcoal text-white px-3 py-1.5 rounded-full uppercase tracking-widest">
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
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 mb-1 block">
            {product.category}
          </span>
          <h3 className="font-black text-lg tracking-tight text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-xs font-bold text-brand-charcoal/40 mt-2 leading-relaxed line-clamp-2">
            {product.desc}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-charcoal/5">
          <span className="font-black text-brand-terracotta text-lg">{product.price}</span>
          <button
            onClick={handleAdd}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300 active:scale-95 shadow-sm ${
              added
                ? "bg-brand-olive text-white"
                : inCart
                ? "bg-brand-charcoal/10 text-brand-charcoal hover:bg-brand-charcoal hover:text-white"
                : "bg-brand-charcoal text-white hover:bg-brand-terracotta"
            }`}
          >
            {added ? <><Check size={11} /> Added</> : inCart ? "Add More" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
