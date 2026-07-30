"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  ClipboardList, User, ChevronRight, Package, CheckCircle,
  Loader2, MessageCircle, Palmtree, MapPin, Phone, Bell, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AnnouncementBar from "@/components/AnnouncementBar";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (p: number) => `₹${(p / 100).toFixed(0)}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── types ─────────────────────────────────────────────────────────────────────
interface Baker {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  daily_capacity?: number | null;
}

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
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
  customer_phone?: string | null;
}

// ── constants ─────────────────────────────────────────────────────────────────
const NEXT: Record<string, string> = {
  placed: "mixing", mixing: "stretching", stretching: "resting",
  resting: "cold_proof", cold_proof: "baking", baking: "out_for_delivery",
};

const BTN_LABEL: Record<string, string> = {
  placed: "Start Mixing", mixing: "Stretch & Fold Done",
  stretching: "Start Bulk Rest", resting: "Start Cold Proof",
  cold_proof: "Into the Oven", baking: "Ready for Pickup →",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  placed:           { label: "Confirmed",   cls: "bg-zinc-50 text-zinc-600 border border-zinc-200/60" },
  mixing:           { label: "Mixing",      cls: "bg-yellow-50 text-yellow-700 border border-yellow-200/60" },
  stretching:       { label: "Stretching",  cls: "bg-yellow-50 text-yellow-700 border border-yellow-200/60" },
  resting:          { label: "Bulk Rest",   cls: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  cold_proof:       { label: "Cold Proof",  cls: "bg-sky-50 text-sky-700 border border-sky-200/60" },
  baking:           { label: "Baking",      cls: "bg-orange-50 text-orange-700 border border-orange-200/60" },
  out_for_delivery: { label: "In Transit",  cls: "bg-sky-50 text-sky-700 border border-sky-200/60" },
  delivered:        { label: "Delivered",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200/60" },
};

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

const ORDER_SELECT = "id, order_number, flat_number, customer_name, total_paise, delivery_date, delivery_status, payment_status, notes, created_at, order_items(product_name, quantity)";

const BULK_STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: "baking", label: "Baked" },
  { key: "out_for_delivery", label: "In Transit" },
  { key: "delivered", label: "Completed" },
];

type Panel = "queue" | "history" | "profile";

// ── component ─────────────────────────────────────────────────────────────────
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
  const [panel, setPanel] = useState<Panel>("queue");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // notifications
  interface Notif { id: string; title: string; body: string | null; read: boolean; created_at: string; }
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const unreadCount = notifs.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/notifications/baker?token=${token}`);
      if (res.ok) { const d = await res.json(); setNotifs(d.notifications || []); }
    } finally { setNotifLoading(false); }
  }, [token]);

  const markAllRead = async () => {
    await fetch("/api/notifications/baker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  // profile edit
  const [phoneEdit, setPhoneEdit] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [addressEdit, setAddressEdit] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  // ── data fetching ────────────────────────────────────────────────────────────
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
      .select("id, name, phone, address, daily_capacity")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (bErr || !b) { setError("Invalid or expired link."); setLoading(false); return; }
    setBaker(b);
    setBakerId(b.id);

    const [{ data: ordersData }, { data: holidaySetting }, { count }] = await Promise.all([
      supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("baker_id", b.id)
        .eq("payment_status", "paid")
        .not("delivery_status", "eq", "delivered")
        .order("created_at", { ascending: true }),
      supabase.from("settings").select("value").eq("key", `baker_holiday_${b.id}`).single(),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("baker_id", b.id)
        .eq("payment_status", "paid")
        .eq("delivery_status", "delivered"),
    ]);

    setIsHoliday(holidaySetting?.value === "true");
    setDeliveredCount(count ?? 0);
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
      .order("created_at", { ascending: false })
      .limit(40);
    setHistory((data || []) as BakerOrder[]);
    setHistoryLoading(false);
  }, [bakerId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (panel === "history" && bakerId) fetchHistory(); }, [panel, bakerId, fetchHistory]);
  useEffect(() => {
    const iv = setInterval(() => { if (panel === "queue") fetchData(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchData, panel]);
  useEffect(() => {
    if (!token) return;
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(iv);
  }, [fetchNotifs, token]);

  // ── actions ──────────────────────────────────────────────────────────────────
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

  const toggleSelected = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const bulkUpdateStatus = async (nextStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    const orderIds = Array.from(selectedIds);
    const res = await fetch("/api/baker/bulk-update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds, token, nextStatus }),
    });
    if (res.ok) {
      if (nextStatus === "delivered") {
        setQueue((p) => p.filter((o) => !selectedIds.has(o.id)));
      } else {
        setQueue((p) => p.map((o) => selectedIds.has(o.id) ? { ...o, delivery_status: nextStatus } : o));
      }
      setSelectedIds(new Set());
    }
    setBulkUpdating(false);
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

  const savePhone = async () => {
    const cleaned = phoneEdit.replace(/\D/g, "").slice(-10);
    if (cleaned.length < 10) return;
    setPhoneSaving(true);
    const res = await fetch("/api/baker/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, phone: cleaned }),
    });
    if (res.ok) { setBaker((b) => b ? { ...b, phone: cleaned } : b); setEditingPhone(false); }
    setPhoneSaving(false);
  };

  const saveAddress = async () => {
    const trimmed = addressEdit.trim();
    if (!trimmed) return;
    setAddressSaving(true);
    const res = await fetch("/api/baker/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, address: trimmed }),
    });
    if (res.ok) { setBaker((b) => b ? { ...b, address: trimmed } : b); setEditingAddress(false); }
    setAddressSaving(false);
  };

  // ── derived ──────────────────────────────────────────────────────────────────
  const totalBaked = deliveredCount;
  const bakeList: Record<string, number> = {};
  for (const o of queue)
    for (const item of o.order_items || [])
      bakeList[item.product_name] = (bakeList[item.product_name] || 0) + item.quantity;

  const NAV: { key: Panel; Icon: React.ElementType; label: string }[] = [
    { key: "queue",   Icon: ClipboardList, label: `Queue (${queue.length})` },
    { key: "history", Icon: Package,       label: "History" },
    { key: "profile", Icon: User,          label: "Profile" },
  ];

  // ── loading / error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-brand-orange animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading…</p>
        </div>
      </main>
    );
  }

  if (error || !baker) {
    return (
      <main className="min-h-screen bg-[#f7f4f0] flex flex-col items-center justify-center gap-4 px-5 text-center">
        <Image src="/WWY-LOGO_White.png" alt="WWY" width={60} height={60} className="object-contain opacity-30" />
        <p className="font-black text-brand-brown text-lg">Invalid Link</p>
        <p className="text-xs font-bold text-gray-400">{error}</p>
      </main>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f4f0]">
      <AnnouncementBar />

      {/* ── Notification panel ── */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setNotifOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-brown/60" />
                <p className="font-black text-brand-brown text-sm">Notifications</p>
                {unreadCount > 0 && <span className="bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-brown transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifLoading && notifs.length === 0 ? (
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest text-center py-12 animate-pulse">Loading…</p>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Bell className="w-10 h-10 text-gray-200" />
                  <p className="text-xs font-black text-gray-300">No notifications yet</p>
                </div>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-5 py-3.5 border-b border-gray-50 last:border-0 ${!n.read ? "bg-brand-oat/40" : ""}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.read ? "font-bold text-gray-500" : "font-black text-brand-brown"}`}>{n.title}</p>
                      {n.body && <p className="text-xs text-gray-400 font-medium mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-gray-300 font-bold mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-orange rounded-full shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-wider uppercase text-gray-400">Baker Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setNotifOpen(true); fetchNotifs(); }} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-400" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <div className="bg-brand-oat p-1 rounded-lg">
              <Image src="/logo.png" alt="WWY" width={26} height={26} className="object-contain" />
            </div>
            <span className="font-black text-brand-brown text-sm hidden sm:block">Wild Wild Yeast</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-5">

        {/* ── Left sidebar ── */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-brand-brown px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/15 text-white font-black text-xl flex items-center justify-center shrink-0 border-2 border-white/20">
                  {baker.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-white text-base leading-tight truncate">{baker.name}</p>
                  <p className="text-white/50 text-[11px] font-bold mt-0.5">Baker</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              <div className="px-4 py-3 text-center">
                <p className="font-black text-brand-brown text-lg leading-none">{queue.length}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">In Queue</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="font-black text-brand-brown text-lg leading-none">{totalBaked}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Delivered</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="p-2">
              {NAV.map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPanel(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all cursor-pointer
                    ${panel === key
                      ? "bg-brand-brown text-white shadow-sm"
                      : "text-gray-400 hover:text-brand-brown hover:bg-gray-50"}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${panel === key ? "text-brand-orange" : "text-gray-300"}`} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Holiday toggle */}
          <button
            onClick={toggleHoliday}
            disabled={holidayLoading}
            className={`rounded-2xl px-5 py-4 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm cursor-pointer ${
              isHoliday
                ? "bg-amber-100 border border-amber-300 text-amber-800"
                : "bg-brand-brown hover:bg-brand-orange text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              {holidayLoading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Palmtree className={`w-5 h-5 ${isHoliday ? "text-amber-600" : "text-brand-orange"}`} />}
              <div className="text-left">
                <p className="font-black text-sm leading-none">{isHoliday ? "On Holiday" : "Holiday Mode"}</p>
                <p className={`text-[11px] font-bold mt-0.5 ${isHoliday ? "text-amber-600" : "text-white/40"}`}>
                  {isHoliday ? "No new orders assigned" : "Turn on to pause orders"}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${isHoliday ? "text-amber-400" : "text-white/40"}`} />
          </button>

          {/* Address warning */}
          {!baker.address && (
            <div className="bg-white border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-xs font-black text-amber-700 leading-snug">
                ⚠ No pickup address — Borzo deliveries will be skipped.{" "}
                <button onClick={() => setPanel("profile")} className="underline underline-offset-2 cursor-pointer">Add it →</button>
              </p>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ══ QUEUE PANEL ══ */}
          {panel === "queue" && (
            <>
              {/* Bake ledger */}
              {Object.keys(bakeList).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="font-black text-brand-brown text-sm">Today&apos;s Bake Ledger</p>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    {Object.entries(bakeList).map(([name, qty]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="font-bold text-gray-600 text-sm">{name}</span>
                        <span className="font-black text-brand-brown bg-brand-oat px-3 py-1 rounded-xl text-sm border border-brand-brown/10">×{qty}</span>
                      </div>
                    ))}
                    {baker.daily_capacity && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Capacity</p>
                          <p className={`text-[10px] font-black ${queue.length >= baker.daily_capacity ? "text-rose-500" : "text-gray-400"}`}>
                            {queue.length} / {baker.daily_capacity}
                          </p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${queue.length >= baker.daily_capacity ? "bg-rose-400" : "bg-brand-orange"}`}
                            style={{ width: `${Math.min((queue.length / baker.daily_capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-black text-brand-brown text-sm">Active Orders</p>
                  <p className="text-[11px] font-bold text-gray-400">{queue.length} orders</p>
                </div>

                {selectedIds.size > 0 && (
                  <div className="mx-5 mt-4 bg-brand-oat/70 border border-brand-brown/10 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                    <p className="text-xs font-black text-brand-brown mr-1">{selectedIds.size} selected</p>
                    {BULK_STATUS_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => bulkUpdateStatus(key)}
                        disabled={bulkUpdating}
                        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-brand-brown hover:bg-brand-orange text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {bulkUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : `Mark ${label}`}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      disabled={bulkUpdating}
                      className="ml-auto text-[11px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-brown transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {baker.daily_capacity && queue.length >= baker.daily_capacity && (
                  <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-black text-rose-700">
                      ⚠ Queue full — {queue.length}/{baker.daily_capacity} orders. No new orders will be assigned until you complete some.
                    </p>
                  </div>
                )}

              {queue.length === 0 && (
                  <div className="px-5 py-14 text-center flex flex-col items-center gap-3">
                    <Package className="w-10 h-10 text-gray-200" />
                    <p className="font-black text-gray-300 text-sm">No active orders.</p>
                    <p className="text-xs font-bold text-gray-300">New orders appear here once assigned and paid.</p>
                  </div>
                )}

                {queue.map((order) => {
                  const badge = STATUS_BADGE[order.delivery_status] || STATUS_BADGE.placed;
                  const nextStatus = NEXT[order.delivery_status];
                  const btnLabel = BTN_LABEL[order.delivery_status];
                  const isDone = !nextStatus;
                  const stepIdx = STEPS.findIndex((s) => s.key === (order.delivery_status || "placed"));
                  const isExpanded = expandedId === order.id;
                  const waPhone = order.customer_phone?.replace(/\D/g, "").slice(-10);

                  return (
                    <div key={order.id} className="border-b border-gray-50 last:border-0">
                      {/* Row header — tap to expand */}
                      <div className="w-full pl-5 pr-2 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelected(order.id)}
                          className="w-4 h-4 accent-brand-orange rounded shrink-0 cursor-pointer"
                        />
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className="flex-1 min-w-0 py-4 pr-3 flex items-center gap-4 text-left cursor-pointer"
                        >
                        <div className="w-10 h-10 rounded-xl bg-brand-oat flex items-center justify-center shrink-0">
                          <span className="font-black text-brand-brown text-xs">{order.flat_number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-brand-brown text-sm leading-none">{order.customer_name}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-400 mt-1">
                            {(order.order_items || []).map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-brand-brown text-sm">{fmt(order.total_paise)}</p>
                          {order.delivery_date && (
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{fmtDate(order.delivery_date)}</p>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 bg-gray-50/50">

                          {/* Progress bar */}
                          <div className="flex items-start mb-4 pt-1">
                            {STEPS.map((step, idx) => {
                              const done = stepIdx >= idx;
                              const active = stepIdx === idx;
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center gap-1 shrink-0">
                                    <div className={`rounded-full transition-all ${
                                      active
                                        ? "w-3 h-3 bg-brand-brown ring-2 ring-brand-brown ring-offset-1"
                                        : done
                                        ? "w-2.5 h-2.5 bg-brand-orange"
                                        : "w-2 h-2 bg-gray-200"
                                    }`} />
                                    <span className={`text-[6px] font-black leading-none text-center ${
                                      active ? "text-brand-brown" : done ? "text-brand-orange" : "text-gray-300"
                                    }`}>{step.short}</span>
                                  </div>
                                  {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mt-1.5 mb-3 ${stepIdx > idx ? "bg-brand-orange" : "bg-gray-200"}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {/* Items */}
                          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-3">
                            {(order.order_items || []).map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-brand-oat text-brand-brown font-black text-xs flex items-center justify-center shrink-0">{item.quantity}</span>
                                  <span className="text-sm font-bold text-gray-600">{item.product_name}</span>
                                </div>
                              </div>
                            ))}
                            {order.notes && (
                              <div className="px-4 py-3 bg-amber-50/60 border-t border-amber-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-0.5">Note</p>
                                <p className="text-xs font-medium text-gray-600 italic">&ldquo;{order.notes}&rdquo;</p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {waPhone && (
                              <a
                                href={`https://wa.me/91${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-xs font-black transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            )}
                            {!isDone ? (
                              <button
                                onClick={() => advance(order.id, nextStatus)}
                                disabled={advancingId === order.id}
                                className={`ml-auto flex items-center gap-2 font-black text-xs tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all active:scale-[0.97] shadow-sm cursor-pointer ${
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
                              <span className="ml-auto flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200/60">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {order.delivery_status === "delivered" ? "Delivered" : "In Transit"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══ HISTORY PANEL ══ */}
          {panel === "history" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-black text-brand-brown text-sm">Delivery History</p>
                <p className="text-[11px] font-bold text-gray-400">{history.length} orders</p>
              </div>

              {historyLoading && (
                <div className="flex flex-col divide-y divide-gray-50">
                  {[1,2,3].map((n) => (
                    <div key={n} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="h-3.5 bg-gray-100 rounded w-32 mb-2" />
                        <div className="h-2.5 bg-gray-50 rounded w-20" />
                      </div>
                      <div className="h-3.5 bg-gray-100 rounded w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <div className="px-5 py-14 text-center flex flex-col items-center gap-3">
                  <CheckCircle className="w-10 h-10 text-gray-200" />
                  <p className="font-black text-gray-300 text-sm">No past deliveries yet.</p>
                </div>
              )}

              {history.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <div key={order.id} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-oat flex items-center justify-center shrink-0">
                        <span className="font-black text-brand-brown text-xs">{order.flat_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-brand-brown text-sm leading-none">{order.customer_name}</p>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">Delivered</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 mt-1">{fmtDate(order.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-brand-brown text-sm">{fmt(order.total_paise)}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                          {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-gray-50/50">
                        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                          {(order.order_items || []).map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-brand-oat text-brand-brown font-black text-xs flex items-center justify-center shrink-0">{item.quantity}</span>
                                <span className="text-sm font-bold text-gray-600">{item.product_name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ PROFILE PANEL ══ */}
          {panel === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-black text-brand-brown text-sm">Profile Details</p>
              </div>
              <div className="p-5 flex flex-col gap-4">

                {/* Read-only */}
                {[
                  { label: "Full Name", value: baker.name || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
                    <p className="font-black text-brand-brown text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">{value}</p>
                  </div>
                ))}

                {/* Phone — editable */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Phone Number</p>
                    {!editingPhone && (
                      <button
                        onClick={() => { setPhoneEdit(baker.phone || ""); setEditingPhone(true); }}
                        className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {baker.phone ? "Edit" : "+ Add"}
                      </button>
                    )}
                  </div>
                  {editingPhone ? (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border-2 border-brand-brown/20 focus-within:border-brand-brown px-4 py-3">
                        <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-sm font-black text-gray-400">+91</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoFocus
                          maxLength={10}
                          placeholder="9876543210"
                          value={phoneEdit}
                          onChange={(e) => setPhoneEdit(e.target.value.replace(/\D/g, ""))}
                          className="flex-1 font-black text-brand-brown text-sm bg-transparent outline-none"
                        />
                      </div>
                      <button
                        onClick={savePhone}
                        disabled={phoneSaving || phoneEdit.replace(/\D/g, "").length < 10}
                        className="bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-4 rounded-xl hover:bg-brand-orange transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {phoneSaving ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingPhone(false)}
                        className="text-gray-400 font-black text-xs px-3 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="font-black text-brand-brown text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      {baker.phone ? `+91 ${baker.phone}` : <span className="text-gray-300 font-bold">Not added yet</span>}
                    </p>
                  )}
                </div>

                {/* Pickup address — editable */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pickup Address</p>
                    {!editingAddress && (
                      <button
                        onClick={() => { setAddressEdit(baker.address || ""); setEditingAddress(true); }}
                        className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {baker.address ? "Edit" : "+ Add"}
                      </button>
                    )}
                  </div>
                  {editingAddress ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        rows={3}
                        placeholder="Full address incl. building, street, area, city, pincode"
                        value={addressEdit}
                        onChange={(e) => setAddressEdit(e.target.value)}
                        className="font-bold text-brand-brown text-sm bg-white rounded-xl px-4 py-3 border-2 border-brand-brown/20 focus:border-brand-brown outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveAddress}
                          disabled={addressSaving || !addressEdit.trim()}
                          className="flex-1 bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl hover:bg-brand-orange transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {addressSaving ? "Saving…" : "Save Address"}
                        </button>
                        <button
                          onClick={() => setEditingAddress(false)}
                          className="text-gray-400 font-black text-xs px-4 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-bold text-brand-brown text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 leading-snug">
                      {baker.address || <span className="text-gray-300">Not added yet</span>}
                    </p>
                  )}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold text-gray-400">This address is used as the courier pickup point for Borzo deliveries.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
