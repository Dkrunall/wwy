"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";

const categories = ["All", "Sodas", "Starters", "Storage", "Bundles"];

const products = [
  {
    id: 1, name: "Wild Botanicals", category: "Sodas",
    badge: "BEST SELLER", price: "₹180", priceNum: 180,
    image: "/p1.png", bgColor: "bg-[#FFDDC1]",
    desc: "Hibiscus and wild ginger. Slow-fermented over 72 hours. Each bottle carries its own character.",
  },
  {
    id: 2, name: "Artisan Starter", category: "Starters",
    price: "₹450", priceNum: 450,
    image: "/p2.png", bgColor: "bg-[#D1E8E2]",
    desc: "A living, naturally leavened sourdough culture. Built on a century-old strain. Ready to bake.",
  },
  {
    id: 3, name: "Golden Fizz", category: "Sodas",
    price: "₹180", priceNum: 180,
    image: "/p3.png", bgColor: "bg-[#FCEEA7]",
    desc: "Turmeric, green cardamom, raw cane. Probiotic. Fermented. Alive in every sip.",
  },
  {
    id: 4, name: "The Iron Tin", category: "Storage",
    badge: "NEW", price: "₹850", priceNum: 850,
    image: "/p4.png", bgColor: "bg-[#E2D4E0]",
    desc: "Designed to keep your starter alive. Airtight. Measured. Built for the long ferment.",
  },
  {
    id: 5, name: "Sampler Kit", category: "Bundles",
    badge: "LIMITED", price: "₹1,200", priceNum: 1200,
    image: "/p5.png", bgColor: "bg-[#FFDDC1]",
    desc: "Everything to begin. Two sodas, one starter, one tin. A complete introduction to living food.",
  },
];

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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 max-w-full">
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-4 block">
              Shop the Range
            </span>
            <h1
              className="font-black text-brand-charcoal tracking-tighter leading-none"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
            >
              PROVISIONS.
            </h1>
          </div>
          <p className="text-sm font-bold text-brand-charcoal/40 max-w-xs leading-relaxed pb-2">
            Small batch. Slow-fermented. Each product made with time and honest ingredients.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 sm:gap-3 mt-10 flex-wrap">
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
      {/* Image */}
      <div className={`relative w-full aspect-square ${product.bgColor} p-8 flex items-center justify-center`}>
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 text-[9px] font-black bg-brand-charcoal text-white px-3 py-1.5 rounded-full uppercase tracking-widest">
            {product.badge}
          </span>
        )}
        <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-110">
          <Image src={product.image} alt={product.name} fill className="object-contain mix-blend-multiply drop-shadow-xl" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
        <div>
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 mb-1 block">
            {product.category}
          </span>
          <h3 className="font-black text-lg tracking-tight text-brand-charcoal">{product.name}</h3>
          <p className="text-xs font-bold text-brand-charcoal/40 mt-2 leading-relaxed line-clamp-2">
            {product.desc}
          </p>
        </div>

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
