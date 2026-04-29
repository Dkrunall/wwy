"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, Order } from "@/lib/supabase";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending payment", color: "text-brand-gold", bg: "bg-brand-gold/20" },
  confirmed: { label: "Confirmed — fermenting", color: "text-brand-olive", bg: "bg-brand-olive/10" },
  delivered: { label: "Delivered", color: "text-brand-charcoal/50", bg: "bg-brand-charcoal/5" },
};

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [flat, setFlat] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const storedFlat = localStorage.getItem("wwy_flat");
    if (!storedFlat) { router.replace("/order/login"); return; }
    setFlat(storedFlat);

    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("flat_number", storedFlat)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-brand-oat pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-oat/95 backdrop-blur-sm border-b border-brand-charcoal/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/order")}
            className="text-brand-charcoal/40 hover:text-brand-charcoal transition-colors font-black text-xl leading-none"
          >
            ←
          </button>
          <div>
            <h1 className="font-black text-brand-charcoal text-base tracking-tight leading-none">My Orders</h1>
            {flat && (
              <p className="text-[10px] font-bold text-brand-charcoal/30 leading-none mt-0.5">Flat {flat}</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {loading && (
          <p className="font-black text-brand-charcoal/30 tracking-widest text-xs uppercase animate-pulse text-center py-12">
            Loading...
          </p>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-16">
            <p className="font-black text-brand-charcoal/20 text-2xl tracking-tight">No orders yet.</p>
            <button
              onClick={() => router.push("/order")}
              className="bg-brand-charcoal text-white font-black text-xs tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-brand-terracotta transition-colors"
            >
              Start ordering →
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const isExpanded = expandedId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-brand-charcoal/5 overflow-hidden"
              >
                {/* Order header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full px-4 py-4 flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="font-black text-brand-charcoal text-sm leading-none">
                      {fmt(order.total_paise)}
                    </p>
                    <p className="text-[11px] font-bold text-brand-charcoal/30 mt-0.5">
                      {fmtDate(order.created_at)} · #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className={`text-brand-charcoal/30 font-black transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {/* Expanded items */}
                {isExpanded && order.order_items && (
                  <div className="border-t border-brand-charcoal/5 px-4 py-3 flex flex-col gap-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-brand-charcoal/60">
                          {item.quantity}× {item.product_name}
                        </span>
                        <span className="text-sm font-black text-brand-charcoal">
                          {fmt(item.quantity * item.unit_price_paise)}
                        </span>
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-xs font-medium text-brand-charcoal/40 italic border-t border-brand-charcoal/5 pt-2 mt-1">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
