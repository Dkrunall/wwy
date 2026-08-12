"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, Product, CartItem } from "@/lib/supabase";

const CATEGORIES = ["All", "Sodas", "Starters", "Breads", "Bundles", "Storage"];

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem("wwy_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("wwy_cart", JSON.stringify(cart));
}

function getProductFallbackImage(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes("botanical") || n.includes("hibiscus")) return "/p1.png";
  if (n.includes("starter")) return "/p2.png";
  if (n.includes("fizz") || n.includes("turmeric") || n.includes("ginger")) return "/p3.png";
  if (n.includes("tin") || n.includes("iron")) return "/p4.png";
  if (n.includes("bundle") || n.includes("sampler") || n.includes("kit")) return "/p5.png";
  if (category === "Sodas") return "/can_new.png";
  if (category === "Breads") return "/product_img/7-from-the-oven.jpg";
  if (category === "Starters") return "/product_img/1-starter-top.jpg";
  if (category === "Storage") return "/tin.png";
  return "/p1.png";
}

export default function MenuSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadCart = () => setCart(getCart());
    loadCart();

    (async () => {
      try {
        const { data: setting } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "vacation_mode")
          .single();
        if (setting?.value === "true") {
          setHidden(true);
          return;
        }
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("available", true)
          .order("category");
        if (!error) setProducts(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getQty = useCallback(
    (productId: string) => cart.find((i) => i.product_id === productId)?.quantity ?? 0,
    [cart]
  );

  const updateQty = useCallback((product: Product, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      let next: CartItem[];
      if (!existing) {
        if (delta <= 0) return prev;
        next = [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            quantity: delta,
            unit_price_paise: product.price_paise,
          },
        ];
      } else {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) next = prev.filter((i) => i.product_id !== product.id);
        else
          next = prev.map((i) =>
            i.product_id === product.id ? { ...i, quantity: newQty } : i
          );
      }
      saveCart(next);
      return next;
    });
  }, []);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const amount = direction === "left" ? -340 : 340;
    sliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftPos(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const cardWidth = 330;
    const index = Math.round(sliderRef.current.scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(0, index), filtered.length - 1));
  };

  const scrollToCard = (index: number) => {
    if (!sliderRef.current) return;
    const cardWidth = 330;
    sliderRef.current.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const filtered =
    category === "All" ? products : products.filter((p) => p.category === category);

  if (hidden) return null;
  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full bg-brand-oat relative z-10 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem] -mt-8 sm:-mt-12 pt-16 sm:pt-24 md:pt-28 pb-20 sm:pb-28 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header with Slider Navigation Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <span className="text-brand-terracotta text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3 block">
              Fresh Weekly Menu
            </span>
            <h2
              className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]"
              style={{ fontSize: "clamp(2.5rem, 6.5vw, 4.8rem)" }}
            >
              Shop <span className="text-brand-terracotta italic font-light">the ferments.</span>
            </h2>
          </div>

          <div className="flex items-end justify-between lg:justify-end gap-6">
            <p className="text-xs sm:text-sm md:text-base font-bold text-brand-brown/60 leading-relaxed max-w-sm">
              Small-batch ferments made strictly when ordered. Drag or slide through our artisanal range below.
            </p>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scrollSlider("left")}
                aria-label="Scroll left"
                className="w-11 h-11 rounded-full bg-white border border-brand-brown/10 shadow-sm hover:bg-brand-brown hover:text-white transition-all flex items-center justify-center text-brand-brown cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollSlider("right")}
                aria-label="Scroll right"
                className="w-11 h-11 rounded-full bg-white border border-brand-brown/10 shadow-sm hover:bg-brand-brown hover:text-white transition-all flex items-center justify-center text-brand-brown cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Floating Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-2 px-1 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                category === cat
                  ? "bg-brand-brown text-white shadow-md"
                  : "bg-white/90 backdrop-blur-sm text-brand-brown/70 hover:text-brand-brown hover:bg-white border border-brand-brown/15 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Horizontal Product Slider Track (Mouse Draggable) */}
        {loading ? (
          <div className="flex gap-6 overflow-x-auto scrollbar-hide py-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-[280px] sm:w-[320px] shrink-0 bg-white rounded-3xl p-5 border border-brand-brown/8 shadow-sm animate-pulse flex flex-col gap-3"
              >
                <div className="h-44 bg-brand-brown/8 rounded-2xl w-full" />
                <div className="h-5 bg-brand-brown/10 rounded w-3/4" />
                <div className="h-3 bg-brand-brown/5 rounded w-full" />
                <div className="h-10 bg-brand-brown/8 rounded-2xl w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-brand-brown/10 text-center shadow-sm">
            <p className="text-base font-bold text-brand-brown/50">
              No {category} available right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onScroll={handleScroll}
              className={`flex gap-6 overflow-x-auto scrollbar-hide py-4 px-1 scroll-smooth select-none ${
                isMouseDown ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {filtered.map((product) => (
                <div key={product.id} className="w-[280px] sm:w-[320px] shrink-0 flex flex-col">
                  <ProductCard
                    product={product}
                    qty={getQty(product.id)}
                    onAdd={() => updateQty(product, 1)}
                    onRemove={() => updateQty(product, -1)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Dots Indicator */}
            {filtered.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {filtered.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToCard(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeIndex === idx
                        ? "w-8 bg-brand-terracotta shadow-sm"
                        : "w-2.5 bg-brand-brown/20 hover:bg-brand-brown/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Full Menu CTA */}
        <div className="flex justify-center mt-10 sm:mt-14">
          <Link
            href="/order"
            className="inline-flex items-center gap-2 bg-brand-brown text-white hover:bg-brand-terracotta px-8 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 shadow-md"
          >
            View Full Menu <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Floating Sticky Checkout Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-9 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <Link
            href="/order/cart"
            className="w-full bg-brand-brown hover:bg-brand-terracotta text-white rounded-full py-4 px-6 flex items-center justify-between shadow-2xl shadow-brand-brown/30 transition-all duration-300 active:scale-[0.98] cursor-pointer border border-white/20"
          >
            <span className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
              <span className="font-black text-sm tracking-widest uppercase">
                View Order &amp; Checkout
              </span>
            </span>
            <span className="font-black text-base bg-white/15 px-4 py-1 rounded-full">
              {fmt(cartTotal)}
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const imageSrc = product.image_url || getProductFallbackImage(product.name, product.category);

  return (
    <div className="bg-white rounded-3xl p-5 border border-brand-brown/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full">
      <div>
        {/* Product Image Container */}
        <div className="relative w-full aspect-[4/3] rounded-2xl bg-brand-oat/30 overflow-hidden mb-4 border border-brand-brown/8 group-hover:border-brand-terracotta/30 transition-colors">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Category Badge */}
          <span className="absolute top-3 left-3 z-10 text-[10px] font-black tracking-widest uppercase bg-white/90 backdrop-blur-md text-brand-terracotta px-3 py-1 rounded-full shadow-sm border border-brand-brown/10">
            {product.category}
          </span>

          {/* Price Tag Overlay */}
          <span className="absolute bottom-3 right-3 z-10 font-serif font-black text-brand-brown text-sm bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-brand-brown/10">
            {fmt(product.price_paise)}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="font-black text-brand-brown text-lg sm:text-xl leading-snug tracking-tight mb-2 group-hover:text-brand-terracotta transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs sm:text-sm text-brand-brown/60 font-medium leading-relaxed mb-6 line-clamp-3">
            {product.description}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-brand-brown/5 flex items-center justify-between gap-3 mt-auto">
        {qty === 0 ? (
          <button
            onClick={onAdd}
            className="w-full bg-brand-brown text-white hover:bg-brand-terracotta text-xs font-black tracking-widest uppercase py-3 rounded-2xl transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-sm"
          >
            + Add to Order
          </button>
        ) : (
          <div className="w-full flex items-center justify-between bg-brand-oat/60 rounded-2xl p-1.5 border border-brand-brown/10">
            <button
              onClick={onRemove}
              className="w-9 h-9 flex items-center justify-center font-black text-brand-brown text-base bg-white rounded-xl shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              aria-label="Remove one"
            >
              −
            </button>
            <span className="font-black text-brand-brown text-sm px-2">{qty}</span>
            <button
              onClick={onAdd}
              className="w-9 h-9 flex items-center justify-center font-black text-white bg-brand-terracotta rounded-xl shadow-sm hover:bg-brand-brown transition-colors cursor-pointer"
              aria-label="Add one"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
