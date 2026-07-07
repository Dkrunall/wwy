"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, RefreshCw, Loader2, CheckCircle2, MessageCircle, ChevronDown, ChevronUp, Palmtree } from "lucide-react";

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
  daily_capacity?: number;
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

// ── Baker status chain (granular bread-making stages) ──
const BAKER_STEPS = [
  { key: "placed",           label: "Placed",        short: "Placed" },
  { key: "mixing",           label: "Mixing",         short: "Mixing" },
  { key: "stretching",       label: "Stretch & Fold", short: "Stretch" },
  { key: "resting",          label: "Bulk Rest",      short: "Rest" },
  { key: "cold_proof",       label: "Cold Proof",     short: "Cold" },
  { key: "baking",           label: "Baking",         short: "Baking" },
  { key: "out_for_delivery", label: "In Transit",     short: "Transit" },
  { key: "delivered",        label: "Delivered",      short: "Done" },
];

const BAKER_NEXT: Record<string, string> = {
  placed:    "mixing",
  mixing:    "stretching",
  stretching:"resting",
  resting:   "cold_proof",
  cold_proof:"baking",
  baking:    "out_for_delivery",
};

const BAKER_BTN: Record<string, string> = {
  placed:    "Start Mixing",
  mixing:    "Stretch & Fold Done",
  stretching:"Start Bulk Rest",
  resting:   "Start Cold Proof",
  cold_proof:"Into the Oven",
  baking:    "Ready for Delivery →",
};

const D_THEME: Record<string, { bg: string; text: string; border: string; pulse: string }> = {
  placed:           { bg: "bg-zinc-50",      text: "text-zinc-600",   border: "border-zinc-200/60",   pulse: "bg-zinc-400" },
  mixing:           { bg: "bg-yellow-50",    text: "text-yellow-800", border: "border-yellow-200/50", pulse: "bg-yellow-500" },
  stretching:       { bg: "bg-yellow-50",    text: "text-yellow-800", border: "border-yellow-200/50", pulse: "bg-yellow-500" },
  resting:          { bg: "bg-amber-50/60",  text: "text-amber-800",  border: "border-amber-200/50",  pulse: "bg-amber-500" },
  cold_proof:       { bg: "bg-sky-50/60",    text: "text-sky-800",    border: "border-sky-200/50",    pulse: "bg-sky-400" },
  baking:           { bg: "bg-orange-50/60", text: "text-orange-800", border: "border-orange-200/50", pulse: "bg-orange-500" },
  out_for_delivery: { bg: "bg-sky-50/60",    text: "text-sky-850",    border: "border-sky-200/50",    pulse: "bg-sky-500" },
  delivered:        { bg: "bg-emerald-50/60",text: "text-emerald-800",border: "border-emerald-200/50",pulse: "bg-emerald-500" },
};

const STATUS_LABELS: Record<string, string> = {
  placed:           "Placed",
  mixing:           "Mixing",
  stretching:       "Stretch & Fold",
  resting:          "Bulk Rest",
  cold_proof:       "Cold Proof",
  baking:           "Baking",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
};

const ORDER_SELECT = "id, order_number, flat_number, customer_name, total_paise, delivery_date, delivery_status, payment_status, notes, order_items(product_name, quantity)";

function getBuilding(flatNumber: string): string {
  const s = flatNumber.trim().toUpperCase();
  // "Tower A" / "Tower 1"
  const tower = s.match(/\bTOWER\s*([A-Z0-9]+)/);
  if (tower) return `Tower ${tower[1]}`;
  // "A Wing" / "Wing A"
  const wing = s.match(/([A-Z])\s+WING|WING\s+([A-Z])/);
  if (wing) return `${wing[1] || wing[2]} Wing`;
  // Letter prefix: A-101, B/204, A101, B 204
  const letterFirst = s.match(/^([A-Z]+)[\s\-\/]?\d/);
  if (letterFirst) return letterFirst[1];
  // Number-then-letter: 4B → suffix letter is the building
  const numLetter = s.match(/^\d+([A-Z])$/);
  if (numLetter) return `Block ${numLetter[1]}`;
  // Pure number
  const numOnly = s.match(/^(\d+)/);
  if (numOnly) return `Floor ${numOnly[1]}`;
  return "Other";
}

