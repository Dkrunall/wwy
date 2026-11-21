"use client";

import { useEffect, useState } from "react";
import { Wheat } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CART_TIERS, EXPIRY_BAKE_CYCLES, MAX_CREDIT_SHARE } from "@/lib/crumbPoints";

type Entry = { source: string; amount_paise: number; created_at: string; orders: { order_number: string } | null };

const SOURCE_LABEL: Record<string, string> = {
  cart_tier: "Earned",
  sub: "Standing Order",
  redeem: "Used",
  earn_reversal: "Reversed (refund)",
  redeem_return: "Returned (refund)",
  expiry: "Expired",
  adjustment: "Adjustment",
};

const fmt = (paise: number) => `₹${(Math.abs(paise) / 100).toFixed(0)}`;

// The signed-in customer's Crumb Points balance. `detailed` adds how it works and recent history.
export default function CrumbPointsCard({ detailed = false, className = "" }: { detailed?: boolean; className?: string }) {
  const [data, setData] = useState<{ balancePaise: number; entries: Entry[] } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch("/api/rewards", { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setData(d))
        .catch(() => {});
    });
  }, []);

  if (!data) return null;
  const tiers = [...CART_TIERS].reverse().map((t) => `${t.percent}% back on orders of ₹${t.minPaise / 100}+`).join(", ");

  return (
    <div className={`bg-white rounded-2xl border border-brand-brown/10 shadow-sm p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase text-brand-brown/60">
          <Wheat className="w-4 h-4 text-brand-terracotta" /> Crumb Points
        </span>
        <span className="font-serif font-black text-2xl text-brand-terracotta">{fmt(data.balancePaise)}</span>
      </div>
      <p className="text-xs font-bold text-brand-brown/60 leading-relaxed">
        {data.balancePaise > 0
          ? `Comes off your next order automatically, up to ${MAX_CREDIT_SHARE * 100}% of it.`
          : `Earn ${tiers}. Credit lands once your order is delivered.`}
      </p>
      {detailed && (
        <>
          {data.balancePaise > 0 && (
            <p className="text-[11px] font-bold text-brand-brown/50 leading-relaxed">
              Earn {tiers}. Points expire if you don&apos;t order for {EXPIRY_BAKE_CYCLES} bakes.
            </p>
          )}
          {data.entries.length > 0 && (
            <ul className="flex flex-col divide-y divide-brand-brown/5 border-t border-brand-brown/10 pt-1">
              {data.entries.slice(0, 6).map((e, i) => (
                <li key={i} className="flex justify-between gap-3 py-2 text-xs font-bold">
                  <span className="text-brand-brown/70">
                    {SOURCE_LABEL[e.source] ?? e.source}
                    {e.orders?.order_number && <span className="text-brand-brown/40"> · {e.orders.order_number}</span>}
                  </span>
                  <span className={e.amount_paise >= 0 ? "text-emerald-700" : "text-brand-brown/60"}>
                    {e.amount_paise >= 0 ? "+" : "−"}{fmt(e.amount_paise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
