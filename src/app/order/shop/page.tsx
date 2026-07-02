"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Product, CartItem } from "@/lib/supabase";

const CATEGORIES = ["All", "Sodas", "Starters", "Breads", "Bundles", "Storage"];

const CATEGORY_SUBTITLES: Record<string, string> = {
  All: "Everything we make.",
  Sodas: "Alive in every sip.",
  Starters: "A living culture, ready to bake.",
  Breads: "Wild-fermented. Long-proofed.",
  Bundles: "A complete introduction.",
  Storage: "Keep it alive.",
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

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setCart(getCart());

    (async () => {
      try {
        const { data: setting } = await supabase.from("settings").select("value").eq("key", "vacation_mode").single();
        if (setting?.value === "true") { router.replace("/coming-soon"); return; }
        const { data } = await supabase.from("products").select("*").eq("available", true).order("category");
        setProducts(data || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
        next = [...prev, { product_id: product.id, product_name: product.name, quantity: delta, unit_price_paise: product.price_paise }];
      } else {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) next = prev.filter((i) => i.product_id !== product.id);
        else next = prev.map((i) => i.product_id === product.id ? { ...i, quantity: newQty } : i);
      }
      saveCart(next);
      return next;
    });
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const filtered = category === "All" ? products : products.filter((p) => p.category === category);

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat pb-36">
      {/* Header */}
      <div className="px-4 pt-5 pb-2 max-w-xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/40">Menu</p>
          <h1 className="font-black text-brand-brown text-xl leading-tight">This Week's Menu</h1>
        </div>
        {cartCount > 0 && (
          <button onClick={() => router.push("/order/cart")} className="flex items-center gap-2 bg-brand-brown text-white rounded-full px-4 py-2 hover:bg-brand-orange transition-colors">
            <span className="text-xs font-black">{cartCount} items</span>
            <span className="text-xs font-black">·</span>
            <span className="text-xs font-black">{fmt(cartTotal)}</span>
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="sticky top-14 md:top-0 z-30 bg-brand-oat/95 backdrop-blur-sm border-b border-brand-brown/10">
        <div className="max-w-xl mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase transition-all duration-200 ${
                  category === cat
                    ? "bg-brand-charcoal text-white"
                    : "bg-white text-brand-charcoal/50 hover:text-brand-charcoal border border-brand-charcoal/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="max-w-xl mx-auto px-4 py-3">
        <p className="text-xs font-bold text-brand-brown/30 italic">{CATEGORY_SUBTITLES[category]}</p>
      </div>

      {/* Products */}
      <div className="max-w-xl mx-auto px-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-sm font-bold text-brand-charcoal/30 py-8 text-center">Nothing here this week. Check back soon.</p>
        )}
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            qty={getQty(product.id)}
            onAdd={() => updateQty(product, 1)}
            onRemove={() => updateQty(product, -1)}
          />
        ))}
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
                <span className="bg-white/20 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{cartCount}</span>
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

function ProductCard({ product, qty, onAdd, onRemove }: { product: Product; qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 items-start border border-brand-charcoal/5 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/order/product/${product.id}`} className="text-left flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/30 block">{product.category}</span>
            <h2 className="font-black text-brand-charcoal text-base leading-tight">{product.name}</h2>
          </Link>
          <span className="font-black text-brand-charcoal text-sm shrink-0">{fmt(product.price_paise)}</span>
        </div>
        {product.description && (
          <p className="text-xs text-brand-charcoal/50 font-medium leading-relaxed mb-3">{product.description}</p>
        )}
        <div className="flex items-center gap-3">
          {qty === 0 ? (
            <button onClick={onAdd} className="bg-brand-charcoal text-white hover:bg-brand-terracotta text-xs font-black tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] min-h-[40px]">
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-brand-oat rounded-xl overflow-hidden">
              <button onClick={onRemove} className="w-10 h-10 flex items-center justify-center font-black text-brand-charcoal text-lg hover:bg-brand-charcoal/10 transition-colors" aria-label="Remove one">−</button>
              <span className="font-black text-brand-charcoal text-sm w-5 text-center">{qty}</span>
              <button onClick={onAdd} className="w-10 h-10 flex items-center justify-center font-black text-brand-terracotta text-lg hover:bg-brand-terracotta/10 transition-colors" aria-label="Add one">+</button>
            </div>
          )}
          {qty > 0 && <span className="text-xs font-bold text-brand-charcoal/40">{fmt(qty * product.price_paise)}</span>}
        </div>
      </div>
    </div>
  );
}
