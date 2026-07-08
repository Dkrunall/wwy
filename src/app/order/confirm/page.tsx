"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface OrderWithItems {
  id: string;
  order_number: string;
  flat_number: string;
  customer_name: string;
  total_paise: number;
  payment_status: string;
  delivery_status: string;
  delivery_date: string | null;
  invoice_url: string | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price_paise: number }[];
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function ConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("id");
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { router.replace("/order"); return; }
    supabase
      .from("orders")
      .select("id, order_number, flat_number, customer_name, total_paise, payment_status, delivery_status, delivery_date, invoice_url, order_items(*)")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data as OrderWithItems | null);
        setLoading(false);
      });
  }, [orderId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse">Confirming...</p>
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

  const isPaid = order.payment_status === "paid";

  return (
    <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <Image src="/WWY-LOGO_White.png" alt="WWY" width={56} height={56} className="object-contain opacity-80" />

        <div className="text-center">
          <p className={`text-[11px] font-black tracking-[0.25em] uppercase mb-3 ${isPaid ? "text-green-600" : "text-brand-terracotta"}`}>
            {isPaid ? "✓ Payment Received" : "Order Received"}
          </p>
          <h1 className="font-black text-brand-charcoal leading-none tracking-tighter mb-3"
            style={{ fontSize: "clamp(2rem, 9vw, 2.8rem)" }}>
            {isPaid ? "YOUR ORDER HAS\nENTERED\nFERMENTATION." : "YOUR ORDER HAS\nBEEN RECEIVED."}
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/40 leading-relaxed">
            {isPaid
              ? "Payment confirmed. Baking begins soon. We'll WhatsApp you on delivery day."
              : "Complete payment to confirm your order. Details were sent to WhatsApp."}
          </p>
        </div>

        {/* Order summary */}
        <div className="w-full bg-white rounded-2xl border border-brand-charcoal/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-charcoal/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Order</p>
                <p className="font-black text-brand-charcoal text-sm">
                  {order.order_number || order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Flat</p>
                <p className="font-black text-brand-charcoal text-sm">{order.flat_number}</p>
              </div>
            </div>
            {order.delivery_date && (
              <p className="text-xs font-bold text-brand-charcoal/40 mt-2">
                Delivery: {new Date(order.delivery_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            )}
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

        {/* Invoice download */}
        {order.invoice_url && (
          <a
            href={order.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-brand-gold/20 border border-brand-gold/30 rounded-2xl px-5 py-3 text-xs font-black tracking-wider uppercase text-brand-charcoal hover:bg-brand-gold/30 transition-colors"
          >
            ↓ Download Invoice
          </a>
        )}

        {!isPaid && (
          <div className="w-full bg-amber-50 rounded-2xl px-5 py-4 border border-amber-200 text-center">
            <p className="text-xs font-black text-amber-800">Payment pending</p>
            <p className="text-xs font-medium text-amber-700/70 mt-1">
              Complete payment to confirm your order. Check your WhatsApp for the UPI link.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => router.push("/order/account")}
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
