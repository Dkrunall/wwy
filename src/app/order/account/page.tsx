"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, ClipboardList, LogOut, ChevronRight, Clock, Package, Flame, Truck, CheckCircle } from "lucide-react";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STEPS = [
  { key: "placed",           label: "Confirmed",  Icon: Clock },
  { key: "resting",          label: "Fermenting", Icon: Package },
  { key: "baking",           label: "Baking",     Icon: Flame },
  { key: "out_for_delivery", label: "On the way", Icon: Truck },
  { key: "delivered",        label: "Delivered",  Icon: CheckCircle },
];

export default function AccountPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [flat, setFlat] = useState("");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
          .limit(3);
        setRecentOrders(data || []);
      } catch { /* no orders */ } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const firstName = customerName.split(" ")[0];
  const activeOrder = recentOrders.find((o) => o.payment_status === "paid" && o.delivery_status !== "delivered");
  const currentStep = STEPS.findIndex((s) => s.key === (activeOrder?.delivery_status || "placed"));

  return (
    <main className="min-h-screen bg-brand-oat">

      {/* ── Header ── */}
      <header className="bg-white border-b border-brand-brown/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push("/order")}
              className="w-8 h-8 rounded-xl bg-brand-oat hover:bg-brand-brown/10 flex items-center justify-center transition-colors shrink-0"
            >
              <span className="font-black text-brand-brown text-base leading-none">←</span>
            </button>
            <div className="bg-brand-oat p-1.5 rounded-xl shrink-0">
              <Image src="/logo.png" alt="WWY" width={24} height={24} className="object-contain" />
            </div>
            <p className="font-black text-brand-brown text-sm leading-none truncate">My Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase text-brand-brown/30 hover:text-rose-600 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ── Profile card ── */}
        <div className="bg-brand-brown rounded-2xl px-5 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/15 text-white font-black text-2xl flex items-center justify-center shrink-0">
            {customerName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-0.5">Account</p>
            <h1 className="font-black text-white text-xl leading-tight truncate">{customerName || "—"}</h1>
            <p className="text-white/40 text-xs font-bold mt-0.5">Flat {flat}</p>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/order")}
            className="bg-white hover:bg-brand-oat border border-brand-brown/10 rounded-2xl p-4 text-left transition-all active:scale-[0.97] shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-brown flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-brand-brown text-sm leading-none">Shop</p>
              <p className="text-[11px] font-bold text-brand-brown/30 mt-0.5">Browse menu</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/order/history")}
            className="bg-white hover:bg-brand-oat border border-brand-brown/10 rounded-2xl p-4 text-left transition-all active:scale-[0.97] shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-oat border border-brand-brown/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-brand-brown/60" />
            </div>
            <div>
              <p className="font-black text-brand-brown text-sm leading-none">Orders</p>
              <p className="text-[11px] font-bold text-brand-brown/30 mt-0.5">Order history</p>
            </div>
          </button>
        </div>

        {/* ── Active order tracker ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-brand-brown/10 p-5 animate-pulse h-32" />
        ) : activeOrder ? (
          <div className="bg-white rounded-2xl border border-brand-brown/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-brand-brown/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/40">Active Order</p>
                <p className="font-black text-brand-brown text-sm mt-0.5">
                  #{(activeOrder.order_number || activeOrder.id.slice(0,8)).toUpperCase()} · {fmt(activeOrder.total_paise)}
                </p>
              </div>
              <button onClick={() => router.push("/order/history")} className="flex items-center gap-0.5 text-[11px] font-black text-brand-orange hover:text-brand-brown transition-colors">
                Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  const StepIcon = step.Icon;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                          ${active ? "bg-brand-brown ring-2 ring-brand-brown ring-offset-2 shadow-md" : done ? "bg-brand-orange" : "bg-brand-oat border border-brand-brown/10"}`}>
                          <StepIcon className={`w-3.5 h-3.5 ${done || active ? "text-white" : "text-brand-brown/20"}`} />
                        </div>
                        <p className={`text-[9px] font-black tracking-wide text-center leading-tight
                          ${active ? "text-brand-brown" : done ? "text-brand-orange" : "text-brand-brown/25"}`}
                          style={{ maxWidth: 44 }}>
                          {step.label}
                        </p>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-4 mx-0.5 ${idx < currentStep ? "bg-brand-orange" : "bg-brand-brown/10"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {activeOrder.delivery_date && (
                <p className="text-[11px] font-bold text-brand-brown/30 mt-3 text-center">
                  Delivery on {new Date(activeOrder.delivery_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Recent orders ── */}
        {!loading && recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-brand-brown/10 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-brown/5 flex items-center justify-between">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/40">Recent Orders</p>
              <button onClick={() => router.push("/order/history")} className="text-[11px] font-black text-brand-orange hover:text-brand-brown transition-colors">
                View all →
              </button>
            </div>
            <div className="flex flex-col divide-y divide-brand-brown/5">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-brand-brown text-sm leading-none">
                      #{(order.order_number || order.id.slice(0,8)).toUpperCase()}
                    </p>
                    <p className="text-[11px] font-bold text-brand-brown/40 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-brand-brown text-sm">{fmt(order.total_paise)}</p>
                    <p className={`text-[10px] font-black mt-0.5 ${
                      order.delivery_status === "delivered" ? "text-emerald-600" :
                      order.payment_status !== "paid" ? "text-amber-600" : "text-brand-orange"
                    }`}>
                      {order.delivery_status === "delivered" ? "Delivered" :
                       order.payment_status !== "paid" ? "Pending payment" :
                       order.delivery_status === "out_for_delivery" ? "On the way" : "In progress"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Info ── */}
        <div className="bg-white border border-brand-brown/10 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <Package className="w-5 h-5 text-brand-orange shrink-0" />
          <p className="text-xs font-bold text-brand-brown/50 leading-relaxed">
            Made when ordered. Delivery on{" "}
            <span className="text-brand-brown font-black">Wednesdays & Saturdays only.</span>
          </p>
        </div>

      </div>
    </main>
  );
}
