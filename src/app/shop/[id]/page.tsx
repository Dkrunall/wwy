"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ArrowLeft, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";
import { getProduct, products } from "@/lib/products";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const id = Number(params.id);
  const product = getProduct(id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      priceNum: product.priceNum,
      image: product.image,
      bgColor: product.bgColor,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-6 px-5">
        <p className="font-black text-brand-charcoal/30 tracking-tighter" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>
          Product not found.
        </p>
        <Link
          href="/shop"
          className="bg-brand-charcoal text-white font-black text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-brand-terracotta transition-colors duration-300"
        >
          ← Back to Shop
        </Link>
      </main>
    );
  }

  const inCart = items.some((i) => i.id === product.id);
  const cartQty = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const related = products.filter((p) => p.id !== product.id);

  /* split the long description at the first sentence for pull-quote treatment */
  const firstStop = product.longDesc.indexOf(". ") + 1;
  const pullQuote = product.longDesc.slice(0, firstStop).trim();
  const restDesc = product.longDesc.slice(firstStop).trim();

  return (
    <main className="min-h-screen bg-brand-oat overflow-x-hidden">
      <Navbar />
      <CartDrawer />

      {/* ── HERO — full-bleed split ───────────────────────────── */}
      <section className="w-full min-h-screen flex flex-col lg:flex-row">

        {/* LEFT — image panel, bleeds to edge */}
        <div className={`relative w-full lg:w-1/2 ${product.bgColor} flex items-center justify-center
          pt-28 sm:pt-32 lg:pt-0 pb-8 lg:pb-0
          min-h-[60vw] sm:min-h-[55vw] lg:min-h-screen`}>

          {/* Back button overlay */}
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-5 sm:top-8 sm:left-8 z-20 flex items-center gap-2
              text-brand-charcoal/50 hover:text-brand-charcoal transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase">Shop</span>
          </button>

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-6 right-5 sm:top-8 sm:right-8 z-20
              text-[9px] font-black bg-brand-charcoal text-white
              px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              {product.badge}
            </span>
          )}

          {/* Product image */}
          <div className="relative w-[62%] sm:w-[55%] lg:w-[58%] aspect-[3/4] drop-shadow-2xl">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain mix-blend-multiply"
              priority
            />
          </div>

          {/* Subtle category watermark */}
          <p
            className="absolute bottom-6 right-6 font-black text-brand-charcoal/[0.07] tracking-tighter leading-none select-none pointer-events-none uppercase"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            {product.category}
          </p>
        </div>

        {/* RIGHT — info panel */}
        <div className="w-full lg:w-1/2 bg-brand-oat flex items-center">
          <div className="w-full px-6 sm:px-10 xl:px-16 py-10 lg:py-16 flex flex-col gap-7 max-w-xl lg:max-w-none" ref={heroRef}>

            {/* Category + name */}
            <div>
              <span className="text-brand-terracotta text-xs font-black tracking-[0.25em] uppercase mb-3 block">
                {product.category}
              </span>
              <h1
                className="font-black text-brand-charcoal tracking-tighter leading-[0.88]"
                style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
              >
                {product.name.toUpperCase()}
              </h1>
            </div>

            {/* Short desc */}
            <p className="text-sm sm:text-base font-bold text-brand-charcoal/50 leading-relaxed max-w-sm lg:max-w-md">
              {product.desc}
            </p>

            {/* Price */}
            <div className="flex items-center gap-5">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30 mb-1">Price</p>
                <p
                  className="font-black text-brand-charcoal leading-none"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
                >
                  {product.price}
                </p>
              </div>
              {cartQty > 0 && (
                <div className="bg-brand-terracotta/10 border border-brand-terracotta/20 rounded-full px-3 py-1.5">
                  <p className="text-xs font-black text-brand-terracotta tracking-wide">
                    {cartQty} in cart
                  </p>
                </div>
              )}
            </div>

            {/* Lead time */}
            <div className="flex items-start gap-3 bg-brand-gold/20 border border-brand-gold/25 rounded-2xl px-4 py-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-brand-charcoal tracking-wide leading-snug">{product.leadTime}</p>
                <p className="text-[11px] font-medium text-brand-charcoal/40 mt-0.5">Made when you order — not before.</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 sm:py-5 rounded-full
                  font-black text-xs tracking-[0.2em] uppercase
                  transition-all duration-300 active:scale-[0.97] shadow-lg min-h-[56px] ${
                  added
                    ? "bg-brand-olive text-white shadow-brand-olive/20"
                    : "bg-brand-charcoal text-white hover:bg-brand-terracotta"
                }`}
              >
                {added
                  ? <><Check size={13} strokeWidth={3} /> Added to Cart</>
                  : inCart
                  ? <><ShoppingBag size={13} /> Add One More</>
                  : "Add to Cart"
                }
              </button>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center py-4 sm:py-5 rounded-full
                  font-black text-xs tracking-[0.2em] uppercase
                  border-2 border-brand-charcoal/15 text-brand-charcoal
                  hover:bg-brand-charcoal hover:text-white hover:border-brand-charcoal
                  transition-all duration-300 active:scale-[0.97] min-h-[56px]"
              >
                Order via WhatsApp
              </a>
            </div>

            {/* Trust tags */}
            <div className="flex flex-wrap gap-2">
              {["No preservatives", "Small batch", "Veg only", "Made to order"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full border border-brand-charcoal/10
                    text-[10px] font-black tracking-[0.12em] uppercase text-brand-charcoal/35"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DETAILS BAND — full-bleed dark ───────────────────── */}
      <section className="w-full bg-brand-charcoal px-6 sm:px-10 xl:px-16 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-brand-terracotta text-xs font-black tracking-[0.25em] uppercase mb-8 sm:mb-10">
            What's in it
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {product.details.map((d, i) => (
              <div
                key={i}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-5 py-5 hover:bg-white/[0.07] transition-colors duration-300"
              >
                <span className="font-black text-brand-terracotta text-lg mb-3 block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-bold text-brand-oat/70 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION — pull-quote ─────────────────────────── */}
      <section className="w-full bg-white px-6 sm:px-10 xl:px-16 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 sm:gap-6 mb-8">
            <div className="w-1 self-stretch bg-brand-terracotta rounded-full shrink-0" />
            <p
              className="font-serif italic font-medium text-brand-charcoal leading-[1.15] tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}
            >
              {pullQuote}
            </p>
          </div>
          {restDesc && (
            <p className="text-sm sm:text-base font-bold text-brand-charcoal/50 leading-relaxed pl-5 sm:pl-10 max-w-2xl">
              {restDesc}
            </p>
          )}
        </div>
      </section>

      {/* ── RELATED — full-bleed scroll ──────────────────────── */}
      <section className="w-full bg-brand-oat py-14 sm:py-20 overflow-hidden border-t border-brand-charcoal/5">
        <div className="px-6 sm:px-10 xl:px-16 mb-6 sm:mb-8">
          <p className="text-brand-terracotta text-xs font-black tracking-[0.25em] uppercase mb-2">
            More from WWY
          </p>
          <h2
            className="font-black text-brand-charcoal tracking-tighter leading-none"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
          >
            YOU MIGHT ALSO LIKE.
          </h2>
        </div>

        <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-6 scrollbar-hide px-6 sm:px-10 xl:px-16">
          {related.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.id}`}
              className="shrink-0 group flex flex-col"
              style={{ width: "clamp(260px, 72vw, 340px)" }}
            >
              <div
                className={`w-full aspect-[4/5] rounded-[2rem] sm:rounded-[2.5rem] ${p.bgColor}
                  flex items-center justify-center p-8 sm:p-10 mb-5 overflow-hidden relative shadow-md
                  group-hover:shadow-xl transition-shadow duration-500`}
              >
                {p.badge && (
                  <span className="absolute top-4 left-4 text-[9px] font-black bg-brand-charcoal text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    {p.badge}
                  </span>
                )}
                <div className="relative w-full h-full group-hover:scale-[1.07] transition-transform duration-600">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-contain mix-blend-multiply drop-shadow-xl"
                  />
                </div>
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 mb-1.5">
                {p.category}
              </span>
              <h3 className="font-black text-brand-charcoal tracking-tight text-xl sm:text-2xl
                group-hover:text-brand-terracotta transition-colors duration-200 leading-tight mb-1.5">
                {p.name}
              </h3>
              <span className="font-black text-brand-terracotta text-base">{p.price}</span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />

      {/* ── STICKY MOBILE CTA (appears after scrolling past hero) ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden
          transition-transform duration-300 ease-in-out
          ${stickyVisible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="bg-brand-oat/90 backdrop-blur-lg border-t border-brand-charcoal/8 px-4 py-3 pb-safe">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${product.bgColor} flex items-center justify-center shrink-0 relative overflow-hidden`}>
              <Image src={product.image} alt={product.name} fill className="object-contain mix-blend-multiply p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-brand-charcoal text-sm tracking-tight leading-none truncate">
                {product.name}
              </p>
              <p className="font-black text-brand-terracotta text-xs mt-0.5">{product.price}</p>
            </div>
            <button
              onClick={handleAdd}
              className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-full
                font-black text-[10px] tracking-[0.15em] uppercase
                transition-all duration-300 active:scale-[0.96] ${
                added
                  ? "bg-brand-olive text-white"
                  : "bg-brand-charcoal text-white hover:bg-brand-terracotta"
              }`}
            >
              {added ? <><Check size={11} strokeWidth={3} />Added</> : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
