"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, Order, Product, Customer } from "@/lib/supabase";

type Tab = "orders" | "products" | "customers";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  delivered: "Delivered",
};

const STATUS_NEXT: Record<string, string> = {
  pending: "confirmed",
  confirmed: "delivered",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-brand-gold/20 text-amber-700",
  confirmed: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-500",
};

export default function OmsDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes, customersRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("category"),
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
    ]);
    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setCustomers(customersRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_NEXT[currentStatus];
    if (!nextStatus) return;
    setUpdatingId(orderId);
    await supabase.from("orders").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus as Order["status"] } : o));
    setUpdatingId(null);
  };

  const toggleAvailability = async (productId: string, current: boolean) => {
    await supabase.from("products").update({ available: !current }).eq("id", productId);
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, available: !current } : p));
  };

  const logout = async () => {
    await fetch("/api/oms/auth", { method: "DELETE" });
    router.push("/oms/login");
  };

  // Metrics
  const pending = orders.filter((o) => o.status === "pending").length;
  const confirmed = orders.filter((o) => o.status === "confirmed").length;
  const todayRevenue = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString() && o.status !== "pending";
    })
    .reduce((s, o) => s + o.total_paise, 0);

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-brand-charcoal text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-black text-base tracking-tight">WWY Order Desk</h1>
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="text-[11px] font-black tracking-wider uppercase text-white/40 hover:text-white transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="text-[11px] font-black tracking-wider uppercase text-white/40 hover:text-brand-terracotta transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Metrics strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", value: pending, color: "text-amber-600" },
            { label: "Confirmed", value: confirmed, color: "text-green-700" },
            { label: "Today's Revenue", value: fmt(todayRevenue), color: "text-brand-charcoal" },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-[10px] font-black tracking-widest uppercase text-gray-400">{m.label}</p>
              <p className={`font-black text-xl mt-0.5 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl p-1 border border-gray-100 w-fit">
          {(["orders", "products", "customers"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 ${
                tab === t ? "bg-brand-charcoal text-white" : "text-gray-400 hover:text-brand-charcoal"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-xs font-black tracking-widest uppercase text-gray-300 animate-pulse py-8 text-center">
            Loading...
          </p>
        )}

        {/* ORDERS TAB */}
        {!loading && tab === "orders" && (
          <>
            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["all", "pending", "confirmed", "delivered"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase transition-all ${
                    statusFilter === s
                      ? "bg-brand-charcoal text-white"
                      : "bg-white text-gray-400 border border-gray-200 hover:text-brand-charcoal"
                  }`}
                >
                  {s === "all" ? `All (${orders.length})` : `${STATUS_LABELS[s]} (${orders.filter((o) => o.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {filteredOrders.length === 0 && (
                <p className="text-sm font-bold text-gray-300 text-center py-8">No orders.</p>
              )}
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-brand-charcoal text-sm">
                            Flat {order.flat_number}
                          </span>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs font-bold text-gray-400">{order.customer_name}</span>
                          <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          {fmtDate(order.created_at)} · #{order.id.slice(0, 8).toUpperCase()} · {fmt(order.total_paise)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {STATUS_NEXT[order.status] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); advanceStatus(order.id, order.status); }}
                            disabled={updatingId === order.id}
                            className="bg-brand-charcoal hover:bg-brand-terracotta disabled:opacity-50 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-xl transition-all active:scale-95"
                          >
                            {updatingId === order.id ? "..." : `→ ${STATUS_LABELS[STATUS_NEXT[order.status]]}`}
                          </button>
                        )}
                        <span className={`text-gray-300 text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-50 px-4 py-3">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600 font-medium">
                              {item.quantity}× {item.product_name}
                            </span>
                            <span className="text-sm font-black text-brand-charcoal">
                              {fmt(item.quantity * item.unit_price_paise)}
                            </span>
                          </div>
                        ))}
                        {order.notes && (
                          <p className="text-xs font-medium text-gray-400 italic border-t border-gray-50 pt-2 mt-2">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PRODUCTS TAB */}
        {!loading && tab === "products" && (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-brand-charcoal text-sm">{product.name}</p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.category}</span>
                  </div>
                  <p className="text-xs font-black text-brand-charcoal/50">{fmt(product.price_paise)}</p>
                </div>
                <button
                  onClick={() => toggleAvailability(product.id, product.available)}
                  className={`text-[11px] font-black tracking-wider uppercase px-3 py-1.5 rounded-xl transition-all ${
                    product.available
                      ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                      : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700"
                  }`}
                >
                  {product.available ? "Available" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {!loading && tab === "customers" && (
          <div className="flex flex-col gap-2">
            {customers.length === 0 && (
              <p className="text-sm font-bold text-gray-300 text-center py-8">No customers yet.</p>
            )}
            {customers.map((customer) => {
              const orderCount = orders.filter((o) => o.customer_id === customer.id).length;
              const totalSpend = orders
                .filter((o) => o.customer_id === customer.id && o.status !== "pending")
                .reduce((s, o) => s + o.total_paise, 0);
              return (
                <div
                  key={customer.id}
                  className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-charcoal text-sm">{customer.name}</p>
                    <p className="text-xs font-bold text-gray-400">Flat {customer.flat_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-brand-charcoal">{fmt(totalSpend)}</p>
                    <p className="text-[10px] font-bold text-gray-400">{orderCount} order{orderCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
