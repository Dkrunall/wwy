"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  days: "wed" | "sat" | "both";
  status: string;
  streak: number;
  streakRewardDue: boolean;
  customer: { name: string; flat_number: string; phone: string | null } | null;
  paidUntil: string | null;
  nextBake: { bake_date: string; loaves: number } | null;
  skippedUpcoming: number;
};

const DAYS = { wed: "Wed", sat: "Sat", both: "Wed + Sat" };
const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

// OMS settings: who is on a Standing Order and until when it is paid.
export default function OmsSubscriptions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/oms/subscriptions")
      .then((r) => r.json())
      .then((d) => (d.error ? setMsg(d.error) : setRows(d.subscriptions)))
      .catch(() => setMsg("Could not load Standing Orders."));
  }, []);

  const active = rows?.filter((r) => r.status === "active").length ?? 0;

  return (
    <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-brown/60">Standing Orders ({active} active)</p>
      <p className="text-sm font-bold text-brand-brown/70">
        Each bake becomes a paid order automatically once its order cutoff passes, so it shows up in Orders and on the baker dashboard.
      </p>
      {msg && <p className="text-xs font-bold text-rose-600">{msg}</p>}
      {rows && rows.length === 0 && <p className="text-xs font-bold text-brand-brown/40">No Standing Orders yet.</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead className="text-[10px] font-black uppercase tracking-wider text-brand-brown/50">
              <tr><th className="py-2">Customer</th><th>Days</th><th>Status</th><th>Next bake</th><th>Paid until</th><th>Streak</th></tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5 font-bold text-brand-brown/80">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.customer?.name ?? "—"} <span className="text-brand-brown/40">· Flat {r.customer?.flat_number}</span></td>
                  <td>{DAYS[r.days]}</td>
                  <td>{r.status}</td>
                  <td>{r.nextBake ? `${fmtDate(r.nextBake.bake_date)} (${r.nextBake.loaves})` : "—"}{r.skippedUpcoming > 0 && <span className="text-brand-brown/40"> · {r.skippedUpcoming} skipped</span>}</td>
                  <td>{r.paidUntil ? fmtDate(r.paidUntil) : "unpaid"}</td>
                  <td>{r.streakRewardDue ? "Reward due" : `${r.streak}/8`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
