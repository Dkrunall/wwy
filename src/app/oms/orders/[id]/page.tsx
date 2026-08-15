"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmt, fmtDate, getStepIndex, D_LABELS, D_THEME, PAY_THEME } from "@/lib/orderDisplay";
import OmsSidebar from "@/components/OmsSidebar";
import {
  ChevronLeft, Check, Loader2, Phone, FileText, Activity, MessageCircle,
  CalendarDays, XCircle, Send, StickyNote, ChevronDown,
} from "lucide-react";

interface OrderItem { id: string; product_name: string; quantity: number; unit_price_paise: number; }
interface OrderDetail {
  id: string; order_number: string | null; flat_number: string; customer_name: string;
  total_paise: number; shipping_fee_paise: number | null; status: string; payment_status: string | null;
  delivery_status: string | null; delivery_date: string | null; invoice_url: string | null;
  baker_id: string | null; notes: string | null; admin_notes: string | null;
  borzo_tracking_url: string | null; source: string | null; created_at: string;
  order_items?: OrderItem[];
}
interface Customer { name: string; phone: string | null; address?: string | null; pincode?: string | null; }
interface Baker { id: string; name: string; phone: string; is_active: boolean; pincodes?: string[]; }

const STEPS = [
  { key: "placed", label: "1. Placed" },
  { key: "resting", label: "2. Resting" },
  { key: "baking", label: "3. Baking" },
  { key: "out_for_delivery", label: "4. Transit" },
  { key: "delivered", label: "5. Done" },
];

