"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InstaLink from "@/components/InstaLink";
import { canAddToCart, LIMIT_HINT } from "@/lib/orderLimits";
import { readCart, writeCart, type CartLine } from "@/lib/cartStorage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import ProductHead from "@/components/ProductHead";
import AllergenChips from "@/components/AllergenChips";
import { dietOf, DIET_LABEL } from "@/lib/diet";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import PincodeCheck from "@/components/PincodeCheck";
import { BUSINESS } from "@/lib/business";
import { cutoffRuleText, deliveryDaysShort } from "@/lib/schedule";
import { FLAVOURS } from "@/lib/flavours";

export default function ShopClient({
  products,
  bakeDays,
  everyday,
}: {
  products: Product[];
  bakeDays: Record<string, string>;
  everyday: string[];
}) {
  const router = useRouter();
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
  const filtered = products;

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
            <span className="text-brand-orange text-[11px] font-black tracking-[0.2em] uppercase">Made to order</span>
            <p className="font-serif text-xl sm:text-2xl text-brand-brown tracking-tight leading-snug">
              Delivery {deliveryDaysShort()} only. Orders close {cutoffRuleText()}.
            </p>
            <div className="mt-1">
              <PincodeCheck />
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-8 flex flex-col gap-3">
            <span className="text-brand-orange text-[11px] font-black tracking-[0.2em] uppercase">Flavours we bake</span>
            <div className="flex flex-wrap gap-2">
              {FLAVOURS.map((f) => (
                <span key={f} className="px-3.5 py-1.5 rounded-full bg-brand-oat border border-brand-brown/10 text-[11px] font-black tracking-wide text-brand-brown/70">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-brand-brown/65">
              Flavours rotate weekly. <InstaLink>Follow us on Insta @{BUSINESS.instagramHandle}</InstaLink>
            </p>
          </div>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-8 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {[
            { title: "Flavours of the week", list: filtered.filter((p) => !everyday.includes(p.name)) },
            { title: "Every bake", list: filtered.filter((p) => everyday.includes(p.name)) },
          ]
            .filter((g) => g.list.length > 0)
            .map((g) => (
              <div key={g.title}>
                <h3 className="font-serif font-normal text-brand-brown text-2xl sm:text-3xl tracking-tight mb-4">{g.title}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {g.list.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      bakeDays={bakeDays[product.name]}
                      qty={qtyOf(product)}
                      canAdd={!product.dbId || canAddToCart(cart, product.dbId)}
                      onAdd={() => changeQty(product, 1)}
                      onRemove={() => changeQty(product, -1)}
                      onBuy={() => buyNow(product)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
 
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <ShoppingBag size={40} className="text-brand-brown/20" />
            <h3 className="font-serif font-normal text-2xl text-brand-brown">Nothing in this batch. Yet.</h3>
            <p className="text-sm font-bold text-brand-brown/60 max-w-sm">
              This collection is between batches. Check back soon for the next round of good things.
            </p>
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
          <p className="text-brand-oat/70 font-bold text-sm">Browse, add to cart, pay securely. We bake and deliver.</p>
          <p className="text-brand-oat/70 font-bold text-xs mt-1 italic">Delivery {deliveryDaysShort()} only.</p>
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
  bakeDays,
  qty,
  canAdd,
  onAdd,
  onRemove,
  onBuy,
}: {
  product: Product;
  bakeDays?: string;
  qty: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onBuy: () => void;
}) {
  const diet = dietOf(product.declarations?.ingredients, product.declarations?.allergens);
  return (
    <div className="group flex flex-col bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden border border-brand-brown/5 shadow-sm hover:shadow-xl transition-all duration-500">
      <ProductHead
        name={product.name}
        label={product.badge}
        ingredients={product.declarations?.ingredients}
        allergens={product.declarations?.allergens}
        className=""
      />

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-6 gap-2.5 sm:gap-3">
        <div>
          {bakeDays && (
            <p className="text-[11px] font-black tracking-[0.15em] uppercase text-brand-orange">Baked for {bakeDays}</p>
          )}
          {product.desc && (
            <p className="hidden sm:block text-sm font-medium text-brand-brown/70 mt-2 leading-relaxed line-clamp-2">{product.desc}</p>
          )}
          <AllergenChips allergens={product.declarations?.allergens} className="mt-2.5" />
        </div>
 
        <details className="group/details text-xs font-medium text-brand-brown/75">
          <summary className="cursor-pointer list-none block py-2.5 text-[11px] font-black tracking-[0.18em] uppercase text-brand-brown/70 hover:text-brand-orange">
            Ingredients & details
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
          <span className="font-black text-brand-orange text-base sm:text-lg">{product.price}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {!product.dbId ? null : qty === 0 ? (
              <button
                onClick={onAdd}
                disabled={!canAdd}
                className="px-3 py-2.5 rounded-full text-[11px] font-black tracking-[0.12em] uppercase border border-brand-brown/20 text-brand-brown hover:border-brand-brown transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
              className={`${product.dbId ? "" : "col-span-2 "}px-3 py-2.5 rounded-full text-[11px] font-black tracking-[0.12em] uppercase bg-brand-brown text-white hover:bg-brand-orange transition-colors active:scale-95 shadow-sm`}
            >
              Buy now
            </button>
          </div>
          {!canAdd && <p className="text-[11px] font-bold text-brand-brown/65 text-center">{LIMIT_HINT}</p>}
        </div>
      </div>
    </div>
  );
}
