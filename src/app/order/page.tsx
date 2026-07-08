"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

function fmt(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("wwy_cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("wwy_cart", JSON.stringify(cart));
}

export default function OrderPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [flat, setFlat] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    ["wwy_flat","wwy_name","wwy_customer_id","wwy_pincode","wwy_cart"].forEach((k) => localStorage.removeItem(k));
    await supabase.auth.signOut();
    router.replace("/order/login");
  };

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    const storedName = localStorage.getItem("wwy_name");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setFlat(storedFlat);
    setCustomerName(storedName || "");
    setCart(getCart());

    (async () => {
      try {
        const { data: setting } = await supabase.from("settings").select("value").eq("key", "vacation_mode").single();
        if (setting?.value === "true") { router.replace("/coming-soon"); return; }
        const { data, error: fetchErr } = await supabase.from("products").select("*").eq("available", true).order("category");
        if (fetchErr) { setLoadError(true); } else { setProducts(data || []); }
      } catch {
        setLoadError(true);
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
  const firstName = customerName.split(" ")[0];

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat pb-36">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-brown/10 shadow-sm h-14" />
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
          <div className="h-8 bg-brand-brown/8 rounded-xl w-56 mb-2 animate-pulse" />
          <div className="h-3 bg-brand-brown/5 rounded w-40 animate-pulse" />
        </div>
        <div className="max-w-2xl mx-auto px-4 flex flex-col gap-3 pt-2">
          {[1,2,3,4].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-brand-brown/8 shadow-sm animate-pulse">
              <div className="h-2.5 bg-brand-brown/8 rounded w-16 mb-2" />
              <div className="h-4 bg-brand-brown/10 rounded w-3/4 mb-3" />
              <div className="h-3 bg-brand-brown/5 rounded w-full mb-1" />
              <div className="h-3 bg-brand-brown/5 rounded w-2/3 mb-4" />
              <div className="h-9 bg-brand-brown/8 rounded-xl w-20" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 gap-5">
        <p className="font-black text-brand-charcoal/30 text-xl tracking-tight">Couldn&apos;t load menu.</p>
        <p className="text-sm font-bold text-brand-charcoal/30">Check your connection and try again.</p>
        <button
          onClick={() => { setLoadError(false); setLoading(true); window.location.reload(); }}
          className="bg-brand-charcoal text-white font-black text-xs tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-brand-terracotta transition-colors"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat pb-36">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-brown/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left: logo + greeting */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-brand-oat rounded-xl p-1 shrink-0">
              <Image src="/logo.png" alt="WWY" width={28} height={28} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-brand-brown text-sm leading-none truncate">
                {firstName ? `Hey, ${firstName} 👋` : "Wild Wild Yeast"}
              </p>
              <p className="text-[10px] font-bold text-brand-brown/40 leading-none mt-0.5 truncate">Flat {flat}</p>
            </div>
          </div>

          {/* Right: cart + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {cartCount > 0 && (
              <button
                onClick={() => router.push("/order/cart")}
                className="flex items-center gap-1.5 bg-brand-brown text-white rounded-full px-3 py-1.5 hover:bg-brand-orange transition-colors"
              >
                <span className="text-xs font-black">{cartCount}</span>
                <span className="text-xs font-bold text-white/60">·</span>
                <span className="text-xs font-black">{fmt(cartTotal)}</span>
              </button>
            )}

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-brand-brown text-white font-black text-sm flex items-center justify-center hover:bg-brand-orange transition-colors shrink-0"
              >
                {customerName?.[0]?.toUpperCase() || "?"}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-brand-brown/10 overflow-hidden min-w-[180px] z-50">
                    <div className="px-4 py-3 bg-brand-oat/60 border-b border-brand-brown/10">
                      <p className="font-black text-brand-brown text-sm leading-none">{customerName}</p>
                      <p className="text-[10px] font-bold text-brand-brown/40 mt-0.5">Flat {flat}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/order/account"); }}
                      className="w-full px-4 py-3 text-left text-sm font-black text-brand-brown hover:bg-brand-oat transition-colors"
                    >
                      My Account
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/order/history"); }}
                      className="w-full px-4 py-3 text-left text-sm font-black text-brand-brown hover:bg-brand-oat transition-colors"
                    >
                      My Orders
                    </button>
                    <div className="border-t border-brand-brown/10" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm font-black text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero strip ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
        <h1 className="font-black text-brand-brown leading-none tracking-tighter" style={{ fontSize: "clamp(1.8rem,7vw,2.6rem)" }}>
          THIS WEEK'S<br />FERMENTATION.
        </h1>
        <p className="text-xs font-bold text-brand-brown/40 mt-2">
          Made when ordered, not before. · Delivery Wed &amp; Sat only.
        </p>
      </div>

      {/* ── Category pills ── */}
      <div className="sticky top-14 z-30 bg-brand-oat/95 backdrop-blur-sm border-b border-brand-brown/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase transition-all duration-200 ${
                  category === cat
                    ? "bg-brand-brown text-white shadow-sm"
                    : "bg-white text-brand-brown/50 hover:text-brand-brown border border-brand-brown/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category subtitle ── */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <p className="text-xs font-bold text-brand-brown/30 italic">{CATEGORY_SUBTITLES[category]}</p>
      </div>

      {/* ── Product list ── */}
      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm font-bold text-brand-brown/30 text-center">
              {category === "All" ? "Nothing available this week. Check back soon." : `No ${category} available right now.`}
            </p>
            {category !== "All" && (
              <button
                onClick={() => setCategory("All")}
                className="text-xs font-black tracking-wider uppercase text-brand-brown/50 hover:text-brand-brown border border-brand-brown/20 hover:border-brand-brown/40 px-5 py-2 rounded-xl transition-colors"
              >
                ← Back to All
              </button>
            )}
          </div>
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

      {/* ── Sticky cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-brand-oat/90 backdrop-blur-md border-t border-brand-brown/10">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/order/cart")}
              className="w-full bg-brand-brown hover:bg-brand-orange text-white rounded-2xl py-4 px-5 flex items-center justify-between transition-all duration-200 active:scale-[0.98]"
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
    <div className="bg-white rounded-2xl p-4 flex gap-4 items-start border border-brand-brown/8 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/order/product/${product.id}`} className="text-left flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-brown/30 block">{product.category}</span>
            <h2 className="font-black text-brand-brown text-base leading-tight">{product.name}</h2>
          </Link>
          <span className="font-black text-brand-brown text-sm shrink-0">{fmt(product.price_paise)}</span>
        </div>
        {product.description && (
          <p className="text-xs text-brand-brown/50 font-medium leading-relaxed mb-3">{product.description}</p>
        )}
        <div className="flex items-center gap-3">
          {qty === 0 ? (
            <button onClick={onAdd} className="bg-brand-brown text-white hover:bg-brand-orange text-xs font-black tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] min-h-[40px]">
              Add
            </button>
          ) : (
            <div className="flex items-center gap-0 bg-brand-oat rounded-xl overflow-hidden border border-brand-brown/10">
              <button onClick={onRemove} className="w-10 h-10 flex items-center justify-center font-black text-brand-brown text-lg hover:bg-brand-brown/10 transition-colors" aria-label="Remove one">−</button>
              <span className="font-black text-brand-brown text-sm w-6 text-center">{qty}</span>
              <button onClick={onAdd} className="w-10 h-10 flex items-center justify-center font-black text-brand-orange text-lg hover:bg-brand-orange/10 transition-colors" aria-label="Add one">+</button>
            </div>
          )}
          {qty > 0 && <span className="text-xs font-bold text-brand-brown/40">{fmt(qty * product.price_paise)}</span>}
        </div>
      </div>
    </div>
  );
}
