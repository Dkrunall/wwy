"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OmsLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError("Enter the admin password."); return; }
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 300));

    const res = await fetch("/api/oms/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/oms");
    } else {
      setError("Wrong password.");
    }
  };

  return (
    <main className="min-h-screen bg-brand-charcoal flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <Image src="/logo.png" alt="WWY" width={56} height={56} className="object-contain opacity-60 invert" />

        <div className="text-center">
          <p className="text-[11px] font-black tracking-[0.25em] uppercase text-white/30 mb-2">
            OMS · Admin
          </p>
          <h1 className="font-black text-white leading-none tracking-tighter"
            style={{ fontSize: "clamp(1.8rem, 7vw, 2.5rem)" }}>
            WILD WILD YEAST<br />ORDER DESK
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black tracking-[0.2em] uppercase text-white/30">
              Password
            </label>
            <input
              type="password"
              autoFocus
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="w-full bg-white/10 border-2 border-white/10 focus:border-brand-terracotta rounded-2xl px-5 py-4 font-black text-white text-xl placeholder:text-white/20 outline-none transition-colors"
            />
            {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-terracotta hover:bg-brand-gold disabled:opacity-50 text-white hover:text-brand-charcoal rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]"
          >
            {loading ? "Checking..." : "Enter →"}
          </button>
        </form>

      </div>
    </main>
  );
}