function getStepIndex(status: string | null) {
  return BAKER_STEPS.findIndex((s) => s.key === (status || "placed"));
}

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
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"today" | "history">("today");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);

  const [breadTime, setBreadTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      setBreadTime(new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
      }));
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
      .select("id, name, daily_capacity")
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

    const [{ data: ordersData }, { data: holidaySetting }] = await Promise.all([
      supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("baker_id", bakerData.id)
        .eq("delivery_date", todayISO)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: true }),
      supabase
        .from("settings")
        .select("value")
        .eq("key", `baker_holiday_${bakerData.id}`)
        .single(),
    ]);

    setIsHoliday(holidaySetting?.value === "true");
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
  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab, fetchHistory]);
  useEffect(() => {
    const interval = setInterval(() => { if (tab === "today") fetchData(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, tab]);

  const advanceStatus = async (orderId: string, nextStatus: string) => {
    setAdvancingId(orderId);
    const res = await fetch("/api/baker/mark-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, token, nextStatus }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, delivery_status: nextStatus } : o)
      );
    }
    setAdvancingId(null);
  };

  const toggleHoliday = async () => {
    setHolidayLoading(true);
    const res = await fetch("/api/baker/toggle-holiday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, holiday: !isHoliday }),
    });
    if (res.ok) setIsHoliday((h) => !h);
    setHolidayLoading(false);
  };

  const bakeList: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.order_items || []) {
      bakeList[item.product_name] = (bakeList[item.product_name] || 0) + item.quantity;
    }
  }

  // Group orders by building
  const groupedOrders: Record<string, BakerOrder[]> = {};
  for (const order of orders) {
    const building = getBuilding(order.flat_number);
    if (!groupedOrders[building]) groupedOrders[building] = [];
    groupedOrders[building].push(order);
  }
  const buildingKeys = Object.keys(groupedOrders).sort();

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
      <header className="bg-brand-brown text-brand-oat px-5 py-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-lg font-black tracking-tight leading-none text-white">Baker Dashboard</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange mt-1.5">{baker.name} · {today}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Capacity indicator */}
            {baker.daily_capacity && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[7.5px] font-black uppercase text-brand-orange tracking-widest leading-none mb-0.5">Capacity</span>
                <span className={`text-[11px] font-black leading-none ${orders.length >= baker.daily_capacity ? "text-rose-400" : "text-white/90"}`}>
                  {orders.length} / {baker.daily_capacity}
                </span>
              </div>
            )}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[7.5px] font-black uppercase text-brand-orange tracking-widest leading-none mb-0.5">BREAD TIME</span>
              <span className="text-[11px] font-black font-mono text-white/90 leading-none">{breadTime}</span>
            </div>
            {/* Holiday toggle */}
            <button
              onClick={toggleHoliday}
              disabled={holidayLoading}
              title={isHoliday ? "You're on holiday — click to go active" : "Mark yourself on holiday"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border ${
                isHoliday
                  ? "bg-amber-400 border-amber-300 text-amber-900"
                  : "bg-white/10 border-white/10 text-white/50 hover:bg-white/15"
              }`}
            >
              {holidayLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Palmtree className="w-3 h-3" />}
              <span className="hidden sm:inline">{isHoliday ? "On Holiday" : "Holiday"}</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-brand-oat/60 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Holiday banner */}
      {isHoliday && (
        <div className="max-w-lg mx-auto mt-4 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <Palmtree className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-black text-amber-800 text-sm">You&apos;re marked as on holiday.</p>
            <p className="text-[11px] font-bold text-amber-600">New orders won&apos;t be assigned to you today. Toggle off to resume.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-brand-brown/5 sticky top-[68px] z-30 shadow-sm">
        <div className="max-w-lg mx-auto flex">
          {(["today", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-[10px] font-black tracking-[0.2em] uppercase transition-colors relative cursor-pointer ${
                tab === t ? "text-brand-orange" : "text-brand-brown/40 hover:text-brand-brown"
              }`}
            >
              {t === "today" ? `Today (${orders.length})` : "History"}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">

        {tab === "today" && (
          <>
            {/* Cutoff + capacity info strip */}
            <div className="bg-brand-brown/5 border border-brand-brown/10 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40">Order Cutoff</span>
                <p className="text-xs font-black text-brand-brown">12:00 PM IST daily</p>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40">Delivery Days</span>
                <p className="text-xs font-black text-brand-brown">Wednesday &amp; Saturday</p>
              </div>
              {baker.daily_capacity && (
                <div className="ml-auto">
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40">Today&apos;s Load</span>
                  <p className={`text-xs font-black ${orders.length >= baker.daily_capacity ? "text-rose-600" : "text-brand-brown"}`}>
                    {orders.length} of {baker.daily_capacity} slots{orders.length >= baker.daily_capacity ? " — FULL" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Bake Ledger */}
            <section className="bg-white rounded-3xl border border-brand-brown/5 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange">Today&apos;s Bake Ledger</p>
                <span className="text-[10px] font-bold text-brand-brown/40">Total batches</span>
              </div>
              {Object.keys(bakeList).length === 0 ? (
                <p className="text-xs font-bold text-brand-brown/45 italic">No batches to bake today.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(bakeList).map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between border-b border-dashed border-brand-brown/10 pb-2.5 last:border-0 last:pb-0">
                      <span className="font-serif text-sm font-black text-brand-brown">{name}</span>
                      <span className="font-serif text-lg font-black text-brand-orange bg-brand-orange/5 border border-brand-orange/15 px-3 py-0.5 rounded-xl">×{qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Orders grouped by building */}
            {orders.length === 0 ? (
              <div className="bg-white border border-brand-brown/5 rounded-3xl py-12 text-center shadow-sm">
                <span className="text-2xl block mb-1">🌾</span>
                <p className="text-xs font-bold text-brand-brown/40">No orders assigned for today.</p>
              </div>
            ) : (
              buildingKeys.map((building) => (
                <section key={building}>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-[9px] font-black tracking-widest uppercase text-brand-brown/40">
                      {building}
                    </p>
                    <div className="flex-1 h-px bg-brand-brown/8" />
                    <span className="text-[9px] font-black text-brand-brown/30">{groupedOrders[building].length} order{groupedOrders[building].length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {groupedOrders[building].map((order) => {
                      const theme = D_THEME[order.delivery_status] || D_THEME.placed;
                      const nextStatus = BAKER_NEXT[order.delivery_status];
                      const btnLabel = BAKER_BTN[order.delivery_status];
                      const isDone = !nextStatus;
                      const waPhone = order.customer_phone?.replace(/\D/g, "").slice(-10);
                      const isExpanded = expandedId === order.id;
                      const stepIdx = getStepIndex(order.delivery_status);

                      return (
                        <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/5 shadow-sm overflow-hidden">
                          {/* Card header — always visible */}
                          <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-serif font-black text-brand-brown text-base leading-none">Flat {order.flat_number}</p>
                                <p className="text-[10px] font-bold text-brand-brown/45 mt-1.5 uppercase tracking-wide">{order.customer_name} · {order.order_number}</p>
                              </div>
                              <span className={`text-[8.5px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border ${theme.bg} ${theme.text} ${theme.border} inline-flex items-center gap-1.5 shrink-0`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.pulse} ${!isDone ? "animate-ping" : ""}`} />
                                {STATUS_LABELS[order.delivery_status] || order.delivery_status}
                              </span>
                            </div>

                            {/* 8-step bread timeline */}
                            <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none">
                              {BAKER_STEPS.map((step, idx, arr) => {
                                const done = stepIdx >= idx;
                                const active = order.delivery_status === step.key;
                                return (
                                  <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center shrink-0" style={{ minWidth: 32 }}>
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border transition-all ${
                                        active
                                          ? "bg-brand-orange border-brand-orange text-white ring-2 ring-brand-orange/20 scale-125"
                                          : done
                                          ? "bg-brand-brown border-brand-brown text-white"
                                          : "bg-white border-brand-brown/15 text-brand-brown/20"
                                      }`}>
                                        {done && !active ? "✓" : idx + 1}
                                      </span>
                                      <span className={`text-[6.5px] font-black mt-0.5 tracking-wide text-center leading-none ${
                                        active ? "text-brand-orange" : done ? "text-brand-brown" : "text-brand-brown/20"
                                      }`} style={{ maxWidth: 32 }}>
                                        {step.short}
                                      </span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                      <div className={`flex-1 h-px min-w-1 max-w-5 ${stepIdx > idx ? "bg-brand-brown/50" : "bg-brand-brown/10"}`} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 justify-between">
                              <span className="font-serif font-black text-brand-brown text-sm">{fmt(order.total_paise)}</span>
                              <div className="flex items-center gap-2">
                                {/* WA button */}
                                {waPhone && (
                                  <a
                                    href={`https://wa.me/91${waPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[9px] tracking-widest uppercase px-3 py-2 rounded-xl border border-emerald-200/50 transition-colors shadow-sm"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WA</span>
                                  </a>
                                )}
                                {/* Expand to see items */}
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                  className="inline-flex items-center gap-1 bg-brand-oat hover:bg-brand-brown/10 text-brand-brown font-black text-[9px] tracking-widest uppercase px-3 py-2 rounded-xl border border-brand-brown/10 transition-colors"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  Items
                                </button>
                                {/* Advance status */}
                                {!isDone ? (
                                  <button
                                    onClick={() => advanceStatus(order.id, nextStatus)}
                                    disabled={advancingId === order.id}
                                    className={`inline-flex items-center gap-1.5 font-black text-[9px] tracking-widest uppercase px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm ${
                                      nextStatus === "out_for_delivery"
                                        ? "bg-brand-orange hover:bg-amber-500 text-white shadow-brand-orange/20"
                                        : "bg-brand-brown hover:bg-brand-orange text-white shadow-brand-brown/10"
                                    }`}
                                  >
                                    {advancingId === order.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : btnLabel}
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-emerald-700 bg-emerald-50/50 border border-emerald-200/50 px-3 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {order.delivery_status === "delivered" ? "Delivered" : "In Transit"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expandable items + notes */}
                          {isExpanded && (
                            <div className="border-t border-brand-brown/5 px-5 py-4 bg-brand-oat/30 flex flex-col gap-3">
                              <div className="flex flex-col gap-2">
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
                                  <p className="text-xs font-medium text-brand-brown italic">&ldquo;{order.notes}&rdquo;</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </>
        )}

        {tab === "history" && (
          <section>
            <p className="text-[9px] font-black tracking-widest uppercase text-brand-brown/40 mb-3">Past Deliveries</p>
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
                  <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/5 p-5 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif font-black text-brand-brown text-base leading-none">Flat {order.flat_number}</p>
                        <p className="text-[10px] font-bold text-brand-brown/45 mt-1.5 uppercase tracking-wide">
                          {order.customer_name} · {order.order_number} · {deliveryLabel}
                        </p>
                      </div>
                      <span className={`text-[8.5px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border ${theme.bg} ${theme.text} ${theme.border} inline-flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.pulse}`} />
                        {STATUS_LABELS[order.delivery_status] || order.delivery_status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 border-t border-brand-brown/5 pt-3">
                      {(order.order_items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-brown/70">{item.product_name}</span>
                          <span className="font-serif text-sm font-black text-brand-brown bg-brand-brown/5 px-2.5 py-0.5 rounded-lg">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-brand-brown/5 pt-3">
                      <span className="font-serif font-black text-brand-brown text-sm">{fmt(order.total_paise)}</span>
                      <Clock className="w-3.5 h-3.5 text-brand-brown/20" />
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
