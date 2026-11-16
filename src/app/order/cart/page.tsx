"use client";

export const dynamic = "force-dynamic";

import { productFallbackImage } from "@/lib/productImages";
import { bakeHasAll } from "@/lib/menu";
import { canAddToCart } from "@/lib/orderLimits";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Truck,
  Sparkles,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  Tag,
  X,
  Loader2,
} from "lucide-react";
import { CartItem, supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { calculateShippingFee } from "@/lib/shipping";

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


declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes] = useState("");
  const [loading, setLoading] = useState(false);
  const [flat, setFlat] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    discountPercent: number;
    finalTotal: number;
    shippingFeePaise: number;
    couponCode: string | null;
    couponDiscountPaise: number;
  } | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState<string>("");
  const [deliverySlots, setDeliverySlots] = useState<{ iso: string; label: string }[]>([]);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>("");
  const [pincode, setPincode] = useState("");

  // Coupons — auto-applied (welcome / min-order) or manually entered
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description: string | null;
    discount_type: "percent" | "fixed";
    discount_value: number;
    discountPaise: number;
    auto: boolean;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponBoxOpen, setCouponBoxOpen] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [dismissedCouponCode, setDismissedCouponCode] = useState<string | null>(null);

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) {
      router.replace("/order/login?next=/order/cart");
      return;
    }
    setFlat(storedFlat);
    setCustomerId(localStorage.getItem("wwy_customer_id") || "");
    setPincode(localStorage.getItem("wwy_pincode") || "");
    setCart(getCart());

    fetch("/api/orders/delivery-slots")
      .then((r) => r.json())
      .then(({ slots }) => {
        setDeliverySlots(slots || []);
        // Prefer the bake day picked on the menu, if it is still open.
        let preferred = "";
        try { preferred = localStorage.getItem("wwy_bake_date") || ""; } catch {}
        setSelectedDeliveryDate((slots || []).find((s: { iso: string }) => s.iso === preferred)?.iso || slots?.[0]?.iso || "");
      })
      .catch(() => {});

    // Load Razorpay checkout SDK
    if (!document.getElementById("razorpay-sdk")) {
      const s = document.createElement("script");
      s.id = "razorpay-sdk";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, [router]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      if (delta > 0 && !canAddToCart(prev, productId)) return prev;
      const next = prev
        .map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
      saveCart(next);
      return next;
    });
    setDiscountInfo(null);
  };

  const baseTotalPaise = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);

  // Auto-detect eligible coupon (new-user 10%, min-order threshold, etc.) whenever
  // the cart total changes — but never override a coupon the customer typed in.
  useEffect(() => {
    if (appliedCoupon && !appliedCoupon.auto) return; // manual code takes priority
    if (!customerId || baseTotalPaise <= 0) { setAppliedCoupon(null); return; }
    let cancelled = false;
    fetch("/api/coupons/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, subtotalPaise: baseTotalPaise }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const shouldApply = data.coupon && data.coupon.code !== dismissedCouponCode;
        setAppliedCoupon(shouldApply ? { ...data.coupon, discountPaise: data.discountPaise, auto: true } : null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTotalPaise, customerId, dismissedCouponCode]);

  const applyCouponCode = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, subtotalPaise: baseTotalPaise, code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.coupon) {
        setCouponError(data.error || "Invalid coupon code.");
        setCouponLoading(false);
        return;
      }
      setAppliedCoupon({ ...data.coupon, discountPaise: data.discountPaise, auto: false });
      setCouponInput("");
      setCouponBoxOpen(false);
    } catch {
      setCouponError("Failed to apply coupon. Try again.");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    if (appliedCoupon?.auto) setDismissedCouponCode(appliedCoupon.code);
    setAppliedCoupon(null);
    setCouponError("");
  };
  const previewShippingFeePaise = calculateShippingFee(pincode);
  // Each delivery day has its own menu: offer only the days that bake everything in the cart.
  const cartNames = cart.map((i) => i.product_name);
  const bakeSlots = deliverySlots.filter((s) => bakeHasAll(s.iso, cartNames));
  const deliveryISO = bakeSlots.some((s) => s.iso === selectedDeliveryDate) ? selectedDeliveryDate : bakeSlots[0]?.iso ?? "";
  const shippingFeePaise = discountInfo ? discountInfo.shippingFeePaise : previewShippingFeePaise;
  const previewCouponDiscountPaise = appliedCoupon?.discountPaise ?? 0;
  const displayTotal = discountInfo
    ? discountInfo.finalTotal
    : Math.max(0, baseTotalPaise - previewCouponDiscountPaise) + previewShippingFeePaise;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePay = async () => {
    if (cart.length === 0) return;
    if (!customerId) {
      setError("Session error, please sign out and sign in again.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // The server identifies the customer from the login session, so send its token.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/order/login?next=/order/cart");
        return;
      }
      const res = await fetch("/api/orders/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          cart,
          notes,
          deliveryDate: deliveryISO,
          couponCode: appliedCoupon?.code,
          skipAutoCoupon: !appliedCoupon && !!dismissedCouponCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to initiate order. Try again.");
        setLoading(false);
        return;
      }

      const {
        orderId,
        orderNumber,
        razorpayOrderId,
        amount,
        keyId,
        discountPercent,
        shippingFeePaise: sf,
        couponCode: appliedCode,
        couponDiscountPaise: cdp,
        deliveryLabel: dl,
      } = await res.json();
      setDiscountInfo({ discountPercent, finalTotal: amount, shippingFeePaise: sf, couponCode: appliedCode, couponDiscountPaise: cdp });
      setDeliveryLabel(dl);

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "Wild Wild Yeast",
        description: `Order ${orderNumber}`,
        image: "/WWY-LOGO_White.png",
        theme: { color: "#2C1A0E" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
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
            setError("Payment cancelled. Your order is saved, you can retry.");
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
        <Navbar />
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-brand-brown/10 shadow-xl max-w-md w-full text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand-brown">Your Cart is Empty</h2>
            <p className="text-xs sm:text-sm font-medium text-brand-brown/60 mt-1">
              Add sourdough or ginger ale to set your bake in motion.
            </p>
          </div>
          <button
            onClick={() => router.push("/shop")}
            className="bg-brand-brown text-white font-black text-xs tracking-widest uppercase px-8 py-4 rounded-2xl hover:bg-brand-terracotta transition-colors shadow-md cursor-pointer"
          >
            ← Explore Menu &amp; Order
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-oat/40 via-white to-brand-oat/20 pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 xl:px-16 pt-32 sm:pt-40 mb-20 sm:mb-28 flex flex-col gap-6">
        {/* Navigation & Header Banner */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-brown/60 hover:text-brand-brown transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </button>
            <span className="text-xs font-bold bg-brand-terracotta/10 text-brand-terracotta px-3.5 py-1.5 rounded-full border border-brand-terracotta/20 uppercase tracking-wider">
              Flat {flat}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-brand-brown/10 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-widest uppercase text-brand-terracotta mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Artisanal Order Summary
              </span>
              <h1 className="font-serif text-brand-brown font-bold text-2xl sm:text-3xl tracking-tight">
                YOUR ORDER <span className="italic font-light text-brand-terracotta">CART</span>
              </h1>
            </div>
            <span className="text-xs font-bold text-brand-brown/65">
              {itemCount} {itemCount === 1 ? "item" : "items"} selected
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-bold text-rose-700 shadow-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-rose-500 hover:text-rose-800 font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items & Delivery Slots (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Cart Items Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-brand-brown/60">
                  Itemized Order
                </span>
                <span className="text-xs font-bold text-brand-brown/65">{itemCount} items</span>
              </div>

              <div className="flex flex-col divide-y divide-brand-brown/5">
                {cart.map((item) => {
                  const fallbackImg = productFallbackImage(item.product_name);
                  return (
                    <div key={item.product_id} className="flex justify-between items-center py-4 gap-4">
                      {/* Product Thumbnail */}
                      <div className="relative w-14 h-14 rounded-2xl bg-brand-oat/40 border border-brand-brown/10 overflow-hidden shrink-0">
                        <Image
                          src={fallbackImg}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-brand-brown text-base tracking-tight truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-brand-brown/65 font-medium">
                          {fmt(item.unit_price_paise)} each
                        </p>
                      </div>

                      {/* Quantity Controls & Line Price */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-brand-oat/60 rounded-2xl p-1 border border-brand-brown/10">
                          <button
                            onClick={() => updateQty(item.product_id, -1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center font-black text-brand-brown text-sm bg-white rounded-xl shadow-xs hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-brand-brown text-sm w-7 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.product_id, 1)}
                            disabled={!canAddToCart(cart, item.product_id)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center font-black text-white bg-brand-terracotta rounded-xl shadow-xs hover:bg-brand-brown transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-black text-brand-brown text-sm min-w-[55px] text-right">
                          {fmt(item.quantity * item.unit_price_paise)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Slots Selection */}
            {cart.length > 0 && deliverySlots.length > 0 && bakeSlots.length === 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-terracotta/30 shadow-sm text-sm font-bold text-brand-terracotta">
                The items in your cart are baked on different days, so no single delivery day has all of them. Please remove some items and order them separately.
              </div>
            )}
            {bakeSlots.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-brown/60">
                  <Calendar className="w-3.5 h-3.5 text-brand-terracotta" />
                  <span>Select Delivery Day</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {bakeSlots.map((slot) => {
                    const isSelected = deliveryISO === slot.iso;
                    return (
                      <button
                        key={slot.iso}
                        onClick={() => setSelectedDeliveryDate(slot.iso)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-terracotta/10 border-brand-terracotta text-brand-brown shadow-sm ring-2 ring-brand-terracotta/20"
                            : "bg-white border-brand-brown/10 text-brand-brown/60 hover:border-brand-brown/30 hover:bg-brand-oat/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-brand-terracotta">
                            {isSelected ? "Selected Slot" : "Available Slot"}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-terracotta" />}
                        </div>
                        <p className="text-sm font-bold text-brand-brown">{slot.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary Card & Checkout Action (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-sm flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-brand-brown/60 block border-b border-brand-brown/10 pb-3 mb-4">
                  Payment Summary
                </span>

                <div className="flex flex-col gap-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-brand-brown/70 font-medium">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-bold text-brand-brown">{fmt(baseTotalPaise)}</span>
                  </div>

                  {discountInfo && discountInfo.discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200/60">
                      <span>Loyalty Discount ({discountInfo.discountPercent}%)</span>
                      <span>
                        −{fmt(Math.max(0, baseTotalPaise - discountInfo.couponDiscountPaise - (discountInfo.finalTotal - discountInfo.shippingFeePaise)))}
                      </span>
                    </div>
                  )}

                  {/* Coupon */}
                  {appliedCoupon ? (
                    <div className="flex justify-between items-center text-brand-terracotta font-bold bg-brand-terracotta/5 p-3 rounded-2xl border border-brand-terracotta/20">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> {appliedCoupon.code}
                        {appliedCoupon.auto && <span className="text-[11px] font-black uppercase tracking-wider bg-brand-terracotta/15 px-1.5 py-0.5 rounded-md">Auto</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        −{fmt(discountInfo ? discountInfo.couponDiscountPaise : appliedCoupon.discountPaise)}
                        {!discountInfo && (
                          <button onClick={removeCoupon} aria-label="Remove coupon" className="text-brand-terracotta/50 hover:text-rose-600 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  ) : !discountInfo && (
                    <div className="flex flex-col gap-2">
                      {couponBoxOpen ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && applyCouponCode()}
                            placeholder="COUPON CODE"
                            className="flex-1 bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 font-bold text-brand-brown text-xs tracking-widest uppercase outline-none focus:border-brand-orange transition-colors"
                          />
                          <button
                            onClick={applyCouponCode}
                            disabled={couponLoading || !couponInput.trim()}
                            className="px-4 py-2 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[11px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                          >
                            {couponLoading && <Loader2 className="w-3 h-3 animate-spin" />}Apply
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCouponBoxOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-terracotta hover:text-brand-brown transition-colors cursor-pointer self-start"
                        >
                          <Tag className="w-3.5 h-3.5" /> Have a coupon code?
                        </button>
                      )}
                      {couponError && <p className="text-[11px] font-bold text-rose-600">{couponError}</p>}
                    </div>
                  )}

                  <div className="flex justify-between text-brand-brown/70 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" /> Shipping
                    </span>
                    {shippingFeePaise === 0 ? (
                      <span className="font-bold text-emerald-600 uppercase">FREE</span>
                    ) : (
                      <span className="font-bold text-brand-brown">{fmt(shippingFeePaise)}</span>
                    )}
                  </div>

                  {deliveryLabel && (
                    <div className="text-[11px] font-bold text-brand-brown/65 italic bg-brand-oat/40 p-2.5 rounded-xl border border-brand-brown/8">
                      Schedule: {deliveryLabel}
                    </div>
                  )}

                  <div className="border-t border-brand-brown/10 pt-4 mt-2 flex justify-between items-center">
                    <span className="font-black text-base uppercase text-brand-brown">Total</span>
                    <span className="font-serif font-black text-2xl text-brand-terracotta">
                      {fmt(displayTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handlePay}
                  disabled={loading || cart.length === 0 || !deliveryISO}
                  className="w-full bg-brand-brown hover:bg-brand-terracotta text-white rounded-2xl py-4 px-6 font-black text-xs sm:text-sm tracking-widest uppercase shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Opening Payment...</span>
                  ) : (
                    <span>Pay {fmt(displayTotal)} →</span>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-brown/60 uppercase tracking-wider pt-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Secure Payment via Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}


