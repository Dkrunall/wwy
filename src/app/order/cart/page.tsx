"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, CartItem } from "@/lib/supabase";

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

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [flat, setFlat] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setFlat(storedFlat);
    setCustomerId(localStorage.getItem("wwy_customer_id") || "");
    setCustomerName(localStorage.getItem("wwy_name") || "");
    setCart(getCart());
  }, [router]);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0);
      saveCart(next);
      return next;
    });
  };

  const total = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setError("");
    setLoading(true);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId || null,
        flat_number: flat,
        customer_name: customerName,
        total_paise: total,
        notes: notes.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (orderErr || !order) {
      setError("Something went wrong placing your order. Try again.");
      setLoading(false);
      return;
    }

    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_paise: i.unit_price_paise,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(items);

    if (itemsErr) {
      setError("Order saved but items failed. Please contact us.");
      setLoading(false);
      return;
    }

    localStorage.removeItem("wwy_cart");
    router.push(`/order/confirm?id=${order.id}`);
  };

  if (cart.length === 0 && !loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 gap-6">
        <p className="font-black text-brand-charcoal/30 text-2xl tracking-tight">Nothing here yet.</p>
        <button
          onClick={() => router.push("/order")}
          className="bg-brand-charcoal text-white font-black text-sm tracking-wider uppercase px-8 py-4 rounded-2xl hover:bg-brand-terracotta transition-colors"
        >
          ← Back to shop
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat pb-40">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-oat/95 backdrop-blur-sm border-b border-brand-charcoal/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-brand-charcoal/40 hover:text-brand-charcoal transition-colors font-black text-xl leading-none"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="font-black text-brand-charcoal text-base tracking-tight">Your Order</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-3">

        {/* Flat badge */}
        <p className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">
          Flat {flat} · {customerName}
        </p>

        {/* Cart items */}
        <div className="flex flex-col gap-2">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-brand-charcoal/5"
            >
              <div className="flex-1 min-w-0">
                <p className="font-black text-brand-charcoal text-sm leading-tight">{item.product_name}</p>
                <p className="text-xs font-bold text-brand-charcoal/40">{fmt(item.unit_price_paise)} each</p>
              </div>
              <div className="flex items-center gap-2 bg-brand-oat rounded-xl overflow-hidden shrink-0">
                <button
                  onClick={() => updateQty(item.product_id, -1)}
                  className="w-9 h-9 flex items-center justify-center font-black text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors"
                >
                  −
                </button>
                <span className="font-black text-brand-charcoal text-sm w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.product_id, 1)}
                  className="w-9 h-9 flex items-center justify-center font-black text-brand-terracotta hover:bg-brand-terracotta/10 transition-colors"
                >
                  +
                </button>
              </div>
              <span className="font-black text-brand-charcoal text-sm shrink-0 w-14 text-right">
                {fmt(item.quantity * item.unit_price_paise)}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">
            Any notes?
          </label>
          <textarea
            rows={2}
            placeholder="Allergies, special requests, anything for the baker..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border-2 border-brand-charcoal/10 focus:border-brand-terracotta rounded-2xl px-4 py-3 font-medium text-brand-charcoal text-sm placeholder:text-brand-charcoal/20 outline-none transition-colors resize-none"
          />
        </div>

        {/* Delivery note */}
        <div className="bg-brand-gold/20 rounded-2xl px-4 py-3 border border-brand-gold/30">
          <p className="text-xs font-black text-brand-charcoal">
            Delivery: Wednesday &amp; Saturday only
          </p>
          <p className="text-xs font-medium text-brand-charcoal/60 mt-0.5">
            Your next available delivery date will be confirmed after ordering.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-brand-charcoal/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-brand-charcoal/50">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            <span className="text-xs font-bold text-brand-charcoal/50">{fmt(total)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-brand-charcoal/5">
            <span className="font-black text-brand-charcoal text-sm">Total</span>
            <span className="font-black text-brand-charcoal text-lg">{fmt(total)}</span>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-brand-terracotta text-center">{error}</p>
        )}
      </div>

      {/* Place order */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-brand-oat/80 backdrop-blur-md border-t border-brand-charcoal/5">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <button
            onClick={placeOrder}
            disabled={loading || cart.length === 0}
            className="w-full bg-brand-charcoal hover:bg-brand-terracotta disabled:opacity-50 text-white rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
          >
            {loading ? "Placing order..." : `Place Order · ${fmt(total)}`}
          </button>
          <p className="text-[10px] font-bold text-brand-charcoal/30 text-center">
            Payment details will be shared on WhatsApp after confirmation.
          </p>
        </div>
      </div>
    </main>
  );
}
