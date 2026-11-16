"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { ShoppingBag } from "lucide-react";
import type { useCart } from "@/lib/useCart";

// Floating "view cart" bar. Rendered into <body> so no section's stacking context can hide it.
export default function CartBar({ cart }: { cart: ReturnType<typeof useCart> }) {
  if (cart.count === 0 || typeof document === "undefined") return null;
  return createPortal(
    <Link
      href="/order/cart"
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-3 bg-brand-brown text-white hover:bg-brand-orange pl-5 pr-6 h-12 rounded-full shadow-2xl text-[11px] sm:text-xs font-black tracking-[0.12em] uppercase whitespace-nowrap transition-colors"
    >
      <ShoppingBag size={16} aria-hidden="true" />
      <span>
        {cart.count} {cart.count === 1 ? "item" : "items"} · ₹{(cart.totalPaise / 100).toLocaleString("en-IN")}
      </span>
      <span className="text-brand-gold">Checkout →</span>
    </Link>,
    document.body
  );
}
