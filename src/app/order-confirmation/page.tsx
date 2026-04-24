"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function OrderConfirmationPage() {
  const orderId = `WWY-${Math.floor(10000 + Math.random() * 90000)}`;

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-24 flex flex-col items-center text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-brand-olive/10 flex items-center justify-center mb-8">
          <CheckCircle size={40} className="text-brand-olive" />
        </div>

        {/* Heading */}
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-terracotta mb-4 block">
          Order Placed
        </span>
        <h1
          className="font-black text-brand-charcoal tracking-tighter leading-[0.88] mb-4"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
        >
          IT'S ON ITS <br />
          <span className="text-brand-terracotta">WAY.</span>
        </h1>
        <p className="text-sm font-bold text-brand-charcoal/50 max-w-sm leading-relaxed mb-3">
          Your slow-fermented provisions are being prepared. We'll send a confirmation to your email shortly.
        </p>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30 mb-12">
          Order ID: {orderId}
        </p>

        {/* Status card */}
        <div className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm p-6 sm:p-8 w-full max-w-md mb-10">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-charcoal/5">
            <div className="w-12 h-12 rounded-full bg-brand-charcoal/5 flex items-center justify-center shrink-0">
              <Package size={20} className="text-brand-charcoal/40" />
            </div>
            <div className="text-left">
              <p className="font-black text-xs tracking-[0.1em] uppercase text-brand-charcoal">Processing</p>
              <p className="text-[10px] font-bold text-brand-charcoal/40 mt-0.5">Estimated delivery: 3–5 working days</p>
            </div>
          </div>

          {[
            { label: "Order confirmed", done: true },
            { label: "Being prepared", done: false },
            { label: "Dispatched", done: false },
            { label: "Delivered", done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-brand-olive" : "bg-brand-charcoal/10"}`}>
                {s.done && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className={`text-xs font-bold ${s.done ? "text-brand-charcoal" : "text-brand-charcoal/30"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="bg-brand-charcoal text-white hover:bg-brand-terracotta px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-95 transition-all duration-300"
          >
            View My Orders
          </Link>
          <Link
            href="/shop"
            className="bg-white border border-brand-charcoal/10 text-brand-charcoal hover:border-brand-charcoal px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 active:scale-95"
          >
            Continue Shopping
          </Link>
        </div>

      </div>

      <Footer />
    </main>
  );
}
