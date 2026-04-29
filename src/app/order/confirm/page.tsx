"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function ConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { router.replace("/order"); return; }
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse">
          Confirming...
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center px-5">
        <p className="font-black text-brand-charcoal/40 text-center">Order not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo */}
        <Image src="/logo.png" alt="WWY" width={56} height={56} className="object-contain opacity-80" />

        {/* Heading */}
        <div className="text-center">
          <p className="text-[11px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-3">
            Order Received
          </p>
          <h1 className="font-black text-brand-charcoal leading-none tracking-tighter mb-3"
            style={{ fontSize: "clamp(2.2rem, 9vw, 3rem)" }}>
            YOUR ORDER HAS<br />ENTERED<br />FERMENTATION.
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/40 leading-relaxed">
            We'll send payment details to your flat. Once confirmed, the baking begins.
          </p>
          <p className="text-sm font-black italic text-brand-charcoal/30 mt-2">
            "Food that is still becoming."
          </p>
        </div>

        {/* Order summary card */}
        <div className="w-full bg-white rounded-2xl border border-brand-charcoal/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-charcoal/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Order</p>
                <p className="font-black text-brand-charcoal text-sm">
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Flat</p>
                <p className="font-black text-brand-charcoal text-sm">{order.flat_number}</p>
              </div>
            </div>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="px-5 py-3 flex flex-col gap-2 border-b border-brand-charcoal/5">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-brand-charcoal/70">
                    {item.quantity}× {item.product_name}
                  </span>
                  <span className="text-sm font-black text-brand-charcoal">
                    {fmt(item.quantity * item.unit_price_paise)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-4 flex justify-between items-center">
            <span className="font-black text-brand-charcoal text-sm">Total</span>
            <span className="font-black text-brand-charcoal text-lg">{fmt(order.total_paise)}</span>
          </div>
        </div>

        {/* Delivery note */}
        <div className="w-full bg-brand-gold/20 rounded-2xl px-5 py-4 border border-brand-gold/30 text-center">
          <p className="text-xs font-black text-brand-charcoal">
            Delivery: Wednesday &amp; Saturday only
          </p>
          <p className="text-xs font-medium text-brand-charcoal/50 mt-1">
            Payment must be confirmed within 2 hours. UPI link coming shortly.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => router.push("/order/history")}
            className="w-full bg-brand-charcoal hover:bg-brand-terracotta text-white rounded-2xl py-4 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98]"
          >
            Track My Order
          </button>
          <button
            onClick={() => router.push("/order")}
            className="w-full text-brand-charcoal/40 hover:text-brand-terracotta font-black text-xs tracking-wider uppercase transition-colors py-2"
          >
            Order more →
          </button>
        </div>

      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse">Loading...</p>
      </main>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
