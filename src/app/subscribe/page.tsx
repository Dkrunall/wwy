"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, RefreshCw, Repeat, Sparkles, Wheat } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CrumbPointsCard from "@/components/CrumbPointsCard";
import { supabase } from "@/lib/supabase";

type Days = "wed" | "sat" | "both";
type Bake = { id: string; date: string; loaves: number; flavour: string | null; status: string; options: string[]; open: boolean; skipsLeft: number };
type State = {
  loafPricePaise: number;
  loavesPerPeriod: number;
  subscription: { days: Days; status: "pending" | "active" | "cancelled"; streakCount: number; streakRewardDue: boolean } | null;
  bakes: Bake[];
  nextPayment: { amountPaise: number; carryUsedPaise: number; due: boolean };
};

const DAY_CHOICES: { value: Days; label: string; detail: string }[] = [
  { value: "wed", label: "Wednesdays", detail: "2 loaves every Wednesday" },
  { value: "sat", label: "Saturdays", detail: "2 loaves every Saturday" },
  { value: "both", label: "Both days", detail: "1 loaf on Wednesday, 1 on Saturday" },
];
const fmt = (paise: number) => `₹${(paise / 100).toFixed(0)}`;
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
const STREAK = 8;

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

async function authHeader(): Promise<Record<string, string> | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" } : null;
}

