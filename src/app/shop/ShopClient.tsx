"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuCard from "@/components/MenuCard";
import CartBar from "@/components/CartBar";
import PincodeCheck from "@/components/PincodeCheck";
import InstaLink from "@/components/InstaLink";
import { useCart } from "@/lib/useCart";
import { DELIVERY_CHARGE_TEXT } from "@/lib/shipping";
import type { MenuData } from "@/lib/menuData";

const ALL = "all";

// The one menu page: the next two weeks of bakes, filtered by bake day and search.
export default function ShopClient({ products, bakes, bakeDays }: MenuData) {
  const cart = useCart();
  const qParam = useSearchParams().get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [lastQ, setLastQ] = useState(qParam);
  if (qParam !== lastQ) {
    setLastQ(qParam);
    setQuery(qParam);
  }
  const [bake, setBake] = useState(ALL);

  const pickBake = (iso: string) => {
    setBake(iso);
    // The cart offers this day first at checkout.
    try {
      if (iso === ALL) localStorage.removeItem("wwy_bake_date");
      else localStorage.setItem("wwy_bake_date", iso);
    } catch {}
  };

  const active = bakes.find((b) => b.iso === bake);
  const q = query.trim().toLowerCase();
  const shown = products.filter(
    (p) => (!active || active.items.includes(p.name)) && (!q || `${p.name} ${p.desc} ${p.declarations?.ingredients ?? ""}`.toLowerCase().includes(q))
  );

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />

      {/* Header */}
      <section className="w-full bg-brand-brown px-4 sm:px-8 xl:px-16 pt-32 sm:pt-36 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="text-brand-gold text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2 block">Order online</span>
            <h1 className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
              The menu.
            </h1>
            <p className="text-sm sm:text-base font-bold text-brand-oat/75 mt-3 max-w-xl leading-relaxed">
              Baked to order twice a week. {DELIVERY_CHARGE_TEXT}
            </p>
          </div>
          <div className="lg:pb-1">
            <PincodeCheck tone="dark" />
          </div>
        </div>
      </section>

      {/* Bake day tabs + search */}
      <div className="sticky top-20 sm:top-24 z-30 bg-brand-oat/95 backdrop-blur-md border-b border-brand-brown/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-16 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0" role="tablist" aria-label="Bake day">
            {[{ iso: ALL, label: "All" }, ...bakes].map((b) => (
              <button
                key={b.iso}
                role="tab"
                aria-selected={bake === b.iso}
                onClick={() => pickBake(b.iso)}
                className={`shrink-0 h-10 px-4 rounded-full text-xs font-black tracking-[0.1em] uppercase border transition-colors ${
                  bake === b.iso ? "bg-brand-brown text-white border-brand-brown" : "bg-white text-brand-brown/75 border-brand-brown/15 hover:border-brand-brown/40"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <label className="relative md:ml-auto md:w-64">
            <span className="sr-only">Search the menu</span>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/50" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-brand-brown/15 text-sm font-bold text-brand-brown placeholder:text-brand-brown/45 outline-none focus:border-brand-orange"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-brand-brown/60">
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Products */}
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-6 sm:pt-8 pb-28">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-bold text-brand-brown/75 mb-5">
            {active ? (
              <>
                Baked for <span className="text-brand-brown font-black">{active.label}</span>. Order by {active.orderBy}.
              </>
            ) : (
              <>Our next two weeks of bakes. Pick a day to see what&apos;s baking.</>
            )}
          </p>

          {shown.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {shown.map((p) => (
                <MenuCard key={p.id} product={p} bakeDays={active ? undefined : bakeDays[p.name]} cart={cart} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <p className="font-serif text-2xl text-brand-brown">Nothing matches that.</p>
              <p className="text-sm font-bold text-brand-brown/70">Try another search or bake day.</p>
              <button
                onClick={() => {
                  setQuery("");
                  pickBake(ALL);
                }}
                className="mt-2 h-10 px-6 rounded-full bg-brand-brown text-white text-xs font-black tracking-[0.12em] uppercase"
              >
                Show everything
              </button>
            </div>
          )}

          <p className="text-sm font-bold text-brand-brown/70 mt-10">
            New flavours are announced every week. <InstaLink>Follow us on Instagram</InstaLink>.
          </p>
        </div>
      </section>

      <CartBar cart={cart} />
      <Footer />
    </main>
  );
}
