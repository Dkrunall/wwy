"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 80;

const steps = ["Delivery", "Payment", "Review"];

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", pincode: "",
  });

  const shipping = totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const orderTotal = totalPrice + shipping;

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const inputClass =
    "w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors duration-300";

  const labelClass =
    "text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40";

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-40 pb-24">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 hover:text-brand-terracotta transition-colors mb-6"
          >
            <ArrowLeft size={13} /> Back to Cart
          </Link>
          <h1
            className="font-black text-brand-charcoal tracking-tighter leading-none"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
          >
            CHECKOUT
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-12 max-w-xs">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                  i < step ? "bg-brand-olive text-white" :
                  i === step ? "bg-brand-charcoal text-white" :
                  "bg-brand-charcoal/10 text-brand-charcoal/30"
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-[9px] font-black tracking-[0.15em] uppercase ${i === step ? "text-brand-charcoal" : "text-brand-charcoal/30"}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 transition-colors duration-300 ${i < step ? "bg-brand-olive" : "bg-brand-charcoal/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-16 items-start">

          {/* ── Left: Form ── */}
          <div className="flex-1">

            {/* STEP 0 — Delivery */}
            {step === 0 && (
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-7">
                  Delivery Details
                </h2>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>First Name</label>
                      <input type="text" placeholder="Arjun" value={form.firstName}
                        onChange={e => update("firstName", e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>Last Name</label>
                      <input type="text" placeholder="Sharma" value={form.lastName}
                        onChange={e => update("lastName", e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>Email</label>
                      <input type="email" placeholder="your@email.com" value={form.email}
                        onChange={e => update("email", e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>Phone</label>
                      <input type="tel" placeholder="+91 00000 00000" value={form.phone}
                        onChange={e => update("phone", e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Address</label>
                    <input type="text" placeholder="House / Flat / Street" value={form.address}
                      onChange={e => update("address", e.target.value)} className={inputClass} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>City</label>
                      <input type="text" placeholder="Mumbai" value={form.city}
                        onChange={e => update("city", e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className={labelClass}>State</label>
                      <input type="text" placeholder="Maharashtra" value={form.state}
                        onChange={e => update("state", e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-36">
                      <label className={labelClass}>Pincode</label>
                      <input type="text" placeholder="400050" value={form.pincode}
                        onChange={e => update("pincode", e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 w-full bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1 — Payment */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">
                  <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-7">
                    Payment
                  </h2>

                  {/* Delivery summary */}
                  <div className="bg-brand-oat rounded-[1.25rem] px-5 py-4 mb-6 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/40 mb-0.5">Delivering to</p>
                      <p className="text-sm font-bold text-brand-charcoal">
                        {form.firstName} {form.lastName} — {form.city || "—"}
                      </p>
                    </div>
                    <button onClick={() => setStep(0)}
                      className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta hover:opacity-70 transition-opacity">
                      Edit
                    </button>
                  </div>

                  {/* Payment placeholder */}
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center border-2 border-dashed border-brand-charcoal/10 rounded-[1.5rem]">
                    <div className="w-14 h-14 rounded-full bg-brand-charcoal/5 flex items-center justify-center">
                      <Lock size={22} className="text-brand-charcoal/30" />
                    </div>
                    <div>
                      <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/40 mb-1">
                        Payment Gateway
                      </p>
                      <p className="text-xs font-bold text-brand-charcoal/30 max-w-xs leading-relaxed">
                        Razorpay / Cashfree integration goes here. UPI, cards, wallets — all supported.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)}
                    className="flex-1 bg-white border border-brand-charcoal/10 text-brand-charcoal hover:border-brand-charcoal py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 active:scale-[0.98]">
                    Back
                  </button>
                  <button onClick={() => setStep(2)}
                    className="flex-1 bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">
                  <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-7">
                    Review & Place Order
                  </h2>

                  {/* Delivery */}
                  <div className="mb-6 pb-6 border-b border-brand-charcoal/5">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/40">Delivery</p>
                      <button onClick={() => setStep(0)} className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta hover:opacity-70">Edit</button>
                    </div>
                    <p className="text-sm font-bold text-brand-charcoal">{form.firstName} {form.lastName}</p>
                    <p className="text-xs font-bold text-brand-charcoal/50 mt-1">{form.address}{form.city ? `, ${form.city}` : ""}{form.state ? `, ${form.state}` : ""} {form.pincode}</p>
                    <p className="text-xs font-bold text-brand-charcoal/50">{form.phone}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-6 pb-6 border-b border-brand-charcoal/5">
                    <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/40 mb-4">Items</p>
                    <div className="flex flex-col gap-3">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                            <div className="relative w-8 h-8">
                              <Image src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-brand-charcoal">{item.name}</p>
                            <p className="text-[10px] font-bold text-brand-charcoal/40">Qty {item.quantity}</p>
                          </div>
                          <p className="font-black text-sm text-brand-charcoal">₹{(item.priceNum * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex flex-col gap-2 mb-8">
                    <div className="flex justify-between text-xs font-bold text-brand-charcoal/50">
                      <span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-brand-charcoal/50">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `₹${SHIPPING_COST}`}</span>
                    </div>
                    <div className="h-px bg-brand-charcoal/5 my-1" />
                    <div className="flex justify-between font-black text-brand-charcoal">
                      <span className="text-xs tracking-[0.1em] uppercase">Total</span>
                      <span className="text-xl">₹{orderTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link
                    href="/order-confirmation"
                    className="block w-full bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300 text-center"
                  >
                    Place Order
                  </Link>
                </div>

                <button onClick={() => setStep(1)}
                  className="w-full bg-white border border-brand-charcoal/10 text-brand-charcoal hover:border-brand-charcoal py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 active:scale-[0.98]">
                  Back to Payment
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5 sticky top-32">
              <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-6">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                      <div className="relative w-7 h-7">
                        <Image src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black tracking-[0.1em] uppercase text-brand-charcoal truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-brand-charcoal/40">× {item.quantity}</p>
                    </div>
                    <p className="font-black text-xs text-brand-charcoal shrink-0">₹{(item.priceNum * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-brand-charcoal/5 mb-4" />

              <div className="flex flex-col gap-2 mb-1">
                <div className="flex justify-between text-xs font-bold text-brand-charcoal/50">
                  <span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-brand-charcoal/50">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-brand-olive" : ""}>{shipping === 0 ? "Free" : `₹${SHIPPING_COST}`}</span>
                </div>
                <div className="h-px bg-brand-charcoal/5 my-2" />
                <div className="flex justify-between font-black text-brand-charcoal">
                  <span className="text-xs tracking-[0.1em] uppercase">Total</span>
                  <span className="text-xl">₹{orderTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold text-brand-charcoal/30">
                <Lock size={11} />
                Secure checkout
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