const inputCls = "w-full bg-brand-oat/40 border border-brand-brown/15 rounded-2xl px-4 py-3 font-bold text-brand-brown text-sm outline-none focus:border-brand-orange transition-colors";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [noteVal, setNoteVal] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [resendingInvoice, setResendingInvoice] = useState(false);
  const [assigningBaker, setAssigningBaker] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Shared sidebar chrome state
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/oms/vacation").then(r => r.json()).then(d => setVacationMode(d.vacation_mode === true)).catch(() => {});
    fetch("/api/notifications").then(r => r.json()).then(d => setUnreadCount((d.notifications || []).filter((n: { read: boolean }) => !n.read).length)).catch(() => {});
  }, []);

  const toggleVacation = async () => {
    setVacationLoading(true);
    const nv = !vacationMode;
    await fetch("/api/oms/vacation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: nv }) });
    setVacationMode(nv);
    setVacationLoading(false);
  };

  const runCron = async () => {
    const r = await fetch("/api/oms/cron", { method: "POST" });
    const d = await r.json();
    alert(`Cron ran. ${d.processed || 0} order(s) updated.`);
  };

  const logout = async () => { await fetch("/api/oms/auth", { method: "DELETE" }); router.push("/oms/login"); };

  const fetchData = useCallback(async () => {
    const { data: o, error: oErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (oErr || !o) { setError("Order not found."); setLoading(false); return; }
    setOrder(o);
    setNoteVal(o.admin_notes || "");
    setDateInput(o.delivery_date || "");

    const [{ data: c }, { data: b }] = await Promise.all([
      supabase.from("customers").select("name, phone, address, pincode").eq("flat_number", o.flat_number).maybeSingle(),
      supabase.from("bakers").select("id, name, phone, is_active, pincodes").order("name"),
    ]);
    setCustomer(c || null);
    setBakers(b || []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAsPaid = async () => {
    if (!order) return;
    setMarkingPaid(true);
    const r = await fetch("/api/oms/orders/mark-paid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id }) });
    const d = await r.json();
    if (d.ok) setOrder(o => o ? { ...o, payment_status: "paid", status: "confirmed", invoice_url: d.invoiceUrl || o.invoice_url } : o);
    setMarkingPaid(false);
  };

  const resendInvoice = async () => {
    if (!order) return;
    setResendingInvoice(true);
    const r = await fetch("/api/oms/orders/resend-invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id }) });
    const d = await r.json();
    if (d.ok && d.invoiceUrl) setOrder(o => o ? { ...o, invoice_url: d.invoiceUrl } : o);
    setResendingInvoice(false);
  };

  const saveAdminNote = async () => {
    if (!order) return;
    setSavingNote(true);
    await supabase.from("orders").update({ admin_notes: noteVal || null }).eq("id", order.id);
    setOrder(o => o ? { ...o, admin_notes: noteVal || null } : o);
    setSavingNote(false);
  };

  const assignBaker = async (bakerId: string | null) => {
    if (!order) return;
    setAssigningBaker(true);
    await supabase.from("orders").update({ baker_id: bakerId }).eq("id", order.id);
    setOrder(o => o ? { ...o, baker_id: bakerId } : o);
    setAssigningBaker(false);
  };

  const saveDeliveryDate = async () => {
    if (!order || !dateInput) return;
    setSavingDate(true);
    await supabase.from("orders").update({ delivery_date: dateInput }).eq("id", order.id);
    setOrder(o => o ? { ...o, delivery_date: dateInput } : o);
    setSavingDate(false);
    setEditingDate(false);
  };

  const cancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    await supabase.from("orders").update({ status: "cancelled", delivery_status: "cancelled" }).eq("id", order.id);
    setOrder(o => o ? { ...o, status: "cancelled", delivery_status: "cancelled" } : o);
    setCancelling(false);
    setConfirmingCancel(false);
  };

  const chromeProps = {
    activeTab: "orders" as const,
    unreadCount,
    onBellClick: () => router.push("/oms"),
    vacationMode,
    vacationLoading,
    onToggleVacation: toggleVacation,
    onCron: runCron,
    onRefresh: fetchData,
    refreshing: loading,
    onLogout: logout,
    mobileMenuOpen,
    setMobileMenuOpen,
    mobileTitle: "Order Details",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-oat text-brand-brown font-sans flex flex-col md:flex-row antialiased">
        <OmsSidebar {...chromeProps} />
        <main className="flex-1 md:pl-72 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-brand-oat text-brand-brown font-sans flex flex-col md:flex-row antialiased">
        <OmsSidebar {...chromeProps} />
        <main className="flex-1 md:pl-72 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-sm font-bold text-brand-brown/40">{error}</p>
          <Link href="/oms" className="text-xs font-black uppercase tracking-widest text-brand-orange">← Back to Orders</Link>
        </main>
      </div>
    );
  }

  const payTheme = PAY_THEME[order.payment_status || "pending"] || PAY_THEME.pending;
  const delStatus = order.delivery_status || "placed";
  const delTheme = D_THEME[delStatus] || D_THEME.placed;
  const isCancelled = order.status === "cancelled";
  const assignedBaker = bakers.find(b => b.id === order.baker_id);
  const stepIdx = getStepIndex(order.delivery_status);
  const suggestedBaker = customer?.pincode ? bakers.find(b => b.is_active && b.pincodes?.includes(customer.pincode!)) || null : null;
  const sortedBakers = [...bakers.filter(b => b.is_active)].sort((a, b) => {
    const aMatch = customer?.pincode && a.pincodes?.includes(customer.pincode) ? 0 : 1;
    const bMatch = customer?.pincode && b.pincodes?.includes(customer.pincode) ? 0 : 1;
    return aMatch - bMatch;
  });

  return (
    <div className="min-h-screen bg-brand-oat text-brand-brown font-sans flex flex-col md:flex-row antialiased">
      <OmsSidebar {...chromeProps} />

      <main className="md:ml-72 flex-1 w-auto min-w-0 py-8 px-6 sm:px-10 xl:px-12 relative flex flex-col gap-6">

        {/* Top Header / Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/oms" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-brown/60 hover:text-brand-orange bg-white px-4 py-2.5 rounded-full border border-brand-brown/10 shadow-sm transition-all hover:shadow">
            <ChevronLeft className="w-4 h-4" /> Back to Orders
          </Link>

          <div className="flex items-center gap-2">
            {!isCancelled && order.delivery_status !== "delivered" && (
              <button onClick={() => setConfirmingCancel(true)} className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-black uppercase px-4 py-2.5 rounded-full border border-rose-200 hover:border-rose-600 transition-all cursor-pointer shadow-sm">
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}
            {order.payment_status === "pending" && !isCancelled && (
              <button onClick={markAsPaid} disabled={markingPaid} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20">
                {markingPaid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Mark Paid
              </button>
            )}
          </div>
        </div>

        {/* Primary Banner Card */}
        <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-brown/10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs font-black bg-brand-brown/10 px-3 py-1 rounded-full text-brand-brown tracking-wider">
                  {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                </span>
                <span className="text-xs font-bold text-brand-brown/40">{fmtDate(order.created_at)}</span>
                {order.source === "whatsapp" && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-black text-brand-brown tracking-tight mt-2">
                Flat {order.flat_number} <span className="font-sans text-xl sm:text-2xl font-bold text-brand-brown/50">({order.customer_name})</span>
              </h1>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-black tracking-widest uppercase px-4 py-2 rounded-full border shadow-sm ${payTheme.bg} ${payTheme.text} ${payTheme.border}`}>
                Payment: {order.payment_status || "pending"}
              </span>
              {isCancelled ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase px-4 py-2 rounded-full border bg-rose-50 text-rose-700 border-rose-200 shadow-sm">
                  <XCircle className="w-4 h-4" /> Cancelled
                </span>
              ) : (
                <span className={`inline-flex items-center gap-2 text-xs font-black uppercase px-4 py-2 rounded-full border shadow-sm ${delTheme.bg} ${delTheme.text} ${delTheme.border}`}>
                  <span className={`w-2 h-2 rounded-full ${delTheme.pulse} ${delStatus !== "delivered" ? "animate-ping" : ""}`} />
                  Delivery: {D_LABELS[delStatus]}
                </span>
              )}
            </div>
          </div>

          {/* Fulfillment Stepper */}
          {!isCancelled && order.payment_status === "paid" && (
            <div className="pt-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/40 block mb-4">
                Fulfillment Timeline
              </span>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {STEPS.map((step, idx, arr) => {
                  const done = stepIdx >= idx;
                  const active = order.delivery_status === step.key;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${active ? "bg-brand-orange border-brand-orange text-white ring-4 ring-brand-orange/20 scale-110 shadow-md" : done ? "bg-brand-brown border-brand-brown text-white" : "bg-white border-brand-brown/20 text-brand-brown/30"}`}>
                          {done && !active ? "✓" : idx + 1}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider ${active ? "text-brand-orange" : done ? "text-brand-brown" : "text-brand-brown/30"}`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`flex-grow h-1 min-w-8 rounded-full ${stepIdx > idx ? "bg-brand-brown" : "bg-brand-brown/10"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (Items & Notes - Spans 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Order Items Card */}
            <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-brown/40">Order Items & Summary</span>
                <span className="text-xs font-bold text-brand-brown/50">{order.order_items?.length || 0} item(s)</span>
              </div>

              <div className="flex flex-col divide-y divide-brand-brown/5">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-3.5">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-brand-oat flex items-center justify-center font-serif text-sm font-black text-brand-brown border border-brand-brown/10">
                        {item.quantity}×
                      </span>
                      <div>
                        <p className="text-sm font-bold text-brand-brown">{item.product_name}</p>
                        <p className="text-xs text-brand-brown/40">{fmt(item.unit_price_paise)} each</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-brand-brown">{fmt(item.quantity * item.unit_price_paise)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-brand-brown/10 flex flex-col gap-2 bg-brand-oat/30 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
                <div className="flex justify-between items-center text-xs font-bold text-brand-brown/50">
                  <span>Shipping</span>
                  <span>{order.shipping_fee_paise ? fmt(order.shipping_fee_paise) : "FREE"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-black uppercase tracking-wider text-brand-brown">Grand Total</span>
                  <span className="text-2xl font-serif font-black text-brand-orange">{fmt(order.total_paise)}</span>
                </div>
              </div>
            </div>

            {/* Notes Container Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Customer note */}
              {order.notes && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-700 block mb-2">Customer Note</span>
                    <p className="text-sm font-medium text-brand-brown italic leading-relaxed">&ldquo;{order.notes}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <div className={`bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 flex flex-col gap-3 ${!order.notes ? "sm:col-span-2" : ""}`}>
                <label className="text-xs font-black uppercase tracking-widest text-brand-brown/40 flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-brand-orange" /> Internal Admin Notes
                </label>
                <div className="flex gap-2">
                  <textarea rows={2} value={noteVal} onChange={e => setNoteVal(e.target.value)} placeholder="Internal note (not visible to customer)…" className="flex-1 bg-brand-oat/20 border border-brand-brown/15 rounded-2xl p-3 text-xs font-bold text-brand-brown placeholder:text-brand-brown/30 outline-none focus:border-brand-orange transition-colors resize-none" />
                  <button onClick={saveAdminNote} disabled={savingNote || noteVal === (order.admin_notes || "")} className="px-4 rounded-2xl bg-brand-brown text-white hover:bg-brand-orange text-xs font-black uppercase transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shadow-sm">
                    {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Customer, Baker & Dispatch Controls) */}
          <div className="flex flex-col gap-6">

            {/* Customer & Address Details */}
            <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-brown/40 border-b border-brand-brown/10 pb-3">
                Customer Info
              </span>

              <div className="flex flex-col gap-2">
                <p className="text-base font-bold text-brand-brown">{order.customer_name}</p>
                <p className="text-xs text-brand-brown/60">Flat / House: <strong className="text-brand-brown font-black">{order.flat_number}</strong></p>
                {customer?.address && <p className="text-xs text-brand-brown/60 leading-relaxed">Address: {customer.address}</p>}
                {customer?.pincode && <p className="text-xs font-mono font-bold text-brand-brown/50">Pincode: {customer.pincode}</p>}
              </div>

              {customer?.phone && (
                <div className="flex gap-2 pt-2">
                  <a href={`tel:${customer.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-oat hover:bg-brand-brown hover:text-white border border-brand-brown/10 rounded-2xl py-2.5 text-xs font-black uppercase transition-all text-brand-brown">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/91${customer.phone.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(order.customer_name)}%2C%20your%20WWY%20order%20${encodeURIComponent(order.order_number || "")}%3A%20`} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-2xl py-2.5 text-xs font-black uppercase transition-all">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Baker & Date Operations */}
            <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 flex flex-col gap-5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-brown/40 border-b border-brand-brown/10 pb-3">
                Baker & Delivery Schedule
              </span>

              {/* Baker select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-brown/60">Assigned Baker</label>
                <div className="relative">
                  <select value={order.baker_id || ""} onChange={e => assignBaker(e.target.value || null)} disabled={assigningBaker} className="w-full appearance-none text-xs font-bold text-brand-brown bg-brand-oat/30 border border-brand-brown/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange cursor-pointer shadow-sm disabled:opacity-50 pr-8">
                    <option value="">Unassigned</option>
                    {sortedBakers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}{customer?.pincode && b.pincodes?.includes(customer.pincode) ? " ✓ covers pincode" : ""}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/40 pointer-events-none" />
                </div>
                {assignedBaker && (
                  <a href={`tel:${assignedBaker.phone}`} className="inline-flex items-center gap-1.5 text-xs text-brand-orange font-bold hover:underline mt-1">
                    <Phone className="w-3.5 h-3.5 text-brand-orange" /> {assignedBaker.name} ({assignedBaker.phone})
                  </a>
                )}
                {!order.baker_id && suggestedBaker && (
                  <button onClick={() => assignBaker(suggestedBaker.id)} className="text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 underline decoration-dotted cursor-pointer text-left mt-1">
                    Suggested: {suggestedBaker.name}
                  </button>
                )}
              </div>

              {/* Delivery date picker */}
              <div className="flex flex-col gap-2 pt-2 border-t border-brand-brown/5">
                <label className="text-xs font-bold text-brand-brown/60">Scheduled Delivery Date</label>
                {editingDate ? (
                  <div className="flex flex-col gap-2">
                    <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} className={inputCls} />
                    <div className="flex gap-2">
                      <button onClick={saveDeliveryDate} disabled={savingDate || !dateInput} className="flex-1 py-2.5 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">
                        {savingDate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                      </button>
                      <button onClick={() => { setEditingDate(false); setDateInput(order.delivery_date || ""); }} className="px-4 py-2.5 rounded-xl border border-brand-brown/15 text-brand-brown/60 text-xs font-black uppercase cursor-pointer">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-brand-oat/30 p-3 rounded-2xl border border-brand-brown/10">
                    <span className="text-sm font-bold text-brand-brown">{order.delivery_date || "Not set"}</span>
                    {!isCancelled && (
                      <button onClick={() => setEditingDate(true)} className="inline-flex items-center gap-1 bg-white hover:bg-brand-orange hover:text-white text-brand-brown text-xs font-black uppercase px-3 py-1.5 rounded-xl border border-brand-brown/15 transition-all cursor-pointer shadow-sm">
                        <CalendarDays className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Invoices & External Logistics Links */}
            <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-6 flex flex-col gap-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-brown/40 border-b border-brand-brown/10 pb-3">
                Documents & Delivery Links
              </span>
              <div className="flex flex-col gap-2">
                {order.payment_status === "paid" && (
                  <button onClick={resendInvoice} disabled={resendingInvoice} className="w-full inline-flex items-center justify-center gap-2 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-xs font-black uppercase py-3 rounded-2xl transition-all cursor-pointer disabled:opacity-50">
                    {resendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Resend Invoice (WhatsApp)</>}
                  </button>
                )}
                {order.invoice_url && (
                  <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-brand-oat hover:bg-brand-brown hover:text-white border border-brand-brown/10 text-brand-brown text-xs font-black uppercase py-3 rounded-2xl transition-all">
                    <FileText className="w-4 h-4" /> View Invoice PDF
                  </a>
                )}
                {order.borzo_tracking_url && (
                  <a href={order.borzo_tracking_url} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 text-xs font-black uppercase py-3 rounded-2xl transition-all">
                    <Activity className="w-4 h-4" /> Borzo Live Tracking
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Cancel Confirm Modal */}
      {confirmingCancel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmingCancel(false)}>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-black text-rose-700">Cancel Order?</h2>
            <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-4">
              <p className="text-sm font-black text-rose-800">{order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}</p>
              <p className="text-xs font-bold text-rose-700/70 mt-1">{order.customer_name} · Flat {order.flat_number} · {fmt(order.total_paise)}</p>
              {order.payment_status === "paid" && <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-100 rounded-xl px-3 py-2">⚠ Order is paid — arrange a manual refund if needed.</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingCancel(false)} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5 cursor-pointer">Keep</button>
              <button onClick={cancelOrder} disabled={cancelling} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
