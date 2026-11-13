"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InstaLink from "@/components/InstaLink";
import { canAddToCart, LIMIT_HINT } from "@/lib/orderLimits";
import { readCart, writeCart, type CartLine } from "@/lib/cartStorage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import VegMark from "@/components/VegMark";
import { dietOf, DIET_LABEL } from "@/lib/diet";
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

export type UpcomingBake = { date: string; orderBy: string; flavours: string[] };

export default function ShopClient({ products, bakes }: { products: Product[]; bakes: UpcomingBake[] }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const qtyOf = (p: Product) => (p.dbId ? cart.find((i) => i.product_id === p.dbId)?.quantity ?? 0 : 0);

  const changeQty = (p: Product, delta: number): CartLine[] => {
    const id = p.dbId;
    if (!id || (delta > 0 && !canAddToCart(cart, id))) return cart;
    const existing = cart.find((i) => i.product_id === id);
    const next = existing
      ? cart.map((i) => (i.product_id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0)
      : delta > 0
        ? [...cart, { product_id: id, product_name: p.name, quantity: delta, unit_price_paise: Math.round(p.priceNum * 100) }]
        : cart;
    writeCart(next);
    setCart(next);
    return next;
  };

  const buyNow = (p: Product) => {
    if (p.dbId && qtyOf(p) === 0) changeQty(p, 1);
    router.push(p.dbId ? "/order/cart" : "/order");
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
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
              New flavours go up every week on Instagram, <InstaLink />.
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
            <p className="text-xs font-bold text-brand-brown/50">
              Flavours rotate weekly. <InstaLink>Follow us on Insta @{BUSINESS.instagramHandle}</InstaLink>
            </p>
          </div>
        </div>
      </section>

      {/* ── Filter ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-10 sm:pt-14">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif font-normal text-brand-brown text-2xl sm:text-4xl tracking-tight mb-2">Find your next favourite.</h2>
          <p className="text-sm font-bold text-brand-brown/50 leading-relaxed max-w-2xl">
            Our next two weeks of bakes. Try something new and see what happens when good ingredients meet a curious mind.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            {bakes.map((b) => (
              <div key={b.date} className="bg-white rounded-[1.5rem] border border-brand-brown/5 shadow-sm p-5 flex flex-col gap-2">
                <span className="text-brand-orange text-[10px] sm:text-xs font-black tracking-[0.18em] uppercase">{b.date}</span>
                <p className="text-[11px] font-bold text-brand-brown/45">Order by {b.orderBy}</p>
                {b.flavours.length > 0 ? (
                  <ul className="flex flex-col gap-1 text-sm font-bold text-brand-brown/75">
                    {b.flavours.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm font-bold text-brand-brown/60 leading-snug">
                    Full range. Flavours for this bake go up on <InstaLink>Instagram</InstaLink>.
                  </p>
                )}
              </div>
            ))}
          </div>
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
            <ProductCard
              key={product.id}
              product={product}
              qty={qtyOf(product)}
              canAdd={!product.dbId || canAddToCart(cart, product.dbId)}
              onAdd={() => changeQty(product, 1)}
              onRemove={() => changeQty(product, -1)}
              onBuy={() => buyNow(product)}
            />
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
      <section className="w-full bg-brand-brown px-4 sm:px-8 xl:px-16 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
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
          Buy now
        </Link>
        </div>
      </section>

      {cartCount > 0 && (
        <Link
          href="/order/cart"
          className="fixed bottom-9 sm:bottom-10 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-3 bg-brand-brown text-white hover:bg-brand-orange px-6 py-3.5 rounded-full shadow-2xl text-[11px] font-black tracking-[0.15em] uppercase whitespace-nowrap transition-colors"
        >
          <ShoppingBag size={16} />
          View cart · {cartCount} {cartCount === 1 ? "item" : "items"} · ₹{(cartTotal / 100).toLocaleString("en-IN")}
        </Link>
      )}
 
      <Footer />
    </main>
  );
}
 
function ProductCard({
  product,
  qty,
  canAdd,
  onAdd,
  onRemove,
  onBuy,
}: {
  product: Product;
  qty: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onBuy: () => void;
}) {
  const diet = dietOf(product.declarations?.ingredients, product.declarations?.allergens);
  return (
    <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-brand-brown/5 shadow-sm hover:shadow-xl transition-all duration-500">
      {/* Image */}
      <div className={`relative w-full aspect-square ${product.bgColor} p-5 sm:p-8 flex items-center justify-center`}>
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 text-[9px] font-black bg-brand-brown text-white px-3 py-1.5 rounded-full uppercase tracking-widest">
            {product.badge}
          </span>
        )}
        {diet && <VegMark diet={diet} className="absolute top-4 right-4 z-10" />}
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
          {product.declarations?.ingredients && (
            <p className="text-[11px] font-bold text-brand-brown/60 mt-2 leading-relaxed">
              <span className="font-black text-brand-brown/80">Ingredients: </span>{product.declarations.ingredients}
            </p>
          )}
          {product.declarations?.allergens && (
            <p className="text-[11px] font-bold text-brand-brown/60 mt-1 leading-relaxed">
              <span className="font-black text-brand-brown/80">Allergens: </span>{product.declarations.allergens}
            </p>
          )}
        </div>
 
        <details className="group/details text-xs font-bold text-brand-brown/60">
          <summary className="cursor-pointer list-none text-[10px] font-black tracking-[0.18em] uppercase text-brand-brown/50 hover:text-brand-orange">
            Product details
          </summary>
          <dl className="mt-3 flex flex-col gap-1.5 leading-relaxed">
            <div><dt className="inline font-black text-brand-brown/80">MRP: </dt><dd className="inline">{product.price} (incl. all taxes)</dd></div>
            {diet && <div><dt className="inline font-black text-brand-brown/80">Type: </dt><dd className="inline">{DIET_LABEL[diet]}</dd></div>}
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

        <div className="mt-auto pt-3 border-t border-brand-brown/5 flex flex-col gap-3">
          <span className="font-black text-brand-orange text-lg">{product.price}</span>
          <div className="grid grid-cols-2 gap-2">
            {!product.dbId ? null : qty === 0 ? (
              <button
                onClick={onAdd}
                disabled={!canAdd}
                className="px-3 py-2.5 rounded-full text-[10px] font-black tracking-[0.12em] uppercase border border-brand-brown/20 text-brand-brown hover:border-brand-brown transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add to cart
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-full border border-brand-brown/20 px-1.5">
                <button onClick={onRemove} aria-label="Remove one" className="w-7 h-7 rounded-full font-black text-brand-brown hover:bg-brand-oat">−</button>
                <span className="text-sm font-black text-brand-brown">{qty}</span>
                <button onClick={onAdd} disabled={!canAdd} aria-label="Add one" className="w-7 h-7 rounded-full font-black text-brand-brown hover:bg-brand-oat disabled:opacity-40 disabled:cursor-not-allowed">+</button>
              </div>
            )}
            <button
              onClick={onBuy}
              className={`${product.dbId ? "" : "col-span-2 "}px-3 py-2.5 rounded-full text-[10px] font-black tracking-[0.12em] uppercase bg-brand-brown text-white hover:bg-brand-orange transition-colors active:scale-95 shadow-sm`}
            >
              Buy now
            </button>
          </div>
          {!canAdd && <p className="text-[10px] font-bold text-brand-brown/50 text-center">{LIMIT_HINT}</p>}
        </div>
      </div>
    </div>
  );
}
