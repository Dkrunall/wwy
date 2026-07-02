"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, ClipboardList, LogOut, ChevronRight, Package, Flame, Truck, CheckCircle, Clock } from "lucide-react";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STEPS = [
  { key: "placed",            label: "Confirmed",  Icon: Clock },
  { key: "resting",           label: "Fermenting", Icon: Package },
  { key: "baking",            label: "Baking",     Icon: Flame },
  { key: "out_for_delivery",  label: "On the way", Icon: Truck },
  { key: "delivered",         label: "Delivered",  Icon: CheckCircle },
];

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

    (async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("flat_number", storedFlat)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setLatestOrder(data || null);
      } catch { /* no orders */ } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const firstName = customerName.split(" ")[0];
  const currentStep = STEPS.findIndex((s) => s.key === (latestOrder?.delivery_status || "placed"));
  const hasActiveOrder = latestOrder && latestOrder.payment_status === "paid" && latestOrder.delivery_status !== "delivered";

  return (
    <div className="min-h-screen bg-brand-oat">

      {/* ── Header ── */}
      <header className="bg-white border-b border-brand-brown/10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-brand-oat p-1.5 rounded-xl shrink-0">
              <Image src="/logo.png" alt="WWY" width={26} height={26} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-brand-brown text-sm leading-none truncate">Wild Wild Yeast</p>
              <p className="text-[10px] font-bold text-brand-orange leading-none mt-0.5 tracking-wider uppercase">My Account</p>
            </div>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-9 h-9 rounded-full bg-brand-brown text-white font-black text-sm flex items-center justify-center hover:bg-brand-orange transition-colors shrink-0"
            >
              {customerName?.[0]?.toUpperCase() || "?"}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-brand-brown/10 overflow-hidden min-w-[180px] z-50">
                  <div className="px-4 py-3 bg-brand-oat/60 border-b border-brand-brown/10">
                    <p className="font-black text-brand-brown text-sm leading-none">{customerName || "—"}</p>
                    <p className="text-[10px] font-bold text-brand-brown/40 mt-0.5 uppercase tracking-wider">Flat {flat}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/order/history"); }}
                    className="w-full px-4 py-3 text-left text-sm font-black text-brand-brown hover:bg-brand-oat transition-colors flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4 text-brand-brown/40" /> My Orders
                  </button>
                  <div className="border-t border-brand-brown/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm font-black text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ── Welcome card ── */}
        <div className="bg-brand-brown rounded-2xl px-5 py-5">
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-orange mb-1">Welcome back</p>
          <h1 className="font-black text-white text-2xl leading-tight tracking-tight">Hey, {firstName || "there"} 👋</h1>
          <p className="text-white/40 text-xs font-bold mt-1 uppercase tracking-wider">Flat {flat}</p>
        </div>

        {/* ── Active order tracker ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-brand-brown/10 p-5 animate-pulse h-36" />
        ) : hasActiveOrder && latestOrder ? (
          <div className="bg-white rounded-2xl border border-brand-brown/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-brand-brown/5">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/40">Active Order</p>
                <p className="font-black text-brand-brown text-sm mt-0.5">
                  #{(latestOrder.order_number || latestOrder.id.slice(0,8)).toUpperCase()} · {fmt(latestOrder.total_paise)}
                </p>
              </div>
              <button onClick={() => router.push("/order/history")} className="text-[11px] font-black text-brand-orange hover:text-brand-brown transition-colors flex items-center gap-0.5">
                Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-start">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  const last = idx === STEPS.length - 1;
                  const StepIcon = step.Icon;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 0 }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                          ${active ? "bg-brand-brown ring-2 ring-brand-brown ring-offset-2 shadow-md" :
                            done ? "bg-brand-orange" : "bg-brand-brown/8 border border-brand-brown/10"}`}>
                          <StepIcon className={`w-3.5 h-3.5 ${done || active ? "text-white" : "text-brand-brown/20"}`} />
                        </div>
                        <p className={`text-[9px] font-black tracking-wide text-center leading-tight
                          ${active ? "text-brand-brown" : done ? "text-brand-orange" : "text-brand-brown/25"}`}
                          style={{ maxWidth: 44, wordBreak: "break-word" }}>
                          {step.label}
                        </p>
                      </div>
                      {!last && (
                        <div className={`flex-1 h-0.5 mt-4 mx-0.5 ${idx < currentStep ? "bg-brand-orange" : "bg-brand-brown/10"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {latestOrder.delivery_date && (
                <p className="text-[11px] font-bold text-brand-brown/30 mt-3 text-center">
                  Delivery on {new Date(latestOrder.delivery_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              )}
            </div>
          </div>
        ) : latestOrder && latestOrder.delivery_status === "delivered" ? (
          <div className="bg-white rounded-2xl border border-brand-brown/10 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/40">Last Order</p>
              <p className="font-black text-brand-brown text-sm mt-0.5">
                #{(latestOrder.order_number || latestOrder.id.slice(0,8)).toUpperCase()} · {fmt(latestOrder.total_paise)}
              </p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Delivered
              </p>
            </div>
            <button onClick={() => router.push("/order/history")} className="text-[11px] font-black text-brand-orange hover:text-brand-brown transition-colors flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/order/shop")}
            className="bg-brand-brown hover:bg-brand-orange text-white rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] shadow-sm flex flex-col gap-3"
          >
            <ShoppingBag className="w-6 h-6 text-brand-orange" style={{ color: "#EBB41F" }} />
            <div>
              <p className="font-black text-sm leading-none">Order Now</p>
              <p className="text-[11px] font-bold text-white/40 mt-1">Browse this week's menu</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/order/history")}
            className="bg-white hover:bg-brand-oat border border-brand-brown/10 text-brand-brown rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] shadow-sm flex flex-col gap-3"
          >
            <ClipboardList className="w-6 h-6 text-brand-brown/40" />
            <div>
              <p className="font-black text-sm leading-none">My Orders</p>
              <p className="text-[11px] font-bold text-brand-brown/30 mt-1">View order history</p>
            </div>
          </button>
        </div>

        {/* ── Info strip ── */}
        <div className="bg-white border border-brand-brown/10 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-xs font-bold text-brand-brown/50 leading-relaxed">
            Made when ordered, not before.{" "}
            <span className="text-brand-brown font-black">Delivery on Wednesdays & Saturdays only.</span>
          </p>
        </div>

      </div>
    </div>
  );
}
