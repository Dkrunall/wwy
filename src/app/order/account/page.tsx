"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag, ClipboardList, LogOut, ChevronRight,
  Clock, Package, Flame, Truck, CheckCircle, User, Home,
} from "lucide-react";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STEPS = [
  { label: "Confirmed",  Icon: Clock },
  { label: "Preparing",  Icon: Package },
  { label: "Baking",     Icon: Flame },
  { label: "On the way", Icon: Truck },
  { label: "Delivered",  Icon: CheckCircle },
];

function getCustomerStep(status: string | null): number {
  const s = status || "placed";
  if (s === "placed") return 0;
  if (["mixing","stretching","resting","cold_proof"].includes(s)) return 1;
  if (s === "baking") return 2;
  if (s === "out_for_delivery") return 3;
  if (s === "delivered") return 4;
  return 0;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  delivered:        { label: "Delivered",       cls: "bg-emerald-50 text-emerald-700 border border-emerald-200/60" },
  out_for_delivery: { label: "Out for Delivery", cls: "bg-sky-50 text-sky-700 border border-sky-200/60" },
  baking:           { label: "Baking",           cls: "bg-orange-50 text-orange-700 border border-orange-200/60" },
  cold_proof:       { label: "Preparing",        cls: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  resting:          { label: "Preparing",        cls: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  stretching:       { label: "Preparing",        cls: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  mixing:           { label: "Preparing",        cls: "bg-amber-50 text-amber-700 border border-amber-200/60" },
  placed:           { label: "Confirmed",        cls: "bg-zinc-50 text-zinc-600 border border-zinc-200/60" },
};

type Panel = "orders" | "profile";

export default function AccountPage() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("orders");
  const [customerName, setCustomerName] = useState("");
  const [flat, setFlat] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneEdit, setPhoneEdit] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressEdit, setAddressEdit] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phoneSaveError, setPhoneSaveError] = useState("");
  const [addressSaveError, setAddressSaveError] = useState("");

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
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);

        // Fetch customer record for phone + delivery address
        const { data: customer } = await supabase
          .from("customers")
          .select("phone, address")
          .eq("flat_number", storedFlat)
          .single();
        if (customer?.phone) setPhone(customer.phone);
        if (customer?.address) setDeliveryAddress(customer.address);

        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("flat_number", storedFlat)
          .order("created_at", { ascending: false })
          .limit(10);
        setRecentOrders(data || []);
      } catch { /* no orders */ } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Poll active order status every 30 seconds
  useEffect(() => {
    if (!flat) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("flat_number", flat)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) setRecentOrders(data);
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [flat]);

  const reorder = async (order: Order) => {
    if (!order.order_items?.length) return;
    const productIds = order.order_items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, price_paise")
      .in("id", productIds);
    const priceMap: Record<string, number> = {};
    for (const p of products || []) priceMap[p.id] = p.price_paise;
    const cartItems = order.order_items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price_paise: priceMap[item.product_id] ?? item.unit_price_paise,
    }));
    localStorage.setItem("wwy_cart", JSON.stringify(cartItems));
    router.push("/order");
  };

  const savePhone = async () => {
    const cleaned = phoneEdit.replace(/\D/g, "").slice(-10);
    if (cleaned.length < 10) return;
    setPhoneSaving(true);
    setPhoneSaveError("");
    const { error } = await supabase.from("customers").update({ phone: cleaned }).eq("flat_number", flat);
    if (error) {
      setPhoneSaveError("Couldn't save. Please try again.");
    } else {
      setPhone(cleaned);
      setEditingPhone(false);
    }
    setPhoneSaving(false);
  };

  const saveAddress = async () => {
    const trimmed = addressEdit.trim();
    if (!trimmed) return;
    setAddressSaving(true);
    setAddressSaveError("");
    const { error } = await supabase.from("customers").update({ address: trimmed }).eq("flat_number", flat);
    if (error) {
      setAddressSaveError("Couldn't save. Please try again.");
    } else {
      setDeliveryAddress(trimmed);
      setEditingAddress(false);
    }
    setAddressSaving(false);
  };

  const activeOrder = recentOrders.find((o) => o.payment_status === "paid" && o.delivery_status !== "delivered");
  const currentStep = getCustomerStep(activeOrder?.delivery_status ?? null);
  const totalSpend = recentOrders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_paise, 0);

  const NAV = [
    { key: "orders" as Panel,  Icon: ClipboardList, label: "My Orders" },
    { key: "profile" as Panel, Icon: User,          label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f4f0]">

      {/* ── Top header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/order")}
              className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-gray-400 hover:text-brand-brown transition-colors"
            >
              <Home className="w-4 h-4" /> Shop
            </button>
            <span className="text-gray-200 font-bold">/</span>
            <span className="text-xs font-black tracking-wider uppercase text-brand-brown">My Account</span>
          </div>
          <div className="flex items-center gap-2">
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
                  {customerName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-white text-base leading-tight truncate">{customerName || "—"}</p>
                  <p className="text-white/50 text-[11px] font-bold mt-0.5">Flat {flat}</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              <div className="px-4 py-3 text-center">
                <p className="font-black text-brand-brown text-lg leading-none">{recentOrders.length}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Orders</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="font-black text-brand-brown text-lg leading-none">{fmt(totalSpend)}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Spent</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="p-2">
              {NAV.map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPanel(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all
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

          {/* Quick shop */}
          <button
            onClick={() => router.push("/order")}
            className="bg-brand-brown hover:bg-brand-orange text-white rounded-2xl px-5 py-4 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-brand-orange" style={{ color: "#EBB41F" }} />
              <div className="text-left">
                <p className="font-black text-sm leading-none">Order Now</p>
                <p className="text-white/40 text-[11px] font-bold mt-0.5">Browse this week&apos;s menu</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="bg-white border border-gray-200 hover:border-rose-200 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-2xl px-5 py-3 flex items-center gap-3 transition-all shadow-sm text-xs font-black tracking-widest uppercase"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Sign Out
          </button>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── ORDERS PANEL ── */}
          {panel === "orders" && (
            <>
              {/* Active order tracker */}
              {activeOrder && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Active Order</p>
                      <p className="font-black text-brand-brown text-base mt-0.5">
                        #{(activeOrder.order_number || activeOrder.id.slice(0,8)).toUpperCase()}
                        <span className="font-bold text-gray-400 ml-2 text-sm">· {fmt(activeOrder.total_paise)}</span>
                      </p>
                    </div>
                    {activeOrder.delivery_date && (
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Delivery</p>
                        <p className="font-black text-brand-brown text-sm mt-0.5">
                          {new Date(activeOrder.delivery_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      </div>
                    )}
                  </div>
                  {activeOrder.delivery_status === "out_for_delivery" && activeOrder.borzo_tracking_url && (
                    <div className="px-5 py-3 bg-sky-50 border-b border-sky-100 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-sky-700">Your bread is on its way! 🚗</p>
                      <a
                        href={activeOrder.borzo_tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[10px] font-black tracking-wider uppercase text-sky-700 hover:text-sky-900 underline underline-offset-2"
                      >
                        Track courier →
                      </a>
                    </div>
                  )}
                  <div className="px-5 py-5">
                    <div className="flex items-start">
                      {STEPS.map((step, idx) => {
                        const done = idx <= currentStep;
                        const active = idx === currentStep;
                        const StepIcon = step.Icon;
                        return (
                          <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center gap-1.5 shrink-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                                ${active ? "bg-brand-brown ring-2 ring-brand-brown ring-offset-2 shadow-lg" : done ? "bg-brand-orange" : "bg-gray-100"}`}>
                                <StepIcon className={`w-4 h-4 ${done || active ? "text-white" : "text-gray-300"}`} />
                              </div>
                              <p className={`text-[9px] font-black tracking-wide text-center leading-tight
                                ${active ? "text-brand-brown" : done ? "text-brand-orange" : "text-gray-300"}`}
                                style={{ maxWidth: 48 }}>
                                {step.label}
                              </p>
                            </div>
                            {idx < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mt-[18px] mx-1 ${idx < currentStep ? "bg-brand-orange" : "bg-gray-100"}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders list */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-black text-brand-brown text-sm">Order History</p>
                  <p className="text-[11px] font-bold text-gray-400">{recentOrders.length} orders</p>
                </div>

                {loading && (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {[1,2,3].map((n) => (
                      <div key={n} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                        <div className="flex-1 min-w-0">
                          <div className="h-5 bg-gray-100 rounded-full w-24 mb-2" />
                          <div className="h-3 bg-gray-50 rounded w-20 mb-1" />
                          <div className="h-3 bg-gray-50 rounded w-32" />
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-10 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {!loading && recentOrders.length === 0 && (
                  <div className="px-5 py-10 text-center flex flex-col items-center gap-4">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                    <p className="font-black text-gray-300 text-sm">No orders yet</p>
                    <button
                      onClick={() => router.push("/order")}
                      className="bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-brand-orange transition-colors"
                    >
                      Browse Menu →
                    </button>
                  </div>
                )}

                {!loading && recentOrders.map((order) => {
                  const isPending = order.payment_status !== "paid";
                  const statusKey = isPending ? "placed" : (order.delivery_status || "placed");
                  const badge = STATUS_BADGE[statusKey] || STATUS_BADGE.placed;
                  const isExpanded = expandedId === order.id;

                  return (
                    <div key={order.id} className="border-b border-gray-50 last:border-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-oat flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-brand-brown/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-brand-brown text-sm leading-none">
                              #{(order.order_number || order.id.slice(0,8)).toUpperCase()}
                            </p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {isPending ? "Pending Payment" : badge.label}
                            </span>
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

                      {isExpanded && order.order_items && (
                        <div className="px-5 pb-4 bg-gray-50/50">
                          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-brand-oat text-brand-brown font-black text-xs flex items-center justify-center shrink-0">{item.quantity}</span>
                                  <span className="text-sm font-bold text-gray-600">{item.product_name}</span>
                                </div>
                                <span className="font-black text-brand-brown text-sm">{fmt(item.quantity * item.unit_price_paise)}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-4 py-3 bg-brand-oat/40 border-t border-gray-100">
                              <span className="text-xs font-black uppercase tracking-wider text-gray-500">Total</span>
                              <span className="font-black text-brand-brown">{fmt(order.total_paise)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            {order.invoice_url && (
                              <a
                                href={order.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-brown/50 hover:text-brand-orange transition-colors"
                              >
                                ↓ Invoice
                              </a>
                            )}
                            {order.payment_status === "paid" && order.order_items && order.order_items.length > 0 && (
                              <button
                                onClick={() => reorder(order)}
                                className="ml-auto inline-flex items-center gap-1.5 bg-brand-brown hover:bg-brand-orange text-white text-xs font-black tracking-wider uppercase px-4 py-2 rounded-xl transition-colors"
                              >
                                ↺ Reorder
                              </button>
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

          {/* ── PROFILE PANEL ── */}
          {panel === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-black text-brand-brown text-sm">Profile Details</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  { label: "Full Name", value: customerName || "—" },
                  { label: "Flat Number", value: flat || "—" },
                  { label: "Email Address", value: email || "—" },
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
                        onClick={() => { setPhoneEdit(phone); setEditingPhone(true); }}
                        className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-orange transition-colors"
                      >
                        {phone ? "Edit" : "+ Add"}
                      </button>
                    )}
                  </div>
                  {phoneSaveError && <p className="text-xs font-bold text-red-600">{phoneSaveError}</p>}
                  {editingPhone ? (
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoFocus
                        maxLength={10}
                        placeholder="9876543210"
                        value={phoneEdit}
                        onChange={(e) => setPhoneEdit(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 font-black text-brand-brown text-sm bg-white rounded-xl px-4 py-3 border-2 border-brand-brown/20 focus:border-brand-brown outline-none"
                      />
                      <button
                        onClick={savePhone}
                        disabled={phoneSaving || phoneEdit.replace(/\D/g,"").length < 10}
                        className="bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-4 rounded-xl hover:bg-brand-orange transition-colors disabled:opacity-40"
                      >
                        {phoneSaving ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingPhone(false); setPhoneSaveError(""); }}
                        className="text-gray-400 font-black text-xs px-3 hover:text-gray-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="font-black text-brand-brown text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      {phone ? `+91 ${phone}` : <span className="text-gray-300 font-bold">Not added yet</span>}
                    </p>
                  )}
                </div>

                {/* Delivery address — editable */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Delivery Address</p>
                    {!editingAddress && (
                      <button
                        onClick={() => { setAddressEdit(deliveryAddress); setEditingAddress(true); }}
                        className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-orange transition-colors"
                      >
                        {deliveryAddress ? "Edit" : "+ Add"}
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
                          className="flex-1 bg-brand-brown text-white font-black text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl hover:bg-brand-orange transition-colors disabled:opacity-40"
                        >
                          {addressSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => { setEditingAddress(false); setAddressSaveError(""); }}
                          className="text-gray-400 font-black text-xs px-4 hover:text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      {addressSaveError && <p className="text-xs font-bold text-red-600">{addressSaveError}</p>}
                    </div>
                  ) : (
                    <p className="font-bold text-brand-brown text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 leading-snug">
                      {deliveryAddress || <span className="text-gray-300">Not added yet</span>}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-gray-400">This is where the courier delivers your bread.</p>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-bold text-gray-400">
                    To update other details, contact us at{" "}
                    <span className="text-brand-brown font-black">dnyanesh@wildwildyeast.com</span>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
