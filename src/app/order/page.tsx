"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Sparkles,
  CupSoda,
  Wheat,
  FlaskConical,
  Box,
  Archive,
  Layers,
  Flame,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { supabase, Product, CartItem } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CATEGORIES = ["All", "Sodas", "Starters", "Breads", "Bundles", "Storage"];

const CATEGORY_SUBTITLES: Record<string, string> = {
  All: "Everything we bake & ferment in small batches.",
  Sodas: "Alive in every sip — naturally fizzy & probiotic.",
  Starters: "100-year-old living wild yeast culture, ready to bake.",
  Breads: "Wild-fermented for 72h. Long-proofed & crusty.",
  Bundles: "The complete artisanal introduction set.",
  Storage: "Keep your sourdough starter alive for generations.",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Layers className="w-3.5 h-3.5" />,
  Sodas: <CupSoda className="w-3.5 h-3.5" />,
  Starters: <FlaskConical className="w-3.5 h-3.5" />,
  Breads: <Wheat className="w-3.5 h-3.5" />,
  Bundles: <Box className="w-3.5 h-3.5" />,
  Storage: <Archive className="w-3.5 h-3.5" />,
};

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

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderPageInner />
    </Suspense>
  );
}

function OrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState(() => {
    const c = searchParams.get("category");
    return c && CATEGORIES.includes(c) ? c : "All";
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) {
      router.replace("/order/login");
      return;
    }
    setCart(getCart());

    (async () => {
      try {
        const { data: setting } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "vacation_mode")
          .single();
        if (setting?.value === "true") {
          router.replace("/coming-soon");
          return;
        }
        const { data, error: fetchErr } = await supabase
          .from("products")
          .select("*")
          .eq("available", true)
          .order("category");
        if (fetchErr) {
          setLoadError(true);
        } else {
          setProducts(data || []);
        }
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    CATEGORIES.forEach((c) => {
      if (c !== "All") {
        counts[c] = products.filter((p) => p.category === c).length;
      }
    });
    return counts;
  }, [products]);

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const byCategory =
    category === "All" ? products : products.filter((p) => p.category === category);
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? byCategory.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      )
    : byCategory;

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat pb-36">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-6">
          <div className="h-64 bg-brand-brown/8 rounded-3xl w-full mb-6 animate-pulse" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl p-5 border border-brand-brown/8 shadow-sm animate-pulse flex flex-col gap-3"
            >
              <div className="h-44 bg-brand-brown/8 rounded-2xl w-full" />
              <div className="h-3 bg-brand-brown/8 rounded w-16" />
              <div className="h-5 bg-brand-brown/10 rounded w-3/4" />
              <div className="h-3 bg-brand-brown/5 rounded w-full" />
              <div className="h-10 bg-brand-brown/8 rounded-2xl w-full mt-auto" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 gap-5">
        <p className="font-black text-brand-brown/40 text-xl tracking-tight">
          Couldn&apos;t load menu.
        </p>
        <p className="text-sm font-bold text-brand-brown/50">
          Check your connection and try again.
        </p>
        <button
          onClick={() => {
            setLoadError(false);
            setLoading(true);
            window.location.reload();
          }}
          className="bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-brand-terracotta transition-colors shadow-md cursor-pointer"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-oat/40 via-white to-brand-oat/20 pb-0">
      <Navbar />

      {/* ── Storefront Hero Header & Visual Showcase ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Baking Fresh This Week
              </span>
              <span className="inline-flex items-center gap-1 bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20 text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full">
                <Flame className="w-3 h-3 text-brand-terracotta" />
                Fresh Weekly Menu
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="font-serif text-brand-brown font-bold tracking-tight leading-[1.08] mb-3"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}
            >
              THIS WEEK&apos;S <br className="hidden sm:inline" />
              <span className="italic font-light text-brand-terracotta">FERMENTATION</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-brand-brown/70 font-medium leading-relaxed max-w-xl mb-6">
              Small batch artisanal sourdoughs, 100-year-old wild yeast cultures, and live probiotic ginger sodas. Baked fresh strictly when ordered.
            </p>

            {/* Highlight Features Bar */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-brand-brown/60 mb-6 border-y border-brand-brown/10 py-3 w-full">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-terracotta" />
                Delivery: Wed &amp; Sat
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-brown/20" />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Wild Yeast
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-brown/20" />
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                No Artificial Additives
              </span>
            </div>

            {/* Integrated Search Bar */}
            <div className="w-full max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sourdough, sodas, starters..."
                className="w-full bg-white border border-brand-brown/20 rounded-full pl-11 pr-24 py-3.5 text-xs font-bold text-brand-brown placeholder:text-brand-brown/40 outline-none focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10 transition-all shadow-sm"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-brand-brown/50 hover:text-brand-brown bg-brand-oat px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              ) : (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-brand-brown/40 bg-brand-oat/80 px-2.5 py-1 rounded-full pointer-events-none">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </span>
              )}
            </div>
          </div>

          {/* Right Hero Image Card Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-sm aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
              <Image
                src="/product_img/7-from-the-oven.jpg"
                alt="Fresh sourdough loaf from oven"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/50">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black tracking-wider uppercase text-brand-brown">
                  Artisan Bake
                </span>
              </div>

              {/* Overlapping Floating Soda Bottle Card */}
              <div className="absolute -bottom-2 -right-2 z-20 w-28 h-36 sm:w-32 sm:h-40 rounded-2xl bg-white p-2 shadow-2xl border-2 border-brand-oat flex flex-col items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-full">
                  <Image
                    src="/p1.png"
                    alt="Wild Botanicals Soda"
                    fill
                    className="object-contain drop-shadow-md"
                  />
                </div>
                <span className="text-[9px] font-black uppercase text-brand-terracotta tracking-tight -mt-1 bg-brand-terracotta/10 px-2 py-0.5 rounded-full">
                  Live Soda
                </span>
              </div>

              {/* Bottom Overlay Info */}
              <div className="absolute bottom-4 left-4 right-28 z-10 text-white">
                <p className="text-[11px] font-black tracking-widest uppercase text-amber-300">
                  72-Hour Cold Ferment
                </p>
                <p className="text-sm font-serif font-bold text-white/95 leading-snug">
                  Artisanal Sourdough &amp; Live Cultures
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Category Tab Pills (No Full-Width Bar Background) ── */}
      <div className="sticky top-24 z-30 mb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-2 px-1">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-brand-brown text-white"
                      : "bg-white/90 backdrop-blur-sm text-brand-brown/70 hover:text-brand-brown hover:bg-white border border-brand-brown/15 shadow-sm"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-brand-brown/8 text-brand-brown/60"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Products Grid (Multi-Column Layout) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mb-20 sm:mb-28">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-brand-brown/10 text-center flex flex-col items-center gap-4 shadow-sm">
            <p className="text-base font-bold text-brand-brown/50">
              {q
                ? `No products match "${searchQuery.trim()}".`
                : category === "All"
                ? "Nothing available this week. Check back soon."
                : `No ${category} available right now.`}
            </p>
            {q ? (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-black tracking-wider uppercase bg-brand-brown text-white px-6 py-3 rounded-full hover:bg-brand-terracotta transition-all cursor-pointer shadow-sm"
              >
                Clear Search
              </button>
            ) : (
              category !== "All" && (
                <button
                  onClick={() => setCategory("All")}
                  className="text-xs font-black tracking-wider uppercase bg-brand-brown text-white px-6 py-3 rounded-full hover:bg-brand-terracotta transition-all cursor-pointer shadow-sm"
                >
                  ← Show All Products
                </button>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </div>

      <Footer />

      {/* ── Floating Sticky Checkout Bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-9 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <button
            onClick={() => router.push("/order/cart")}
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
          </button>
        </div>
      )}
    </main>
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
    <div className="bg-white rounded-3xl p-5 border border-brand-brown/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
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


