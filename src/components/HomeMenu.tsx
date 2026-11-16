"use client";

import Link from "next/link";
import MenuCard from "@/components/MenuCard";
import CartBar from "@/components/CartBar";
import { useCart } from "@/lib/useCart";
import type { MenuData } from "@/lib/menuData";

// Homepage: what is on the next bake, with add to cart, and a link to the full two-week menu.
export default function HomeMenu({ products, bakes }: MenuData) {
  const cart = useCart();
  const next = bakes[0];
  const shown = next ? products.filter((p) => next.items.includes(p.name)) : products;

  return (
    <section id="menu" className="w-full bg-brand-oat relative z-10 rounded-t-[2rem] sm:rounded-t-[3rem] -mt-8 sm:-mt-12 px-4 sm:px-8 xl:px-16 pt-10 sm:pt-14 pb-12 sm:pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <span className="text-brand-orange text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2 block">What&apos;s baking right now?</span>
            <h2 className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]" style={{ fontSize: "clamp(1.9rem, 5vw, 3.2rem)" }}>
              {next ? <>On the menu for {next.label}.</> : <>This week&apos;s menu.</>}
            </h2>
            {next && <p className="text-sm font-bold text-brand-brown/75 mt-2">Order by {next.orderBy}.</p>}
          </div>
          <Link href="/shop" className="shrink-0 inline-flex items-center h-11 px-6 rounded-full border border-brand-brown/25 text-xs font-black tracking-[0.12em] uppercase text-brand-brown hover:border-brand-brown w-fit">
            Full two-week menu →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {shown.map((p) => (
            <MenuCard key={p.id} product={p} cart={cart} />
          ))}
        </div>
      </div>
      <CartBar cart={cart} />
    </section>
  );
}
