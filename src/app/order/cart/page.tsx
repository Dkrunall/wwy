"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartItem } from "@/lib/supabase";
import { getAvailableDeliverySlots, deliveryDateISO, formatDeliveryDate } from "@/lib/dateUtils";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("wwy_cart") || "[]"); }
  catch { return []; }
}
function saveCart(cart: CartItem[]) {
  localStorage.setItem("wwy_cart", JSON.stringify(cart));
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
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
  const [discountInfo, setDiscountInfo] = useState<{ discountPercent: number; finalTotal: number } | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState<string>("");
  const [deliverySlots, setDeliverySlots] = useState<{ iso: string; label: string }[]>([]);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>("");

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setFlat(storedFlat);
    setCustomerId(localStorage.getItem("wwy_customer_id") || "");
    setCustomerName(localStorage.getItem("wwy_name") || "");
    setCart(getCart());

    const slots = getAvailableDeliverySlots(5).map((d) => ({
      iso: deliveryDateISO(d),
      label: formatDeliveryDate(d),
    }));
    setDeliverySlots(slots);
    setSelectedDeliveryDate(slots[0]?.iso || "");

    // Load Razorpay checkout SDK
    if (!document.getElementById("razorpay-sdk")) {
      const s = document.createElement("script");
      s.id = "razorpay-sdk";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, [router]);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0);
      saveCart(next);
      return next;
    });
    setDiscountInfo(null);
  };

  const baseTotalPaise = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
  const displayTotal = discountInfo ? discountInfo.finalTotal : baseTotalPaise;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePay = async () => {
    if (cart.length === 0) return;
    setError("");
    setLoading(true);

    try {
      // 1. Create Razorpay order + save pending order
      const res = await fetch("/api/orders/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customerId, flat, customerName, notes, deliveryDate: selectedDeliveryDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to initiate order. Try again.");
        setLoading(false);
        return;
      }

      const { orderId, orderNumber, razorpayOrderId, amount, keyId, discountPercent, deliveryLabel: dl } = await res.json();
      setDiscountInfo({ discountPercent, finalTotal: amount });
      setDeliveryLabel(dl);

      // 2. Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "Wild Wild Yeast",
        description: `Order ${orderNumber}`,
        image: "/logo.png",
        theme: { color: "#2C1A0E" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // 3. Verify payment
          const verifyRes = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            localStorage.removeItem("wwy_cart");
            router.push(`/order/confirm?id=${orderId}`);
          } else {
            setError("Payment verification failed. Contact support with your payment ID.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled. Your order is saved — you can retry.");
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
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
            <button onClick={() => router.back()}
              className="text-brand-charcoal/40 hover:text-brand-charcoal transition-colors font-black text-xl leading-none">
              ←
            </button>
            <h1 className="font-black text-brand-charcoal text-base tracking-tight">Your Order</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-3">

          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">
            Flat {flat} · {customerName}
          </p>

          {/* Cart items */}
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <div key={item.product_id}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-brand-charcoal/5">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-brand-charcoal text-sm leading-tight">{item.product_name}</p>
                  <p className="text-xs font-bold text-brand-charcoal/40">{fmt(item.unit_price_paise)} each</p>
                </div>
                <div className="flex items-center gap-2 bg-brand-oat rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => updateQty(item.product_id, -1)}
                    className="w-9 h-9 flex items-center justify-center font-black text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors">
                    −
                  </button>
                  <span className="font-black text-brand-charcoal text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, 1)}
                    className="w-9 h-9 flex items-center justify-center font-black text-brand-terracotta hover:bg-brand-terracotta/10 transition-colors">
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

          {/* Delivery date selector */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">
              Choose Delivery Date
            </label>
            <div className="flex flex-col gap-2">
              {deliverySlots.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  onClick={() => setSelectedDeliveryDate(slot.iso)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                    selectedDeliveryDate === slot.iso
                      ? "border-brand-charcoal bg-brand-charcoal text-white"
                      : "border-brand-charcoal/10 bg-white text-brand-charcoal hover:border-brand-charcoal/30"
                  }`}
                >
                  <span className="font-black text-sm">{slot.label}</span>
                  {selectedDeliveryDate === slot.iso && (
                    <span className="text-white text-xs font-black tracking-wider uppercase">Selected ✓</span>
                  )}
                </button>
              ))}
            </div>
            {deliveryLabel && (
              <p className="text-[10px] font-bold text-green-700 px-1">
                ✓ Locked in: {deliveryLabel}
              </p>
            )}
          </div>

          {/* Price summary */}
          <div className="bg-white rounded-2xl px-4 py-4 border border-brand-charcoal/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-brand-charcoal/50">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              <span className="text-xs font-bold text-brand-charcoal/50">{fmt(baseTotalPaise)}</span>
            </div>
            {discountInfo && discountInfo.discountPercent > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black text-green-700">Loyalty discount ({discountInfo.discountPercent}% off)</span>
                <span className="text-xs font-black text-green-700">−{fmt(baseTotalPaise - discountInfo.finalTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-brand-charcoal/5">
              <span className="font-black text-brand-charcoal text-sm">Total</span>
              <span className="font-black text-brand-charcoal text-lg">{fmt(displayTotal)}</span>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-brand-terracotta text-center">{error}</p>}
        </div>

        {/* Pay button */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-brand-oat/80 backdrop-blur-md border-t border-brand-charcoal/5">
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            <button
              onClick={handlePay}
              disabled={loading || cart.length === 0}
              className="w-full bg-brand-charcoal hover:bg-brand-terracotta disabled:opacity-50 text-white rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
            >
              {loading ? "Opening payment..." : `Pay · ${fmt(displayTotal)}`}
            </button>
            <p className="text-[10px] font-bold text-brand-charcoal/30 text-center">
              Secure payment via Razorpay · UPI, Cards, Net Banking
            </p>
          </div>
        </div>
      </main>
  );
}
