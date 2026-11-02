"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import PincodeCheck from "@/components/PincodeCheck";
import { BUSINESS } from "@/lib/business";
import { cutoffRuleText, deliveryDaysShort } from "@/lib/schedule";
import { FLAVOURS } from "@/lib/flavours";

const CATEGORY_BLURBS: Record<string, { text: string; cta: string }> = {
  "Crafted Bakes": { text: "Naturally fermented sourdough and flavour-led loaves for everyday eating and occasional overthinking about what to toast first.", cta: "Shop bread" },
  "Be-Sides": { text: "Cookies, biscotti and crackers for the snack drawer, the coffee break and the board that needs one more thing.", cta: "Shop snacks" },
};

const categories = ["All", "Crafted Bakes", "Be-Sides"];

export default function ShopClient({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />

      <PageBanner
        eyebrow="Welcome to the Wild Wild Yeast shop"
        title="The good stuff starts here."
        intro="From slow-fermented sourdough to crunchy sides. We bake twice a week and deliver straight to your doorstep."
        image="/product_img/4-bloom.jpg"
      />

      {/* ── Ordering info ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4 sm:gap-5">
          <div className="bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-8 flex flex-col gap-3">
            <span className="text-brand-orange text-[10px] font-black tracking-[0.2em] uppercase">Made to order</span>
            <p className="font-serif text-xl sm:text-2xl text-brand-brown tracking-tight leading-snug">
              Delivery {deliveryDaysShort()} only. Orders close {cutoffRuleText()}.
            </p>
            <p className="text-sm font-bold text-brand-brown/50 leading-relaxed">
              New flavours go up every week on Instagram, @{BUSINESS.instagramHandle}.
            </p>
            <div className="mt-1">
              <PincodeCheck />
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-8 flex flex-col gap-3">
            <span className="text-brand-orange text-[10px] font-black tracking-[0.2em] uppercase">Flavours we bake</span>
            <div className="flex flex-wrap gap-2">
              {FLAVOURS.map((f) => (
                <span key={f} className="px-3.5 py-1.5 rounded-full bg-brand-oat border border-brand-brown/10 text-[11px] font-black tracking-wide text-brand-brown/70">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-brand-brown/40">Flavours rotate weekly. Check Instagram for this week&apos;s batch.</p>
          </div>
        </div>
      </section>

      {/* ── Filter ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-10 sm:pt-14">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif font-normal text-brand-brown text-2xl sm:text-4xl tracking-tight mb-2">Find your next favourite.</h2>
          <p className="text-sm font-bold text-brand-brown/50 leading-relaxed max-w-2xl">
            Try something new and see what happens when good ingredients meet a curious mind.
          </p>
          <div className="flex gap-2 sm:gap-3 mt-6 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-black tracking-[0.18em] uppercase transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-brand-brown text-white border-brand-brown"
                    : "bg-white text-brand-brown/60 border-brand-brown/10 hover:text-brand-brown hover:border-brand-brown/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {CATEGORY_BLURBS[activeCategory] && (
            <p className="mt-4 text-sm font-bold text-brand-brown/55 max-w-2xl leading-relaxed">
              {CATEGORY_BLURBS[activeCategory].text}
            </p>
          )}
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-8 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
 
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <ShoppingBag size={40} className="text-brand-brown/20" />
            <h3 className="font-serif font-normal text-2xl text-brand-brown">Nothing in this batch. Yet.</h3>
            <p className="text-sm font-bold text-brand-brown/40 max-w-sm">
              This collection is between batches. Check back soon for the next round of good things.
            </p>
            <button
              onClick={() => setActiveCategory("All")}
              className="mt-2 inline-flex bg-brand-brown text-white hover:bg-brand-orange px-6 py-3 rounded-full text-[10px] font-black tracking-[0.18em] uppercase transition-colors"
            >
              Explore other categories
            </button>
          </div>
        )}
      </section>
 
      {/* ── Bottom Banner ── */}
      <section className="w-full bg-brand-brown mx-0 px-4 sm:px-8 xl:px-16 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Order <span className="text-brand-orange italic font-light">online.</span>
          </h3>
          <p className="text-brand-oat/40 font-bold text-sm">Browse, add to cart, pay securely. We bake and deliver.</p>
          <p className="text-brand-oat/40 font-bold text-xs mt-1 italic">Delivery {deliveryDaysShort()} only.</p>
        </div>
        <Link
          href="/order"
          className="shrink-0 inline-flex items-center gap-2 bg-brand-orange text-white hover:bg-brand-oat hover:text-brand-brown px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl active:scale-95 transition-all duration-300"
        >
          Order Now
        </Link>
      </section>
 
      <Footer />
    </main>
  );
}
 
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-brand-brown/5 shadow-sm hover:shadow-xl transition-all duration-500">
      {/* Image */}
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

      {/* Info */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
        <div>
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-brown/40 mb-1 block">
            {product.category}
          </span>
          <h3 className="font-serif font-normal text-xl tracking-tight text-brand-brown transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-xs font-bold text-brand-brown/40 mt-2 leading-relaxed line-clamp-2">
            {product.desc}
          </p>
        </div>
 
        <details className="group/details text-xs font-bold text-brand-brown/60">
          <summary className="cursor-pointer list-none text-[10px] font-black tracking-[0.18em] uppercase text-brand-brown/50 hover:text-brand-orange">
            Product details
          </summary>
          <dl className="mt-3 flex flex-col gap-1.5 leading-relaxed">
            <div><dt className="inline font-black text-brand-brown/80">MRP: </dt><dd className="inline">{product.price} (incl. all taxes)</dd></div>
            <div><dt className="inline font-black text-brand-brown/80">Type: </dt><dd className="inline">Vegetarian</dd></div>
            {product.declarations?.ingredients && <div><dt className="inline font-black text-brand-brown/80">Ingredients: </dt><dd className="inline">{product.declarations.ingredients}</dd></div>}
            {product.declarations?.allergens && <div><dt className="inline font-black text-brand-brown/80">Allergens: </dt><dd className="inline">{product.declarations.allergens}</dd></div>}
            {product.declarations?.netQuantity && <div><dt className="inline font-black text-brand-brown/80">Net quantity: </dt><dd className="inline">{product.declarations.netQuantity}</dd></div>}
            {product.declarations?.bestBefore && <div><dt className="inline font-black text-brand-brown/80">Best before: </dt><dd className="inline">{product.declarations.bestBefore}</dd></div>}
            {product.declarations?.storage && <div><dt className="inline font-black text-brand-brown/80">Storage: </dt><dd className="inline">{product.declarations.storage}</dd></div>}
            {product.declarations?.manufacturer && (
              <div><dt className="inline font-black text-brand-brown/80">Manufactured by: </dt><dd className="inline">{product.declarations.manufacturer.name}, {product.declarations.manufacturer.address}. FSSAI {product.declarations.manufacturer.fssai}</dd></div>
            )}
            <ul className="list-disc pl-4 mt-1">
              {product.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </dl>
        </details>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-brown/5">
          <span className="font-black text-brand-orange text-lg">{product.price}</span>
          <Link
            href="/order"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-brand-brown text-white hover:bg-brand-orange transition-all duration-300 active:scale-95 shadow-sm"
          >
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}
