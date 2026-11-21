"use client";

import { useEffect, useState } from "react";

// OMS settings: existing customers whose orders always ship free, matched on the phone in their account.
export default function OmsFreeDeliveryList() {
  const [phones, setPhones] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = () =>
    fetch("/api/oms/free-delivery")
      .then((r) => r.json())
      .then((d) => (d.error ? setMsg(d.error) : setPhones((d.phones || []).map((p: { phone: string }) => p.phone))))
      .catch(() => setMsg("Could not load the list."));

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const add = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/oms/free-delivery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg(d.error || "Could not save."); return; }
    setText("");
    setMsg(`Added ${d.added} ${d.added === 1 ? "number" : "numbers"}${d.skipped ? `, skipped ${d.skipped} that weren't 10-digit numbers` : ""}.`);
    load();
  };

  const remove = async (phone: string) => {
    await fetch(`/api/oms/free-delivery?phone=${phone}`, { method: "DELETE" });
    setPhones((p) => p.filter((x) => x !== phone));
  };

  const shown = phones.filter((p) => p.includes(filter.replace(/\D/g, "")));

  return (
    <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-brown/60">Free delivery list ({phones.length})</p>
      <p className="text-sm font-bold text-brand-brown/70">
        Existing customers on this list never pay the ₹65 delivery charge. It matches the phone number saved in their account. Paste numbers one per line.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={"9876543210\n+91 98765 43211"}
        className="bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-brown outline-none focus:border-brand-orange font-mono"
      />
      <div className="flex gap-2 items-center">
        <button
          onClick={add}
          disabled={saving || !text.trim()}
          className="px-4 py-2.5 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[11px] font-black uppercase disabled:opacity-40 cursor-pointer"
        >
          {saving ? "Adding…" : "Add numbers"}
        </button>
        {msg && <p className="text-xs font-bold text-brand-brown/70">{msg}</p>}
      </div>
      {phones.length > 0 && (
        <>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search the list"
            className="bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-sm font-bold text-brand-brown outline-none focus:border-brand-orange"
          />
          <ul className="max-h-48 overflow-y-auto flex flex-wrap gap-2">
            {shown.map((p) => (
              <li key={p} className="flex items-center gap-1.5 bg-brand-oat/60 border border-brand-brown/10 rounded-full pl-3 pr-1 py-1 font-mono text-xs font-bold text-brand-brown">
                {p}
                <button onClick={() => remove(p)} aria-label={`Remove ${p}`} className="w-5 h-5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-brand-brown/40 cursor-pointer">×</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
