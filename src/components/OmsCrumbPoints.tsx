"use client";

import { useEffect, useState } from "react";

type Entry = { source: string; amount_paise: number; note: string | null; created_at: string; orders: { order_number: string } | null };

const fmt = (paise: number) => `₹${(paise / 100).toFixed(0)}`;
const field = "bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-sm font-bold text-brand-brown outline-none focus:border-brand-orange";

// OMS: one customer's Crumb Points, with a manual adjustment.
export default function OmsCrumbPoints({ customerId }: { customerId: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch(`/api/oms/rewards?customerId=${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setMsg(d.error); return; }
        setBalance(d.balancePaise);
        setEntries(d.entries || []);
      })
      .catch(() => setMsg("Could not load Crumb Points."));

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const adjust = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/oms/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, amountPaise: Math.round(Number(amount) * 100), note }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg(d.error || "Could not save."); return; }
    setAmount("");
    setNote("");
    setMsg("Saved.");
    load();
  };

  return (
    <div className="flex flex-col gap-2 border-t border-brand-brown/10 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Crumb Points</span>
        <span className="font-black text-brand-terracotta">{balance === null ? "…" : fmt(balance)}</span>
      </div>
      {entries.length > 0 && (
        <ul className="max-h-28 overflow-y-auto text-[11px] font-bold text-brand-brown/60 divide-y divide-brand-brown/5">
          {entries.map((e, i) => (
            <li key={i} className="flex justify-between gap-2 py-1">
              <span className="truncate">{e.source.replace("_", " ")}{e.orders?.order_number ? ` · ${e.orders.order_number}` : ""}{e.note ? ` · ${e.note}` : ""}</span>
              <span className={e.amount_paise >= 0 ? "text-emerald-700" : ""}>{e.amount_paise >= 0 ? "+" : "−"}{fmt(Math.abs(e.amount_paise))}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input className={`${field} w-24`} inputMode="numeric" placeholder="₹ ±" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))} />
        <input className={`${field} flex-1 min-w-0`} placeholder="Reason" value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          onClick={adjust}
          disabled={saving || !amount || amount === "-" || !note.trim()}
          className="px-3 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[11px] font-black uppercase disabled:opacity-40 cursor-pointer"
        >
          Adjust
        </button>
      </div>
      <p className="text-[10px] font-bold text-brand-brown/40">Use a minus sign to remove credit. {msg && <span className="text-brand-brown/70">{msg}</span>}</p>
    </div>
  );
}
