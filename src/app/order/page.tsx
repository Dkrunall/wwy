"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

const STATUS_STEPS = [
  { key: "placed",           label: "Confirmed" },
  { key: "resting",          label: "Fermenting" },
  { key: "baking",           label: "Baking" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered",        label: "Delivered" },
];

const STATUS_EMOJI: Record<string, string> = {
  placed:            "✓",
  resting:           "🌙",
  baking:            "🔥",
  out_for_delivery:  "🚗",
  delivered:         "✓",
};

function OrderTracker({ order }: { order: Order }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === (order.delivery_status || "placed"));

  return (
    <div className="bg-white rounded-2xl p-5 border border-brand-charcoal/5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Latest Order</p>
          <p className="font-black text-brand-charcoal text-sm mt-0.5">
            #{(order.order_number || order.id.slice(0, 8)).toUpperCase()}
          </p>
        </div>
        <p className="font-black text-brand-charcoal text-lg">{fmt(order.total_paise)}</p>
      </div>

      {/* Step tracker */}
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const last = idx === STATUS_STEPS.length - 1;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all
                  ${active ? "bg-brand-charcoal text-white ring-2 ring-brand-charcoal ring-offset-2" :
                    done ? "bg-brand-orange text-white" : "bg-brand-oat text-brand-charcoal/20"}`}>
                  {done ? STATUS_EMOJI[step.key] : "·"}
                </div>
                <p className={`text-[9px] font-black tracking-wide text-center leading-tight
                  ${active ? "text-brand-charcoal" : done ? "text-brand-orange" : "text-brand-charcoal/20"}`}>
                  {step.label}
                </p>
              </div>
              {!last && (
                <div className={`flex-1 h-0.5 mb-5 ${idx < currentIdx ? "bg-brand-orange" : "bg-brand-charcoal/10"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {order.delivery_date && (
        <p className="text-[11px] font-bold text-brand-charcoal/30 mt-4 text-center">
          Delivery on {new Date(order.delivery_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [flat, setFlat] = useState("");
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    ["wwy_flat","wwy_name","wwy_customer_id","wwy_pincode","wwy_cart"].forEach((k) => localStorage.removeItem(k));
    await supabase.auth.signOut();
    router.replace("/order/login");
  };

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    const storedName = localStorage.getItem("wwy_name");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setFlat(storedFlat);
    setCustomerName(storedName || "");

    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("flat_number", storedFlat)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setLatestOrder(data || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const firstName = customerName.split(" ")[0];

  return (
    <main className="min-h-screen bg-brand-oat">
      {/* Header */}
      <header className="bg-brand-oat border-b border-brand-charcoal/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Image src="/WWY-LOGO_White.png" alt="Wild Wild Yeast" width={36} height={36} className="object-contain" />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-9 h-9 rounded-full bg-brand-charcoal text-brand-oat font-black text-sm flex items-center justify-center hover:bg-brand-terracotta transition-colors"
            >
              {customerName?.[0]?.toUpperCase() || "?"}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-brand-charcoal/5 overflow-hidden min-w-[170px] z-50">
                  <div className="px-4 py-3 border-b border-brand-charcoal/5">
                    <p className="font-black text-brand-charcoal text-sm leading-none">{customerName || "—"}</p>
                    <p className="text-[10px] font-bold text-brand-charcoal/30 mt-0.5">Flat {flat}</p>
                  </div>
                  <button onClick={() => { setMenuOpen(false); router.push("/order/history"); }} className="w-full px-4 py-3 text-left text-sm font-black text-brand-charcoal hover:bg-brand-oat transition-colors">
                    My Orders
                  </button>
                  <div className="border-t border-brand-charcoal/5" />
                  <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm font-black text-brand-terracotta hover:bg-brand-oat transition-colors">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Welcome hero */}
      <div className="bg-brand-charcoal">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <p className="text-[11px] font-black tracking-[0.25em] uppercase text-brand-oat/40 mb-1">Welcome back</p>
          <h1 className="font-black text-brand-oat leading-none tracking-tighter" style={{ fontSize: "clamp(2.2rem, 9vw, 3.2rem)" }}>
            Hey, {firstName || "there"}.
          </h1>
          <p className="text-brand-oat/40 font-bold text-sm mt-2">Flat {flat} · Wild Wild Yeast</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Active order tracker */}
        {loading ? (
          <div className="bg-white rounded-2xl p-5 border border-brand-charcoal/5 animate-pulse h-32" />
        ) : latestOrder && latestOrder.payment_status === "paid" && latestOrder.delivery_status !== "delivered" ? (
          <OrderTracker order={latestOrder} />
        ) : latestOrder ? (
          <div className="bg-white rounded-2xl p-5 border border-brand-charcoal/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/30">Last Order</p>
              <p className="font-black text-brand-charcoal text-sm mt-0.5">
                #{(latestOrder.order_number || latestOrder.id.slice(0, 8)).toUpperCase()} · {fmt(latestOrder.total_paise)}
              </p>
              <p className="text-[11px] font-bold text-green-700 mt-0.5">Delivered ✓</p>
            </div>
            <button onClick={() => router.push("/order/history")} className="text-xs font-black text-brand-charcoal/30 hover:text-brand-terracotta transition-colors">
              View all →
            </button>
          </div>
        ) : null}

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/order/shop")}
            className="bg-brand-charcoal hover:bg-brand-terracotta text-brand-oat rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] flex flex-col gap-3"
          >
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-black text-sm leading-none">Order Now</p>
              <p className="text-[11px] font-bold text-brand-oat/40 mt-1">Browse this week's menu</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/order/history")}
            className="bg-white hover:bg-brand-oat border border-brand-charcoal/5 text-brand-charcoal rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] flex flex-col gap-3"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-black text-sm leading-none">My Orders</p>
              <p className="text-[11px] font-bold text-brand-charcoal/30 mt-1">View order history</p>
            </div>
          </button>
        </div>

        {/* Info strip */}
        <div className="bg-brand-gold/10 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-lg">🌾</span>
          <p className="text-xs font-bold text-brand-charcoal/60 leading-relaxed">
            Made when ordered, not before.<br />Delivery on <strong className="text-brand-charcoal">Wednesdays & Saturdays</strong> only.
          </p>
        </div>

      </div>
    </main>
  );
}
