"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price_paise: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_paise: number;
  payment_status: string;
  delivery_date: string | null;
  order_items: OrderItem[];
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const razorpayOrderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, total_paise, payment_status, delivery_date, order_items(product_name, quantity, unit_price_paise)")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();
    setOrder(data as Order | null);
    setLoading(false);
  }, [razorpayOrderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Auto-redirect if already paid
  useEffect(() => {
    if (order?.payment_status === "paid") {
      const t = setTimeout(() => router.push(`/order/confirm?id=${order.id}`), 2500);
      return () => clearTimeout(t);
    }
  }, [order, router]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setError("");
    try {
      await loadRazorpayScript();
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: razorpayOrderId,
        amount: order.total_paise,
        currency: "INR",
        name: "Wild Wild Yeast",
        description: `Order ${order.order_number}`,
        prefill: { name: order.customer_name },
        theme: { color: "#2C1A0E" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const res = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (res.ok) {
            router.push(`/order/confirm?id=${order.id}`);
          } else {
            setError("Payment verification failed. Please contact us with your payment ID.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Could not load payment. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <p className="font-black text-[#2C1A0E]/30 tracking-widest text-xs uppercase animate-pulse">Loading...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center px-5 gap-5">
        <p className="font-black text-2xl text-[#2C1A0E]/30 tracking-tight">Order Not Found</p>
        <p className="text-sm text-[#2C1A0E]/40 text-center">This payment link may have expired or already been used.</p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => router.push("/order")}
            className="w-full bg-[#2C1A0E] text-white font-black text-sm tracking-wider uppercase px-6 py-3 rounded-2xl hover:bg-[#C9A96E] transition-all"
          >
            ← Back to Shop
          </button>
          <button
            onClick={() => router.push("/order/account")}
            className="w-full bg-white border border-[#2C1A0E]/10 text-[#2C1A0E]/50 font-black text-xs tracking-wider uppercase px-6 py-3 rounded-2xl hover:bg-[#FAF6F0] transition-all"
          >
            My Orders
          </button>
        </div>
      </main>
    );
  }

  if (order.payment_status === "paid") {
    return (
      <main className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-center">
          <p className="text-[11px] font-black tracking-[0.25em] uppercase text-green-600 mb-3">✓ Already Paid</p>
          <p className="font-black text-[#2C1A0E] text-2xl tracking-tight">Order {order.order_number}</p>
          <p className="text-sm text-[#2C1A0E]/40 mt-2">This order has already been paid. Thank you! 🌾</p>
          <p className="text-xs text-[#2C1A0E]/30 mt-1">Redirecting to your order...</p>
        </div>
        <button
          onClick={() => router.push(`/order/confirm?id=${order.id}`)}
          className="bg-[#2C1A0E] text-white font-black text-sm tracking-wider uppercase px-6 py-3 rounded-2xl hover:bg-[#C9A96E] transition-all"
        >
          View Order →
        </button>
      </main>
    );
  }

  const deliveryLabel = order.delivery_date
    ? new Date(order.delivery_date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-[11px] font-black tracking-[0.25em] uppercase text-[#C9A96E] mb-2">Wild Wild Yeast</p>
          <h1 className="font-black text-[#2C1A0E] leading-none tracking-tighter"
            style={{ fontSize: "clamp(1.8rem, 8vw, 2.4rem)" }}>
            COMPLETE YOUR<br />ORDER
          </h1>
          {deliveryLabel && (
            <p className="text-sm font-bold text-[#2C1A0E]/40 mt-2">Delivery: {deliveryLabel}</p>
          )}
        </div>

        {/* Order summary card */}
        <div className="bg-white rounded-2xl border border-[#2C1A0E]/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2C1A0E]/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#2C1A0E]/30">Order</p>
                <p className="font-black text-[#2C1A0E] text-sm">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#2C1A0E]/30">Customer</p>
                <p className="font-black text-[#2C1A0E] text-sm">{order.customer_name}</p>
              </div>
            </div>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="px-5 py-3 flex flex-col gap-2 border-b border-[#2C1A0E]/5">
              {order.order_items.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#2C1A0E]/70">
                    {item.quantity}× {item.product_name}
                  </span>
                  <span className="text-sm font-black text-[#2C1A0E]">
                    {fmt(item.quantity * item.unit_price_paise)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-4 flex justify-between items-center">
            <span className="font-black text-[#2C1A0E] text-sm">Total</span>
            <span className="font-black text-[#2C1A0E] text-xl">{fmt(order.total_paise)}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
            <p className="text-xs font-black text-red-800">{error}</p>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-[#2C1A0E] hover:bg-[#C9A96E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm tracking-[0.15em] uppercase rounded-2xl py-5 transition-all duration-300 active:scale-[0.98]"
        >
          {paying ? "Opening Payment..." : `Pay ${fmt(order.total_paise)} →`}
        </button>

        <p className="text-center text-[11px] font-bold text-[#2C1A0E]/30">
          Secured by Razorpay · UPI / Cards / Net Banking
        </p>
      </div>
    </main>
  );
}
