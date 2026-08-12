"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function OrderConfirmationPage() {
  const orderId = `WWY-${Math.floor(10000 + Math.random() * 90000)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-oat via-white to-brand-oat/30">
      <Navbar />
      <CartDrawer />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-24 flex flex-col items-center">

        {/* Hero Badge & Icon */}
        <div className="w-20 h-20 rounded-3xl bg-brand-olive/15 border border-brand-olive/20 flex items-center justify-center mb-6 shadow-xl shadow-brand-olive/10 animate-bounce">
          <CheckCircle size={42} className="text-brand-olive" />
        </div>

        <span className="inline-block bg-brand-terracotta/10 text-brand-terracotta text-xs font-bold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full mb-4">
          Order Confirmed & Received
        </span>

        <h1
          className="font-black text-brand-charcoal tracking-tight leading-tight text-center mb-4 max-w-2xl"
          style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
        >
          YOUR ORDER HAS ENTERED <span className="text-brand-terracotta">FERMENTATION</span>
        </h1>

        <p className="text-base font-medium text-brand-charcoal/70 max-w-lg text-center leading-relaxed mb-3">
          We&apos;ve received your request! Our bakers are crafting your loaves and preparing fresh brews today.
        </p>

        <p className="text-xs font-mono font-bold bg-brand-charcoal/5 text-brand-charcoal/60 px-4 py-1.5 rounded-full border border-brand-charcoal/10 uppercase tracking-widest mb-12">
          Order ID: {orderId}
        </p>

        {/* 2-Column Wide Grid for Order Status & Details */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Status Timeline Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-brand-charcoal/10 shadow-lg p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-charcoal/10">
                <div className="w-12 h-12 rounded-2xl bg-brand-terracotta/10 flex items-center justify-center shrink-0 text-brand-terracotta">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-brand-charcoal">Processing Order</h3>
                  <p className="text-xs text-brand-charcoal/50 mt-0.5">Estimated delivery: 1–2 working days</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Order confirmed — fermentation begins", done: true, desc: "Ingredients prepped & starter fed" },
                  { label: "Developing flavour & structure", done: false, desc: "Slow long cold fermentation" },
                  { label: "Baked, brewed & dispatched", done: false, desc: "Out for delivery to your doorstep" },
                  { label: "Delivered fresh", done: false, desc: "Handed over warm and crusty" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.done ? "bg-brand-olive text-white shadow-sm" : "bg-brand-charcoal/10 text-brand-charcoal/30"}`}>
                      {s.done ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${s.done ? "text-brand-charcoal" : "text-brand-charcoal/40"}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-brand-charcoal/40">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-brand-charcoal/5 text-xs text-brand-charcoal/50 italic">
              &ldquo;Food that is still becoming.&rdquo;
            </div>
          </div>

          {/* Delivery & Assistance Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-brand-charcoal/10 shadow-lg p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-charcoal/10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-brand-charcoal">Delivery & Updates</h3>
                  <p className="text-xs text-brand-charcoal/50 mt-0.5">Real-time alerts sent via WhatsApp</p>
                </div>
              </div>

              <div className="bg-brand-oat/50 rounded-2xl p-5 border border-brand-charcoal/5 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-terracotta mb-2">What Happens Next?</h4>
                <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                  You will receive a WhatsApp message from our team as soon as your batch leaves the oven and is dispatched with Borzo live tracking.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-brand-charcoal/5 pb-2">
                  <span className="text-brand-charcoal/60">Status</span>
                  <span className="font-bold text-emerald-600 uppercase tracking-wider">Payment Confirmed</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-brand-charcoal/5 pb-2">
                  <span className="text-brand-charcoal/60">Support Contact</span>
                  <span className="font-bold text-brand-charcoal">+91 (WWY Support)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/shop"
                className="flex-1 bg-brand-charcoal text-white hover:bg-brand-terracotta px-6 py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingBag size={16} /> Explore Shop
              </Link>
              <Link
                href="/order/history"
                className="flex-1 bg-white border border-brand-charcoal/15 text-brand-charcoal hover:bg-brand-oat px-6 py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
              >
                View History <ArrowRight size={16} />
              </Link>
            </div>
          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}

