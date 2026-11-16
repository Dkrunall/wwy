"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CART_EVENT, readCart, writeCart, type CartLine } from "@/lib/cartStorage";
import { canAddToCart } from "@/lib/orderLimits";
import type { Product } from "@/lib/products";

function subscribe(onChange: () => void) {
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): string {
  try {
    return localStorage.getItem("wwy_cart") || "[]";
  } catch {
    return "[]";
  }
}

// The shared cart (localStorage "wwy_cart"), kept in sync across every component that uses it.
export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const cart = useMemo<CartLine[]>(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [raw]);

  const qtyOf = (p: Product) => (p.dbId ? cart.find((i) => i.product_id === p.dbId)?.quantity ?? 0 : 0);
  const canAdd = (p: Product) => !!p.dbId && canAddToCart(cart, p.dbId);

  const change = (p: Product, delta: number) => {
    const id = p.dbId;
    const current = readCart();
    if (!id || (delta > 0 && !canAddToCart(current, id))) return;
    const existing = current.find((i) => i.product_id === id);
    const next = existing
      ? current.map((i) => (i.product_id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0)
      : delta > 0
        ? [...current, { product_id: id, product_name: p.name, quantity: delta, unit_price_paise: Math.round(p.priceNum * 100) }]
        : current;
    writeCart(next);
  };

  return {
    cart,
    qtyOf,
    canAdd,
    add: (p: Product) => change(p, 1),
    remove: (p: Product) => change(p, -1),
    count: cart.reduce((s, i) => s + i.quantity, 0),
    totalPaise: cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0),
  };
}