// Standing Order: sign up, pay monthly, pick flavours and skip bakes.
export default function SubscribePage() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [days, setDays] = useState<Days>("sat");

  const load = useCallback(async () => {
    const headers = await authHeader();
    if (!headers) { router.replace("/order/login?next=/subscribe"); return; }
    const res = await fetch("/api/subscription", { headers });
    const d = await res.json().catch(() => ({}));
    if (res.status === 401) { router.replace("/order/login?next=/subscribe"); return; }
    if (!res.ok) { setError(d.error || "Could not load your Standing Order."); return; }
    setState(d);
    if (d.subscription) setDays(d.subscription.days);
  }, [router]);

  useEffect(() => {
    if (!localStorage.getItem("wwy_flat")) { router.replace("/order/login?next=/subscribe"); return; }
    const t = setTimeout(load, 0);
    if (!document.getElementById("razorpay-sdk")) {
      const s = document.createElement("script");
      s.id = "razorpay-sdk";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
    return () => clearTimeout(t);
  }, [load, router]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    const headers = await authHeader();
    if (!headers) { router.replace("/order/login?next=/subscribe"); return null; }
    setBusy(action + (extra.bakeId ?? ""));
    setError("");
    const res = await fetch("/api/subscription", { method: "POST", headers, body: JSON.stringify({ action, ...extra }) });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(d.error || "Something went wrong. Try again."); return null; }
    return d;
  };

  const pay = async (action: "start" | "pay") => {
    const d = await act(action, action === "start" ? { days } : {});
    if (!d) return;
    setBusy("checkout");
    new window.Razorpay({
      key: d.keyId,
      amount: d.amount,
      currency: "INR",
      order_id: d.razorpayOrderId,
      name: "Wild Wild Yeast",
      description: "Standing Order, 4 weeks",
      image: "/WWY-LOGO_White.png",
      theme: { color: "#2C1A0E" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const ok = await act("verify", { razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature });
        if (ok) await load();
      },
      modal: { ondismiss: () => setBusy(null) },
    }).open();
  };

  const update = async (action: string, extra: Record<string, unknown> = {}) => {
    if (await act(action, extra)) await load();
  };

  const sub = state?.subscription;
  const active = sub && sub.status !== "pending";
  const monthly = state ? state.loavesPerPeriod * state.loafPricePaise : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-oat/40 via-white to-brand-oat/20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-20 flex flex-col gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-widest uppercase text-brand-terracotta mb-1">
            <Repeat className="w-3.5 h-3.5" /> Standing Order
          </span>
          <h1 className="font-serif text-brand-brown font-bold text-3xl sm:text-4xl tracking-tight">
            Fresh flavoured sourdough, <span className="italic font-light text-brand-terracotta">every week.</span>
          </h1>
          <p className="text-sm font-bold text-brand-brown/60 mt-2 leading-relaxed">
            Two flavoured sourdough loaves a week, paid a month at a time. Every bake earns 10% back in Crumb Points, and eight bakes in a row
            without a skip earns two free Baker&apos;s Choice loaves, one sweet and one savoury.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-bold text-rose-700">{error}</div>
        )}

        {!state && !error && <p className="text-xs font-black uppercase tracking-widest text-brand-brown/40 animate-pulse">Loading…</p>}

        {state && !active && (
          <div className="bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-brand-brown/60">When should your loaves come?</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DAY_CHOICES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setDays(c.value)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      days === c.value ? "bg-brand-terracotta/10 border-brand-terracotta ring-2 ring-brand-terracotta/20" : "border-brand-brown/10 hover:bg-brand-oat/30"
                    }`}
                  >
                    <p className="text-sm font-black text-brand-brown">{c.label}</p>
                    <p className="text-[11px] font-bold text-brand-brown/55 mt-0.5">{c.detail}</p>
                  </button>
                ))}
              </div>
            </div>
            <ul className="text-xs font-bold text-brand-brown/65 flex flex-col gap-1.5 list-disc pl-4">
              <li>{state.loavesPerPeriod} loaves every 4 weeks for {fmt(monthly)} ({fmt(state.loafPricePaise)} a loaf), delivered free.</li>
              <li>Pick the flavour for each bake, or leave it to the baker.</li>
              <li>Skip up to 2 bakes a month before the order cutoff. Skipped loaves come off your next payment.</li>
              <li>We email a payment link before each month ends. Miss it and we pause, with no penalty.</li>
            </ul>
            <button
              onClick={() => pay("start")}
              disabled={!!busy}
              className="w-full bg-brand-brown hover:bg-brand-terracotta text-white rounded-2xl py-4 font-black text-xs sm:text-sm tracking-widest uppercase shadow-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Start for {fmt(state.nextPayment.amountPaise)} →
            </button>
          </div>
        )}

        {state && active && sub && (
          <>
            <div className="bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-brand-brown/50">Your plan</p>
                  <p className="font-black text-brand-brown text-lg">{DAY_CHOICES.find((c) => c.value === sub.days)?.detail}</p>
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${sub.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
                  {sub.status === "active" ? "Active" : "Stopped, won't renew"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-brown/65 bg-brand-oat/50 p-3 rounded-2xl">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                {sub.streakRewardDue
                  ? "Streak reward earned: 2 Baker's Choice loaves come with your next bake."
                  : `${sub.streakCount} of ${STREAK} bakes in a row towards 2 free Baker's Choice loaves.`}
              </div>

              {state.nextPayment.due && sub.status === "active" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-brand-terracotta/30 bg-brand-terracotta/5 rounded-2xl p-4">
                  <div>
                    <p className="font-black text-brand-brown text-sm">{state.bakes.length ? "Renew for the next 4 weeks" : "Pay to restart your bakes"}</p>
                    <p className="text-[11px] font-bold text-brand-brown/55">
                      {fmt(state.nextPayment.amountPaise)}
                      {state.nextPayment.carryUsedPaise > 0 && ` (${fmt(state.nextPayment.carryUsedPaise)} off for skipped bakes)`}
                    </p>
                  </div>
                  <button
                    onClick={() => pay("pay")}
                    disabled={!!busy}
                    className="px-5 py-3 rounded-2xl bg-brand-brown hover:bg-brand-terracotta text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    Pay {fmt(state.nextPayment.amountPaise)}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-brown/60">
                <CalendarDays className="w-4 h-4 text-brand-terracotta" /> Upcoming bakes
              </span>
              {state.bakes.length === 0 && <p className="text-sm font-bold text-brand-brown/55">No paid bakes coming up.</p>}
              <ul className="flex flex-col divide-y divide-brand-brown/5">
                {state.bakes.map((b) => (
                  <li key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${b.status === "skipped" ? "text-brand-brown/40 line-through" : "text-brand-brown"}`}>{fmtDate(b.date)}</p>
                      <p className="text-[11px] font-bold text-brand-brown/50">
                        {b.loaves} {b.loaves === 1 ? "loaf" : "loaves"}
                        {b.status === "ordered" && " · being baked"}
                        {b.status === "skipped" && " · skipped"}
                      </p>
                    </div>
                    {b.status === "scheduled" && b.open && b.options.length > 0 && (
                      <select
                        value={b.flavour ?? ""}
                        onChange={(e) => update("flavour", { bakeId: b.id, flavour: e.target.value || null })}
                        className="bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-xs font-bold text-brand-brown outline-none focus:border-brand-orange cursor-pointer"
                      >
                        <option value="">Baker&apos;s choice</option>
                        {b.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {b.status !== "ordered" && !b.open && <span className="text-[11px] font-bold text-brand-brown/40">Orders closed</span>}
                    {b.open && b.status === "scheduled" && (
                      <button
                        onClick={() => update("skip", { bakeId: b.id })}
                        disabled={!!busy || b.skipsLeft <= 0}
                        title={b.skipsLeft <= 0 ? "You've used this month's 2 skips" : undefined}
                        className="px-3 py-2 rounded-xl border border-brand-brown/15 text-[11px] font-black uppercase tracking-wider text-brand-brown/60 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    {b.open && b.status === "skipped" && (
                      <button
                        onClick={() => update("unskip", { bakeId: b.id })}
                        disabled={!!busy}
                        className="px-3 py-2 rounded-xl border border-brand-brown/15 text-[11px] font-black uppercase tracking-wider text-brand-brown/60 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-brand-brown/60">Change days</span>
              <p className="text-[11px] font-bold text-brand-brown/50 -mt-2">Applies from your next payment. Bakes already paid for stay as they are.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value as Days)}
                  className="flex-1 bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-brown outline-none focus:border-brand-orange cursor-pointer"
                >
                  {DAY_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}: {c.detail}</option>)}
                </select>
                <button
                  onClick={() => update("days", { days })}
                  disabled={!!busy || days === sub.days}
                  className="px-4 py-2.5 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[11px] font-black uppercase disabled:opacity-40 cursor-pointer"
                >
                  Save
                </button>
              </div>
              <button
                onClick={() => update(sub.status === "active" ? "cancel" : "resume")}
                disabled={!!busy}
                className="self-start text-[11px] font-black uppercase tracking-wider text-brand-brown/50 hover:text-rose-600 cursor-pointer mt-2"
              >
                {sub.status === "active" ? "Stop renewing my Standing Order" : "Resume my Standing Order"}
              </button>
            </div>
          </>
        )}

        <CrumbPointsCard detailed />
        <p className="flex items-center gap-2 text-[11px] font-bold text-brand-brown/45">
          <Wheat className="w-3.5 h-3.5" /> Standing Order credit and free loaves follow our <a href="/terms" className="underline">terms</a>.
        </p>
      </div>
      <Footer />
    </main>
  );
}
