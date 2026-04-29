"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function OrderLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"flat" | "name">("flat");
  const [flat, setFlat] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flat.trim()) { setError("Enter your flat number."); return; }
    setError(""); setLoading(true);

    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("flat_number", flat.trim().toUpperCase())
      .single();

    setLoading(false);
    if (data) {
      localStorage.setItem("wwy_flat", data.flat_number);
      localStorage.setItem("wwy_name", data.name);
      localStorage.setItem("wwy_customer_id", data.id);
      router.push("/order");
    } else {
      setStep("name");
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Tell us your name."); return; }
    setError(""); setLoading(true);

    const { data, error: err } = await supabase
      .from("customers")
      .insert({ name: name.trim(), flat_number: flat.trim().toUpperCase() })
      .select()
      .single();

    setLoading(false);
    if (err || !data) { setError("Something went wrong. Try again."); return; }
    localStorage.setItem("wwy_flat", data.flat_number);
    localStorage.setItem("wwy_name", data.name);
    localStorage.setItem("wwy_customer_id", data.id);
    router.push("/order");
  };

  return (
    <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <Image src="/logo.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />

        <div className="text-center">
          <h1 className="font-black text-brand-charcoal tracking-tighter leading-none mb-2"
            style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}>
            {step === "flat" ? "WHAT'S YOUR\nFLAT NUMBER?" : "FIRST TIME?\nGOOD TASTE."}
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/40">
            {step === "flat"
              ? "That's all we need. No password, no nonsense."
              : "Just your name — we'll remember you after this."}
          </p>
        </div>

        {step === "flat" ? (
          <form onSubmit={handleFlatSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                Flat Number
              </label>
              <input
                type="text"
                inputMode="text"
                autoFocus
                placeholder="e.g. 4B or 12A"
                value={flat}
                onChange={e => { setFlat(e.target.value); setError(""); }}
                className="w-full bg-white border-2 border-brand-charcoal/10 focus:border-brand-terracotta rounded-2xl px-5 py-4 font-black text-brand-charcoal text-xl placeholder:text-brand-charcoal/20 outline-none transition-colors"
              />
              {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-charcoal text-white hover:bg-brand-terracotta disabled:opacity-50 rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
            >
              {loading ? "Checking..." : "Let's go →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNameSubmit} className="w-full flex flex-col gap-4">
            <p className="text-xs font-bold text-brand-charcoal/40 -mt-2">Flat {flat.toUpperCase()}</p>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                Your Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Arjun Mehta"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                className="w-full bg-white border-2 border-brand-charcoal/10 focus:border-brand-terracotta rounded-2xl px-5 py-4 font-black text-brand-charcoal text-xl placeholder:text-brand-charcoal/20 outline-none transition-colors"
              />
              {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-charcoal text-white hover:bg-brand-terracotta disabled:opacity-50 rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
            >
              {loading ? "Saving..." : "Save & Order →"}
            </button>
            <button type="button" onClick={() => setStep("flat")}
              className="text-xs font-bold text-brand-charcoal/30 hover:text-brand-terracotta transition-colors">
              ← Change flat number
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
