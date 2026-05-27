"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, RefreshCw, Loader2, CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

interface BakerOrder {
  id: string;
  order_number: string;
  flat_number: string;
  customer_name: string;
  total_paise: number;
  delivery_date: string;
  delivery_status: string;
  payment_status: string;
  notes: string | null;
  order_items: { product_name: string; quantity: number }[];
  customer_phone?: string | null;
}

interface Baker {
  id: string;
  name: string;
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function getStepIndex(status: string | null) {
  const steps = ["placed", "resting", "baking", "out_for_delivery", "delivered"];
  return steps.indexOf(status || "placed");
}

const D_THEME: Record<string, { bg: string; text: string; border: string; pulse: string }> = {
  placed:           { bg: "bg-zinc-50", text: "text-zinc-650", border: "border-zinc-200/60", pulse: "bg-zinc-400" },
  resting:          { bg: "bg-amber-50/60", text: "text-amber-800", border: "border-amber-200/50", pulse: "bg-amber-500" },
  baking:           { bg: "bg-orange-50/60", text: "text-orange-800", border: "border-orange-200/50", pulse: "bg-orange-500" },
  out_for_delivery: { bg: "bg-sky-50/60", text: "text-sky-850", border: "border-sky-200/50", pulse: "bg-sky-500" },
  delivered:        { bg: "bg-emerald-50/60", text: "text-emerald-800", border: "border-emerald-200/50", pulse: "bg-emerald-500" },
};

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  resting: "Resting",
  baking: "Baking",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const ORDER_SELECT = "id, order_number, flat_number, customer_name, total_paise, delivery_date, delivery_status, payment_status, notes, order_items(product_name, quantity)";

export default function BakerDashboard() {
  const params = useParams();
  const token = params.token as string;

  const [baker, setBaker] = useState<Baker | null>(null);
  const [bakerId, setBakerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<BakerOrder[]>([]);
  const [history, setHistory] = useState<BakerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"today" | "history">("today");

  // Bread time live clock
  const [breadTime, setBreadTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setBreadTime(new Date().toLocaleTimeString("en-IN", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

  const enrichWithPhones = async (rawOrders: BakerOrder[]): Promise<BakerOrder[]> => {
    if (!rawOrders.length) return rawOrders;
    const flatNumbers = [...new Set(rawOrders.map((o) => o.flat_number))];
    const { data: customers } = await supabase
      .from("customers")
      .select("flat_number, phone")
      .in("flat_number", flatNumbers);
    const phoneMap: Record<string, string | null> = {};
    for (const c of customers || []) phoneMap[c.flat_number] = c.phone;
    return rawOrders.map((o) => ({ ...o, customer_phone: phoneMap[o.flat_number] ?? null }));
  };

  const fetchData = useCallback(async () => {
    const { data: bakerData, error: bakerErr } = await supabase
      .from("bakers")
      .select("id, name")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (bakerErr || !bakerData) {
      setError("Invalid or expired dashboard link.");
      setLoading(false);
      return;
    }
    setBaker(bakerData);
    setBakerId(bakerData.id);

    const { data: ordersData } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("baker_id", bakerData.id)
      .eq("delivery_date", todayISO)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: true });

    const enriched = await enrichWithPhones((ordersData || []) as BakerOrder[]);
    setOrders(enriched);
    setLoading(false);
  }, [token, todayISO]);

  const fetchHistory = useCallback(async () => {
    if (!bakerId) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("baker_id", bakerId)
      .eq("payment_status", "paid")
      .lt("delivery_date", todayISO)
      .order("delivery_date", { ascending: false })
      .limit(50);
    setHistory((data || []) as BakerOrder[]);
    setHistoryLoading(false);
  }, [bakerId, todayISO]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  // Auto-refresh today's orders every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "today") fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, tab]);

  const markReady = async (orderId: string) => {
    setMarkingId(orderId);
    const res = await fetch("/api/baker/mark-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, token }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, delivery_status: "out_for_delivery" } : o)
      );
    }
    setMarkingId(null);
  };

  const bakeList: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.order_items || []) {
      bakeList[item.product_name] = (bakeList[item.product_name] || 0) + item.quantity;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="font-black text-brand-brown/40 tracking-widest text-[10px] uppercase animate-pulse">Syncing Oven Ledger...</p>
      </main>
    );
  }

  if (error || !baker) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-4 px-5">
        <span className="text-4xl">🌾</span>
        <p className="font-serif font-black text-2xl text-brand-brown tracking-tight">Invalid Link</p>
        <p className="text-xs font-bold text-brand-brown/40">{error || "This dashboard link is invalid or expired."}</p>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="min-h-screen bg-brand-oat/30 pb-16">
      {/* Header */}
      <header className="bg-brand-brown text-brand-oat px-5 py-4.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-lg font-black tracking-tight leading-none text-white">Baker Dashboard</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange mt-1.5">{baker.name} · {today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[7.5px] font-black uppercase text-brand-orange tracking-widest leading-none mb-0.5">BREAD TIME</span>
              <span className="text-[11px] font-black font-mono text-white/90 leading-none">{breadTime}</span>
            </div>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-brand-oat/60 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-brand-brown/5 sticky top-[68px] z-30 shadow-sm">
        <div className="max-w-lg mx-auto flex">
          {(["today", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-[10px] font-black tracking-[0.2em] uppercase transition-colors relative cursor-pointer ${
                tab === t
                  ? "text-brand-orange font-black"
                  : "text-brand-brown/40 hover:text-brand-brown font-bold"
              }`}
            >
              <span>{t === "today" ? `Today (${orders.length})` : "History"}</span>
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">

        {tab === "today" && (
          <>
            {/* Bake List */}
            <section className="bg-white rounded-3xl border border-brand-brown/5 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4.5">
                <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange">
                  Today&apos;s Bake Ledger
                </p>
                <span className="text-[10px] font-bold text-brand-brown/40">Total batches</span>
              </div>
              {Object.keys(bakeList).length === 0 ? (
                <p className="text-xs font-bold text-brand-brown/45 italic">No batches to bake today.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {Object.entries(bakeList).map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between border-b border-dashed border-brand-brown/10 pb-2.5 last:border-0 last:pb-0">
                      <span className="font-serif text-sm font-black text-brand-brown">{name}</span>
                      <span className="font-serif text-lg font-black text-brand-orange bg-brand-orange/5 border border-brand-orange/15 px-3 py-0.5 rounded-xl">×{qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Individual Orders */}
            <section>
              <p className="text-[9px] font-black tracking-widest uppercase text-brand-brown/40 mb-3">
                Orders ({orders.length})
              </p>
              {orders.length === 0 && (
                <div className="bg-white border border-brand-brown/5 rounded-3xl py-12 text-center shadow-sm">
                  <span className="text-2xl block mb-1">🌾</span>
                  <p className="text-xs font-bold text-brand-brown/40">No orders assigned for today.</p>
                </div>
              )}
              <div className="flex flex-col gap-3.5">
                {orders.map((order) => {
                  const theme = D_THEME[order.delivery_status] || D_THEME.placed;
                  const canMarkReady = !["out_for_delivery", "delivered"].includes(order.delivery_status);
                  const waPhone = order.customer_phone?.replace(/\D/g, "").slice(-10);

                  return (
                    <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/5 p-5 shadow-sm flex flex-col gap-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif font-black text-brand-brown text-base leading-none">Flat {order.flat_number}</p>
                          <p className="text-[10px] font-bold text-brand-brown/45 mt-1.5 uppercase tracking-wide">{order.customer_name} · {order.order_number}</p>
                        </div>
                        <span className={`text-[8.5px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border ${theme.bg} ${theme.text} ${theme.border} inline-flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.pulse} ${order.delivery_status !== 'delivered' ? 'animate-ping' : ''}`} />
                          <span>{STATUS_LABELS[order.delivery_status] || order.delivery_status}</span>
                        </span>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-2 border-t border-brand-brown/5 pt-3.5">
                        {(order.order_items || []).map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-brown/70">{item.product_name}</span>
                            <span className="font-serif text-sm font-black text-brand-brown bg-brand-brown/5 px-2.5 py-0.5 rounded-lg">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Customer note */}
                      {order.notes && (
                        <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-2xl px-4 py-3">
                          <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange mb-0.5">Note from Customer</p>
                          <p className="text-xs font-medium text-brand-brown italic">"{order.notes}"</p>
                        </div>
                      )}

                      {/* Sourdough Lifecycle Timeline */}
                      <div className="pt-3.5 border-t border-brand-brown/5 flex items-center justify-between gap-1 text-[8.5px] font-black text-brand-brown/40 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { key: "placed", label: "1. Placed" },
                          { key: "resting", label: "2. Resting" },
                          { key: "baking", label: "3. Baking" },
                          { key: "out_for_delivery", label: "4. Transit" },
                          { key: "delivered", label: "5. Ready" }
                        ].map((step, idx, arr) => {
                          const isCompleted = getStepIndex(order.delivery_status) >= idx;
                          const isActive = order.delivery_status === step.key;
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7.5px] font-black border transition-all duration-300 ${
                                  isActive 
                                    ? "bg-brand-orange border-brand-orange text-white ring-4 ring-brand-orange/15 scale-110" 
                                    : isCompleted 
                                      ? "bg-brand-brown border-brand-brown text-white" 
                                      : "bg-white border-brand-brown/15 text-brand-brown/20"
                                }`}>
                                  {isCompleted && !isActive ? "✓" : idx + 1}
                                </span>
                                <span className={`tracking-wider uppercase text-[7.5px] ${
                                  isActive 
                                    ? "text-brand-orange font-black" 
                                    : isCompleted 
                                      ? "text-brand-brown font-black" 
                                      : "text-brand-brown/25"
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < arr.length - 1 && (
                                <div className={`flex-grow h-0.5 min-w-2 max-w-8 rounded ${
                                  getStepIndex(order.delivery_status) > idx 
                                    ? "bg-brand-brown/60" 
                                    : "bg-brand-brown/10"
                                }`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-3 border-t border-brand-brown/5 pt-3.5 flex-wrap">
                        <span className="font-serif font-black text-brand-brown text-sm">{fmt(order.total_paise)}</span>
                        
                        <div className="flex items-center gap-2">
                          {waPhone && (
                            <a
                              href={`https://wa.me/91${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[9px] tracking-widest uppercase px-3 py-2 rounded-xl border border-emerald-200/50 transition-colors shadow-sm cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WA</span>
                            </a>
                          )}
                          
                          {canMarkReady ? (
                            <button
                              onClick={() => markReady(order.id)}
                              disabled={markingId === order.id}
                              className="bg-brand-brown hover:bg-brand-orange disabled:opacity-50 text-white font-black text-[9px] tracking-widest uppercase px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shadow-brand-brown/10 cursor-pointer"
                            >
                              {markingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Mark Ready</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-emerald-700 bg-emerald-50/50 border border-emerald-200/50 px-3 py-2 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{order.delivery_status === "delivered" ? "Delivered" : "In Transit"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {tab === "history" && (
          <section>
            <p className="text-[9px] font-black tracking-widest uppercase text-brand-brown/40 mb-3">
              Past Deliveries
            </p>
            {historyLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
                <p className="text-[9px] font-black tracking-widest text-brand-brown/30 uppercase">Fetching archive...</p>
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="bg-white border border-brand-brown/5 rounded-3xl py-12 text-center shadow-sm">
                <span className="text-2xl block mb-1">📦</span>
                <p className="text-xs font-bold text-brand-brown/40">No past deliveries found.</p>
              </div>
            )}
            <div className="flex flex-col gap-3.5">
              {history.map((order) => {
                const theme = D_THEME[order.delivery_status] || D_THEME.placed;
                const deliveryLabel = new Date(order.delivery_date).toLocaleDateString("en-IN", {
                  weekday: "short", day: "numeric", month: "short",
                });
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/5 p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif font-black text-brand-brown text-base leading-none">Flat {order.flat_number}</p>
                        <p className="text-[10px] font-bold text-brand-brown/45 mt-1.5 uppercase tracking-wide">
                          {order.customer_name} · {order.order_number} · {deliveryLabel}
                        </p>
                      </div>
                      <span className={`text-[8.5px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border ${theme.bg} ${theme.text} ${theme.border} inline-flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.pulse}`} />
                        <span>{STATUS_LABELS[order.delivery_status] || order.delivery_status}</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-brand-brown/5 pt-3.5">
                      {(order.order_items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-brown/70">{item.product_name}</span>
                          <span className="font-serif text-sm font-black text-brand-brown bg-brand-brown/5 px-2.5 py-0.5 rounded-lg">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-2xl px-4 py-3">
                        <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange mb-0.5">Note from Customer</p>
                        <p className="text-xs font-medium text-brand-brown italic">"{order.notes}"</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-brand-brown/5 pt-3.5">
                      <span className="font-serif font-black text-brand-brown text-sm">{fmt(order.total_paise)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
