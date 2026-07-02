"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase, Product, CartItem } from "@/lib/supabase";

const PRODUCT_IMAGES: Record<string, string> = {
  "Wild Botanicals": "/p1.png",
  "Golden Fizz": "/p2.png",
  "Wild Starter": "/p3.png",
  "Sourdough Loaf": "/p4.png",
  "Multigrain Bread": "/p5.png",
  "The Iron Tin": "/tin.png",
  "Sampler Kit": "/can_new.png",
};

const LEAD_TIMES: Record<string, string> = {
  Sodas: "Ready in 5–6 days · Delivery Wed & Sat",
  Starters: "Ready in 2–3 days · Delivery Wed & Sat",
  Breads: "Ready in 1–2 days · Delivery Wed & Sat",
  Bundles: "Ships on next delivery day · Wed & Sat",
  Storage: "In stock · Ships next delivery day",
};

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("wwy_cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("wwy_cart", JSON.stringify(cart));
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) { router.replace("/order/login"); return; }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) {
          setProduct(data);
          const cart = getCart();
          const existing = cart.find((i) => i.product_id === id);
          setQty(existing?.quantity ?? 0);
        }
      } catch {
        // product stays null → shows "not found"
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const updateQty = (delta: number) => {
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((i) => i.product_id === product.id);
    let next: CartItem[];

    if (!existing) {
      if (delta <= 0) return;
      next = [...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: delta,
        unit_price_paise: product.price_paise,
      }];
    } else {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        next = cart.filter((i) => i.product_id !== product.id);
      } else {
        next = cart.map((i) => i.product_id === product.id ? { ...i, quantity: newQty } : i);
      }
    }
    saveCart(next);
    setQty(Math.max(0, qty + delta));

    if (delta > 0) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse">Loading...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-6 px-5">
        <p className="font-black text-brand-charcoal/30 text-xl">Product not found.</p>
        <button onClick={() => router.push("/order")}
          className="bg-brand-charcoal text-white font-black text-xs tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-brand-terracotta transition-colors">
          ← Back to shop
        </button>
      </main>
    );
  }

  const imageSrc = PRODUCT_IMAGES[product.name];
  const leadTime = LEAD_TIMES[product.category] ?? "Delivery Wed & Sat only";
  const cartTotal = getCart().reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const cartCount = getCart().reduce((s, i) => s + i.quantity, 0);

  return (
    <main className="min-h-screen bg-brand-oat pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-oat/95 backdrop-blur-sm border-b border-brand-charcoal/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.back()}
            className="text-brand-charcoal/40 hover:text-brand-charcoal transition-colors font-black text-xl leading-none">
            ←
          </button>
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">
            {product.category}
          </span>
          {cartCount > 0 && (
            <button onClick={() => router.push("/order/cart")}
              className="text-[11px] font-black tracking-wider uppercase text-brand-terracotta">
              Cart ({cartCount})
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Product image */}
        {imageSrc ? (
          <div className="relative w-full bg-white overflow-hidden"
            style={{ height: "clamp(260px, 55vw, 400px)" }}>
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full bg-brand-charcoal/5 flex items-center justify-center"
            style={{ height: "clamp(200px, 45vw, 320px)" }}>
            <span className="font-black text-brand-charcoal/20 text-6xl">✦</span>
          </div>
        )}

        {/* Product info */}
        <div className="px-5 pt-6 pb-4 flex flex-col gap-5">

          <div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-terracotta mb-1">
              {product.category}
            </p>
            <h1 className="font-black text-brand-charcoal leading-none tracking-tighter mb-2"
              style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}>
              {product.name.toUpperCase()}
            </h1>
            {product.description && (
              <p className="text-sm font-medium text-brand-charcoal/60 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Price + lead time */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-brand-charcoal/30 mb-0.5">Price</p>
              <p className="font-black text-brand-charcoal" style={{ fontSize: "clamp(1.8rem, 7vw, 2.5rem)" }}>
                {fmt(product.price_paise)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black tracking-widest uppercase text-brand-charcoal/30 mb-0.5">Availability</p>
              <p className={`text-xs font-black ${product.available ? "text-brand-olive" : "text-brand-terracotta"}`}>
                {product.available ? "Available this week" : "Not available"}
              </p>
            </div>
          </div>

          {/* Lead time pill */}
          <div className="bg-brand-gold/20 rounded-2xl px-4 py-3 border border-brand-gold/30">
            <p className="text-xs font-black text-brand-charcoal">{leadTime}</p>
            <p className="text-xs font-medium text-brand-charcoal/50 mt-0.5">
              Bake-to-order. Made when you place it, not before.
            </p>
          </div>

          {/* Quantity control */}
          {product.available && (
            <div className="flex items-center gap-4">
              {qty === 0 ? (
                <button
                  onClick={() => updateQty(1)}
                  className="flex-1 bg-brand-charcoal hover:bg-brand-terracotta text-white rounded-2xl py-4 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
                >
                  Add to Order
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-white border border-brand-charcoal/10 rounded-2xl overflow-hidden">
                    <button onClick={() => updateQty(-1)}
                      className="w-12 h-14 flex items-center justify-center font-black text-brand-charcoal text-xl hover:bg-brand-charcoal/5 transition-colors">
                      −
                    </button>
                    <span className="font-black text-brand-charcoal text-lg w-8 text-center">{qty}</span>
                    <button onClick={() => updateQty(1)}
                      className="w-12 h-14 flex items-center justify-center font-black text-brand-terracotta text-xl hover:bg-brand-terracotta/5 transition-colors">
                      +
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-brand-charcoal text-lg">{fmt(qty * product.price_paise)}</p>
                    <p className="text-xs font-bold text-brand-charcoal/30">{qty} × {fmt(product.price_paise)}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {added && (
            <p className="text-xs font-black text-brand-olive tracking-wider animate-pulse">
              ✓ Added to order
            </p>
          )}

          {!product.available && (
            <p className="text-sm font-bold text-brand-charcoal/30 italic text-center py-2">
              Not available this week. Check back soon.
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-brand-charcoal/5 pt-4">
            <p className="text-xs font-black tracking-widest uppercase text-brand-charcoal/20 mb-3">About this product</p>
            <p className="text-sm font-medium text-brand-charcoal/50 leading-relaxed">
              Every WWY product is fermented in small batches. No shortcuts. No additives. Time is the main ingredient — and we never rush it.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-brand-oat/80 backdrop-blur-md border-t border-brand-charcoal/5">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/order/cart")}
              className="w-full bg-brand-charcoal hover:bg-brand-terracotta text-white rounded-2xl py-4 px-5 flex items-center justify-between transition-all duration-300 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
                <span className="font-black text-sm tracking-wide">View Order</span>
              </span>
              <span className="font-black text-sm">{fmt(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
