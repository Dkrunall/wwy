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

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  placed:            { label: "Confirmed — fermenting", color: "text-brand-olive",       bg: "bg-brand-olive/10" },
  resting:           { label: "Dough resting 🌙",        color: "text-amber-700",         bg: "bg-amber-50" },
  baking:            { label: "In the oven 🔥",           color: "text-orange-700",        bg: "bg-orange-100" },
  out_for_delivery:  { label: "Out for delivery 🚗",      color: "text-blue-700",          bg: "bg-blue-100" },
  delivered:         { label: "Delivered ✓",              color: "text-brand-charcoal/50", bg: "bg-brand-charcoal/5" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending payment", color: "text-brand-gold", bg: "bg-brand-gold/20" },
};

interface FeedbackState {
  [orderId: string]: "idle" | "submitting" | "done";
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="text-2xl transition-transform active:scale-90"
        >
          <span className={(hovered || value) >= star ? "text-brand-gold" : "text-brand-charcoal/20"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [flat, setFlat] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Feedback state
  const [feedbackStates, setFeedbackStates] = useState<FeedbackState>({});
  const [feedbackRating, setFeedbackRating] = useState<Record<string, number>>({});
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);

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

    // Load which orders already have feedback
    supabase
      .from("feedbacks")
      .select("order_id")
      .eq("flat_number", storedFlat)
      .then(({ data }) => {
        if (data) {
          const done: FeedbackState = {};
          data.forEach((f) => { done[f.order_id] = "done"; });
          setFeedbackStates(done);
        }
      });
  }, [router]);

  const submitFeedback = async (orderId: string) => {
    const rating = feedbackRating[orderId];
    if (!rating) return;
    setFeedbackStates((prev) => ({ ...prev, [orderId]: "submitting" }));

    const res = await fetch("/api/orders/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        flatNumber: flat,
        rating,
        comment: feedbackComment[orderId] || "",
      }),
    });

    if (res.ok || (await res.json()).error === "Feedback already submitted") {
      setFeedbackStates((prev) => ({ ...prev, [orderId]: "done" }));
      setFeedbackOpen(null);
    } else {
      setFeedbackStates((prev) => ({ ...prev, [orderId]: "idle" }));
    }
  };

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
            const isPending = order.payment_status !== "paid";
            const isDelivered = order.delivery_status === "delivered";
            const statusCfg = isPending
              ? PAYMENT_STATUS_CONFIG.pending
              : DELIVERY_STATUS_CONFIG[order.delivery_status ?? "placed"] ?? DELIVERY_STATUS_CONFIG.placed;
            const isExpanded = expandedId === order.id;
            const fbState = feedbackStates[order.id] || "idle";

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
                      <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="font-black text-brand-charcoal text-sm leading-none">
                      {fmt(order.total_paise)}
                    </p>
                    <p className="text-[11px] font-bold text-brand-charcoal/30 mt-0.5">
                      {fmtDate(order.created_at)} · #{(order.order_number || order.id.slice(0, 8)).toUpperCase()}
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
                    {order.invoice_url && (
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black text-brand-charcoal/50 hover:text-brand-terracotta transition-colors mt-1 underline underline-offset-2"
                      >
                        ↓ Download Invoice
                      </a>
                    )}

                    {/* Feedback for delivered orders */}
                    {isDelivered && (
                      <div className="border-t border-brand-charcoal/5 pt-3 mt-1">
                        {fbState === "done" ? (
                          <p className="text-xs font-black text-green-700">✓ Thanks for your feedback!</p>
                        ) : feedbackOpen === order.id ? (
                          <div className="flex flex-col gap-3">
                            <p className="text-[11px] font-black tracking-wider uppercase text-brand-charcoal/40">Rate your order</p>
                            <StarRating
                              value={feedbackRating[order.id] || 0}
                              onChange={(v) => setFeedbackRating((prev) => ({ ...prev, [order.id]: v }))}
                            />
                            <textarea
                              rows={2}
                              placeholder="Tell us what you thought (optional)..."
                              value={feedbackComment[order.id] || ""}
                              onChange={(e) => setFeedbackComment((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-xl px-3 py-2 text-sm font-medium text-brand-charcoal placeholder:text-brand-charcoal/20 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitFeedback(order.id)}
                                disabled={!feedbackRating[order.id] || fbState === "submitting"}
                                className="flex-1 bg-brand-charcoal disabled:opacity-40 text-white font-black text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors hover:bg-brand-terracotta"
                              >
                                {fbState === "submitting" ? "Sending..." : "Submit"}
                              </button>
                              <button
                                onClick={() => setFeedbackOpen(null)}
                                className="px-4 py-2.5 text-xs font-black text-brand-charcoal/40 hover:text-brand-charcoal transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setFeedbackOpen(order.id)}
                            className="text-xs font-black tracking-wider uppercase text-brand-terracotta hover:text-brand-charcoal transition-colors"
                          >
                            ★ Leave feedback →
                          </button>
                        )}
                      </div>
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
