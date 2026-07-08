"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function OmsLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError("Enter the admin password."); return; }
    setError("");
    setLoading(true);

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
    <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Background elegant noise/dot overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-brand-orange/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        
        {/* Glassmorphic card */}
        <div className="bg-white border border-brand-brown/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl w-full flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-brand-oat flex items-center justify-center shadow-inner">
            <Image src="/logo.png" alt="WWY" width={42} height={42} className="object-contain" />
          </div>

          <div className="text-center">
            <p className="text-[9px] font-black tracking-[0.25em] uppercase text-brand-orange mb-2">
              OMS Operations Desk
            </p>
            <h1 className="font-serif font-black text-brand-brown text-2xl tracking-tight leading-tight">
              WILD WILD YEAST
            </h1>
            <p className="text-[10px] font-bold text-brand-brown/40 mt-1 uppercase tracking-wider">
              Control Panel Login
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black tracking-widest uppercase text-brand-brown/40">
                Oven Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full bg-brand-brown/5 border-2 border-brand-brown/10 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 rounded-2xl pl-5 pr-12 py-4 font-mono text-brand-brown text-xl placeholder:text-brand-brown/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown/30 hover:text-brand-brown/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-brown hover:bg-brand-orange disabled:opacity-50 text-white hover:text-white rounded-2xl py-4.5 font-black text-[11px] tracking-widest uppercase transition-all duration-300 active:scale-[0.97] min-h-[52px] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-brown/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entering...</span>
                </>
              ) : (
                <span>Access Dashboard →</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-[9px] font-bold text-brand-brown/30 tracking-wider uppercase text-center">
          Authorized bakery crew only · Slow-fermentation ledger v2
        </p>

      </div>
    </main>
  );
}
