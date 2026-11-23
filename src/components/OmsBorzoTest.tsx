"use client";

import { useState } from "react";

// OMS settings: check the Borzo key without booking anything.
export default function OmsBorzoTest() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const test = async () => {
    setBusy(true);
    setMsg(null);
    const d = await fetch("/api/oms/borzo-test", { method: "POST" }).then((r) => r.json()).catch(() => ({ ok: false, error: "Request failed." }));
    setBusy(false);
    const where = d.live ? "live Borzo" : "Borzo TEST system";
    setMsg(
      d.ok
        ? { ok: true, text: `Connected to ${where}. Quote from ${d.pickup} to Bandra: ₹${d.amount}. Nothing was booked.` }
        : { ok: false, text: `${where}: ${d.error || "failed"}` }
    );
  };

  return (
    <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-brown/60">Borzo connection</p>
      <p className="text-sm font-bold text-brand-brown/70">Asks Borzo for a price quote to check the key. It books nothing and costs nothing.</p>
      <button
        onClick={test}
        disabled={busy}
        className="self-start px-4 py-2.5 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[11px] font-black uppercase disabled:opacity-40 cursor-pointer"
      >
        {busy ? "Checking…" : "Test Borzo connection"}
      </button>
      {msg && <p className={`text-xs font-bold ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
    </div>
  );
}
