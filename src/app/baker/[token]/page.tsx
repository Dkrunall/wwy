"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  RefreshCw, Loader2, CheckCircle2, MessageCircle,
  ChevronDown, ChevronUp, Palmtree, Package, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BakerOrder {
  id: string;
  order_number: string | null;
  flat_number: string;
  customer_name: string;
  total_paise: number;
  delivery_date: string | null;
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

const fmt = (p: number) => `₹${(p / 100).toFixed(0)}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

const STEPS = [
  { key: "placed",           short: "Placed" },
  { key: "mixing",           short: "Mixing" },
  { key: "stretching",       short: "Stretch" },
  { key: "resting",          short: "Rest" },
  { key: "cold_proof",       short: "Proof" },
  { key: "baking",           short: "Baking" },
  { key: "out_for_delivery", short: "Transit" },
  { key: "delivered",        short: "Done" },
];

const NEXT: Record<string, string> = {
  placed: "mixing", mixing: "stretching", stretching: "resting",
  resting: "cold_proof", cold_proof: "baking", baking: "out_for_delivery",
};

const BTN_LABEL: Record<string, string> = {
  placed: "Start Mixing", mixing: "Stretch & Fold Done",
  stretching: "Start Bulk Rest", resting: "Start Cold Proof",
  cold_proof: "Into the Oven", baking: "Ready for Pickup →",
};

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  placed:           { label: "Placed",        cls: "bg-zinc-50 text-zinc-600 border-zinc-200/60",     dot: "bg-zinc-400" },
  mixing:           { label: "Mixing",        cls: "bg-yellow-50 text-yellow-700 border-yellow-200",  dot: "bg-yellow-500" },
  stretching:       { label: "Stretching",    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",  dot: "bg-yellow-500" },
  resting:          { label: "Bulk Rest",     cls: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
  cold_proof:       { label: "Cold Proof",    cls: "bg-sky-50 text-sky-700 border-sky-200",           dot: "bg-sky-400" },
  baking:           { label: "Baking",        cls: "bg-orange-50 text-orange-700 border-orange-200",  dot: "bg-orange-500" },
  out_for_delivery: { label: "In Transit",    cls: "bg-sky-50 text-sky-700 border-sky-200",           dot: "bg-sky-500" },
  delivered:        { label: "Delivered",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const ORDER_SELECT = "id, order_number, flat_number, customer_name, total_paise, delivery_date, delivery_status, payment_status, notes, order_items(product_name, quantity)";

export default function BakerDashboard() {
  const params = useParams();
  const token = params.token as string;

  const [baker, setBaker] = useState<Baker | null>(null);
  const [bakerId, setBakerId] = useState<string | null>(null);
  const [queue, setQueue] = useState<BakerOrder[]>([]);
  const [history, setHistory] = useState<BakerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);

  const enrichPhones = async (rows: BakerOrder[]): Promise<BakerOrder[]> => {
    if (!rows.length) return rows;
    const flats = [...new Set(rows.map((o) => o.flat_number))];
    const { data: custs } = await supabase.from("customers").select("flat_number, phone").in("flat_number", flats);
    const map: Record<string, string | null> = {};
    for (const c of custs || []) map[c.flat_number] = c.phone;
    return rows.map((o) => ({ ...o, customer_phone: map[o.flat_number] ?? null }));
  };

  const fetchData = useCallback(async () => {
    const { data: b, error: bErr } = await supabase
      .from("bakers")
      .select("id, name, daily_capacity")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (bErr || !b) { setError("Invalid or expired link."); setLoading(false); return; }
    setBaker(b);
    setBakerId(b.id);

    const [{ data: ordersData }, { data: holidaySetting }] = await Promise.all([
      supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("baker_id", b.id)
        .eq("payment_status", "paid")
        .not("delivery_status", "eq", "delivered")
        .order("created_at", { ascending: true }),
      supabase.from("settings").select("value").eq("key", `baker_holiday_${b.id}`).single(),
    ]);

    setIsHoliday(holidaySetting?.value === "true");
    setQueue(await enrichPhones((ordersData || []) as BakerOrder[]));
    setLoading(false);
  }, [token]);

  const fetchHistory = useCallback(async () => {
    if (!bakerId) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("baker_id", bakerId)
      .eq("payment_status", "paid")
      .eq("delivery_status", "delivered")
      .order("updated_at", { ascending: false })
      .limit(40);
    setHistory((data || []) as BakerOrder[]);
    setHistoryLoading(false);
  }, [bakerId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === "history" && bakerId) fetchHistory(); }, [tab, bakerId, fetchHistory]);
  useEffect(() => {
    const iv = setInterval(() => { if (tab === "queue") fetchData(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchData, tab]);

  const advance = async (orderId: string, nextStatus: string) => {
    setAdvancingId(orderId);
    const res = await fetch("/api/baker/mark-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, token, nextStatus }),
    });
    if (res.ok) {
      if (nextStatus === "delivered") {
        setQueue((p) => p.filter((o) => o.id !== orderId));
      } else {
        setQueue((p) => p.map((o) => o.id === orderId ? { ...o, delivery_status: nextStatus } : o));
      }
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

  // Bake totals across queue
  const bakeList: Record<string, number> = {};
  for (const o of queue)
    for (const item of o.order_items || [])
      bakeList[item.product_name] = (bakeList[item.product_name] || 0) + item.quantity;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-brand-orange animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40 animate-pulse">Loading dashboard…</p>
      </main>
    );
  }

  if (error || !baker) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-4 px-5 text-center">
        <Image src="/WWY-LOGO_White.png" alt="WWY" width={64} height={64} className="object-contain opacity-40" />
        <p className="font-black text-brand-brown text-lg tracking-tight">Invalid Link</p>
        <p className="text-xs font-bold text-brand-brown/40">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-brand-brown/8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/WWY-LOGO_White.png" alt="WWY" width={36} height={36} className="object-contain" />
            <div>
              <p className="font-black text-brand-brown text-sm leading-none">{baker.name}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mt-0.5">Baker Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHoliday}
              disabled={holidayLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border cursor-pointer ${
                isHoliday
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-brand-oat border-brand-brown/10 text-brand-brown/50 hover:text-brand-brown"
              }`}
            >
              {holidayLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Palmtree className="w-3 h-3" />}
              {isHoliday ? "On Holiday" : "Holiday"}
            </button>
            <button onClick={fetchData} className="p-2 rounded-xl hover:bg-brand-oat text-brand-brown/30 hover:text-brand-brown transition-all cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Holiday banner ───────────────────────────────────────────────────── */}
      {isHoliday && (
        <div className="max-w-lg mx-auto mt-4 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Palmtree className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-800">You&apos;re on holiday — no new orders will be assigned.</p>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl border border-brand-brown/8 flex overflow-hidden shadow-sm">
          {(["queue", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[10px] font-black tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                tab === t
                  ? "bg-brand-brown text-white"
                  : "text-brand-brown/40 hover:text-brand-brown"
              }`}
            >
              {t === "queue" ? `Queue (${queue.length})` : "History"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* ── QUEUE TAB ───────────────────────────────────────────────────────── */}
        {tab === "queue" && (
          <>
            {/* Bake ledger */}
            {Object.keys(bakeList).length > 0 && (
              <div className="bg-white rounded-3xl border border-brand-brown/8 p-5 shadow-sm">
                <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange mb-4">Today&apos;s Bake Ledger</p>
                <div className="flex flex-col gap-2.5">
                  {Object.entries(bakeList).map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="font-serif text-sm font-black text-brand-brown">{name}</span>
                      <span className="font-serif text-base font-black text-brand-orange bg-brand-orange/8 px-3 py-0.5 rounded-xl border border-brand-orange/15">×{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity */}
            {baker.daily_capacity && (
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1 h-1.5 bg-brand-brown/8 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${queue.length >= baker.daily_capacity ? "bg-rose-500" : "bg-brand-orange"}`}
                    style={{ width: `${Math.min((queue.length / baker.daily_capacity) * 100, 100)}%` }}
                  />
                </div>
                <p className={`text-[10px] font-black shrink-0 ${queue.length >= baker.daily_capacity ? "text-rose-600" : "text-brand-brown/50"}`}>
                  {queue.length} / {baker.daily_capacity} orders
                </p>
              </div>
            )}

            {/* Empty state */}
            {queue.length === 0 && (
              <div className="bg-white rounded-3xl border border-brand-brown/8 py-16 text-center shadow-sm">
                <Package className="w-8 h-8 text-brand-brown/15 mx-auto mb-3" />
                <p className="text-sm font-black text-brand-brown/30">No active orders.</p>
                <p className="text-xs font-bold text-brand-brown/20 mt-1">New orders will appear here once assigned and paid.</p>
              </div>
            )}

            {/* Order cards */}
            {queue.map((order) => {
              const badge = STATUS_BADGE[order.delivery_status] || STATUS_BADGE.placed;
              const nextStatus = NEXT[order.delivery_status];
              const btnLabel = BTN_LABEL[order.delivery_status];
              const isDone = !nextStatus;
              const stepIdx = STEPS.findIndex((s) => s.key === (order.delivery_status || "placed"));
              const isExpanded = expandedId === order.id;
              const waPhone = order.customer_phone?.replace(/\D/g, "").slice(-10);

              return (
                <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/8 shadow-sm overflow-hidden">

                  {/* Card body */}
                  <div className="p-5 flex flex-col gap-4">

                    {/* Top row: flat + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif font-black text-brand-brown text-xl leading-none">Flat {order.flat_number}</p>
                        <p className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-wider mt-1.5">
                          {order.customer_name}
                          {order.order_number ? ` · ${order.order_number}` : ""}
                          {order.delivery_date ? ` · ${fmtDate(order.delivery_date)}` : ""}
                        </p>
                      </div>
                      <span className={`text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 shrink-0 ${badge.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${!isDone ? "animate-ping" : ""}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1">
                      {STEPS.map((step, idx) => {
                        const done = stepIdx >= idx;
                        const active = stepIdx === idx;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className={`rounded-full transition-all ${
                                active
                                  ? "w-3 h-3 bg-brand-orange ring-2 ring-brand-orange/25"
                                  : done
                                  ? "w-2.5 h-2.5 bg-brand-brown"
                                  : "w-2 h-2 bg-brand-brown/10"
                              }`} />
                              <span className={`text-[6px] font-black leading-none ${active ? "text-brand-orange" : done ? "text-brand-brown/50" : "text-brand-brown/15"}`}>
                                {step.short}
                              </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                              <div className={`flex-1 h-px mb-3 ${stepIdx > idx ? "bg-brand-brown/30" : "bg-brand-brown/8"}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Items preview + expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="flex items-center justify-between w-full text-left cursor-pointer"
                    >
                      <p className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest">
                        {(order.order_items || []).map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}
                      </p>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-brand-brown/30 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-brown/30 shrink-0" />}
                    </button>

                    {/* Action row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-brand-brown/6">
                      <span className="font-serif font-black text-brand-brown text-base mr-auto">{fmt(order.total_paise)}</span>

                      {waPhone && (
                        <a
                          href={`https://wa.me/91${waPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      {!isDone ? (
                        <button
                          onClick={() => advance(order.id, nextStatus)}
                          disabled={advancingId === order.id}
                          className={`flex items-center gap-2 font-black text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-2xl transition-all active:scale-[0.97] shadow-sm cursor-pointer ${
                            nextStatus === "out_for_delivery"
                              ? "bg-brand-orange hover:bg-amber-500 text-white"
                              : "bg-brand-brown hover:bg-brand-orange text-white"
                          }`}
                        >
                          {advancingId === order.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : btnLabel}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {order.delivery_status === "delivered" ? "Delivered" : "In Transit"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded: items + notes */}
                  {isExpanded && (
                    <div className="border-t border-brand-brown/6 bg-brand-oat/40 px-5 py-4 flex flex-col gap-3">
                      {(order.order_items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-brand-brown/70">{item.product_name}</span>
                          <span className="font-serif text-sm font-black text-brand-brown bg-white px-2.5 py-0.5 rounded-lg border border-brand-brown/8">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="mt-1 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl px-4 py-3">
                          <p className="text-[9px] font-black tracking-widest uppercase text-brand-orange mb-1">Customer Note</p>
                          <p className="text-xs font-medium text-brand-brown/70 italic">&ldquo;{order.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── HISTORY TAB ─────────────────────────────────────────────────────── */}
        {tab === "history" && (
          <>
            {historyLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
                <p className="text-[9px] font-black tracking-widest uppercase text-brand-brown/30">Loading history…</p>
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="bg-white rounded-3xl border border-brand-brown/8 py-16 text-center shadow-sm">
                <Clock className="w-7 h-7 text-brand-brown/15 mx-auto mb-3" />
                <p className="text-sm font-black text-brand-brown/30">No past deliveries yet.</p>
              </div>
            )}
            {history.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-brand-brown/8 p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif font-black text-brand-brown text-lg leading-none">Flat {order.flat_number}</p>
                    <p className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-wider mt-1.5">
                      {order.customer_name}
                      {order.delivery_date ? ` · ${fmtDate(order.delivery_date)}` : ""}
                    </p>
                  </div>
                  <span className="text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Delivered
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-brand-brown/6 pt-3">
                  {(order.order_items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-brown/60">{item.product_name}</span>
                      <span className="font-serif text-sm font-black text-brand-brown">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <p className="font-serif font-black text-brand-brown text-sm border-t border-brand-brown/6 pt-3">{fmt(order.total_paise)}</p>
              </div>
            ))}
          </>
        )}

      </div>
    </main>
  );
}
