"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./CartContext";

export default function CartDrawer() {
  const { items, isOpen, totalItems, totalPrice, closeCart, removeItem, increment, decrement } =
    useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[90] h-full w-full max-w-[420px] bg-brand-oat shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-charcoal/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-brand-charcoal" />
            <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal">
              Your Cart
            </h2>
            {totalItems > 0 && (
              <span className="bg-brand-terracotta text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full bg-brand-charcoal/5 hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all duration-300 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
              <ShoppingBag size={48} className="text-brand-charcoal/20" />
              <p className="font-black text-sm tracking-[0.15em] uppercase text-brand-charcoal/40">
                Your cart is empty
              </p>
              <p className="text-xs text-brand-charcoal/30 font-medium">
                Add something wild.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white rounded-[1.5rem] p-3 shadow-sm"
              >
                {/* Product image */}
                <div
                  className={`w-16 h-16 rounded-[1rem] ${item.bgColor} flex items-center justify-center shrink-0 overflow-hidden`}
                >
                  <div className="relative w-12 h-12">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs tracking-[0.1em] uppercase text-brand-charcoal truncate">
                    {item.name}
                  </p>
                  <p className="font-black text-brand-terracotta text-sm mt-0.5">
                    {item.price}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => decrement(item.id)}
                      className="w-6 h-6 rounded-full bg-brand-charcoal/10 hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-black text-xs text-brand-charcoal w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.id)}
                      className="w-6 h-6 rounded-full bg-brand-charcoal/10 hover:bg-brand-terracotta hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Line total + remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-black text-xs text-brand-charcoal">
                    ₹{(item.priceNum * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-brand-charcoal/30 hover:text-brand-terracotta transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-charcoal/10 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs tracking-[0.15em] uppercase text-brand-charcoal/50">
                Subtotal
              </span>
              <span className="font-black text-lg text-brand-charcoal">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-brand-charcoal/40 font-medium -mt-2">
              Shipping calculated at checkout
            </p>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300 text-center"
            >
              Review Order
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-brand-charcoal/50 hover:text-brand-terracotta text-[10px] font-black tracking-[0.15em] uppercase transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
