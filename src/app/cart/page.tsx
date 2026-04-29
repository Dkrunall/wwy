"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 80;

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, increment, decrement } = useCart();

  const shipping = totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const orderTotal = totalPrice + shipping;

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-40 pb-24">

        {/* Page Header */}
        <div className="mb-10 sm:mb-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 hover:text-brand-terracotta transition-colors mb-6"
          >
            <ArrowLeft size={13} />
            Continue Shopping
          </Link>
          <div className="flex items-baseline gap-4">
            <h1
              className="font-black text-brand-charcoal tracking-tighter leading-none"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
            >
              YOUR CART
            </h1>
            {totalItems > 0 && (
              <span className="font-black text-brand-terracotta text-lg sm:text-2xl">
                ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-brand-charcoal/5 flex items-center justify-center">
              <ShoppingBag size={40} className="text-brand-charcoal/20" />
            </div>
            <div>
              <p className="font-black text-lg tracking-[0.1em] uppercase text-brand-charcoal/30 mb-2">
                Nothing here yet.
              </p>
              <p className="text-sm text-brand-charcoal/30 font-medium">
                Slow-fermented things take time. Browse the range.
              </p>
            </div>
            <Link
              href="/"
              className="mt-4 bg-brand-charcoal text-white hover:bg-brand-terracotta px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95"
            >
              Shop the Range
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-16 items-start">

            {/* ── Cart Items ── */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Column headers — desktop only */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 pb-3 border-b border-brand-charcoal/10">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Product</span>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 w-28 text-center">Quantity</span>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 w-20 text-right">Total</span>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-4 sm:gap-6 items-center bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 shadow-sm border border-brand-charcoal/5"
                >
                  {/* Image */}
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[1rem] sm:rounded-[1.25rem] ${item.bgColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain mix-blend-multiply"
                      />
                    </div>
                  </div>

                  {/* Name + price + remove */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">
                      {item.name}
                    </span>
                    <span className="font-black text-brand-terracotta text-base sm:text-lg">
                      {item.price}
                    </span>
                    {/* Mobile qty + remove */}
                    <div className="flex items-center gap-3 mt-2 sm:hidden">
                      <div className="flex items-center gap-2 bg-brand-charcoal/5 rounded-full px-3 py-1.5">
                        <button
                          onClick={() => decrement(item.id)}
                          className="w-5 h-5 rounded-full hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="font-black text-xs text-brand-charcoal w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increment(item.id)}
                          className="w-5 h-5 rounded-full hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-brand-charcoal/25 hover:text-brand-terracotta transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Desktop qty controls */}
                  <div className="hidden sm:flex items-center gap-2 bg-brand-charcoal/5 rounded-full px-4 py-2 w-28 justify-center">
                    <button
                      onClick={() => decrement(item.id)}
                      className="w-6 h-6 rounded-full hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-black text-xs text-brand-charcoal w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.id)}
                      className="w-6 h-6 rounded-full hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  {/* Desktop line total + remove */}
                  <div className="hidden sm:flex flex-col items-end gap-2 w-20">
                    <span className="font-black text-sm text-brand-charcoal">
                      ₹{(item.priceNum * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-brand-charcoal/25 hover:text-brand-terracotta transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order Summary ── */}
            <div className="w-full lg:w-[480px] shrink-0">
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5 lg:sticky lg:top-28">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-6">
                  Order Summary
                </h2>

                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-charcoal/50 tracking-wide">Subtotal</span>
                    <span className="font-black text-sm text-brand-charcoal">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-charcoal/50 tracking-wide">Shipping</span>
                    {shipping === 0 ? (
                      <span className="font-black text-sm text-brand-olive">Free</span>
                    ) : (
                      <span className="font-black text-sm text-brand-charcoal">₹{SHIPPING_COST}</span>
                    )}
                  </div>

                  {shipping > 0 && (
                    <div className="bg-brand-oat rounded-xl px-4 py-3 text-[10px] font-bold text-brand-charcoal/50 tracking-wide">
                      Add ₹{(SHIPPING_THRESHOLD - totalPrice).toLocaleString()} more for free shipping
                      <div className="mt-2 h-1 bg-brand-charcoal/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-terracotta rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((totalPrice / SHIPPING_THRESHOLD) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-brand-charcoal/10 my-1" />

                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs tracking-[0.15em] uppercase text-brand-charcoal">Total</span>
                    <span className="font-black text-xl text-brand-charcoal">₹{orderTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-brand-charcoal text-white hover:bg-brand-terracotta text-center py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300"
                >
                  Proceed to Checkout
                </Link>

                <p className="text-center text-[10px] text-brand-charcoal/30 font-medium mt-4">
                  Taxes calculated at checkout
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
