"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function OrderLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "register">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [flat, setFlat] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [vacationMode, setVacationMode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    fetch("/api/oms/vacation")
      .then((r) => r.json())
      .then((d) => setVacationMode(d.vacation_mode === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep("otp");
    setResendTimer(60);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) { setError("Enter the code from your email."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: "email",
    });
    setLoading(false);
    if (err || !data.user) { setError("Invalid or expired code. Try again."); return; }

    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (customer) {
      localStorage.setItem("wwy_flat", customer.flat_number);
      localStorage.setItem("wwy_name", customer.name);
      localStorage.setItem("wwy_customer_id", customer.id);
      if (customer.pincode) localStorage.setItem("wwy_pincode", customer.pincode);
      router.push("/order");
    } else {
      setStep("register");
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!flat.trim()) { setError("Enter your flat number."); return; }
    setError(""); setLoading(true);

    const { data, error: err } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        flat_number: flat.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        pincode: pincode.trim() || null,
      })
      .select()
      .single();

    setLoading(false);
    if (err || !data) { setError(err?.message || "Something went wrong. Try again."); return; }
    localStorage.setItem("wwy_flat", data.flat_number);
    localStorage.setItem("wwy_name", data.name);
    localStorage.setItem("wwy_customer_id", data.id);
    if (data.pincode) localStorage.setItem("wwy_pincode", data.pincode);
    router.push("/order");
  };

  const inputCls = "w-full bg-white border-2 border-brand-charcoal/10 focus:border-brand-terracotta rounded-2xl px-5 py-4 font-black text-brand-charcoal text-xl placeholder:text-brand-charcoal/20 outline-none transition-colors";
  const btnCls = "w-full bg-brand-charcoal text-white hover:bg-brand-terracotta disabled:opacity-50 rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] min-h-[56px]";

  if (vacationMode) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <Image src="/WWY-LOGO_White.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />
          <h1 className="font-black text-brand-charcoal tracking-tighter leading-tight"
            style={{ fontSize: "clamp(1.8rem, 8vw, 2.5rem)" }}>
            WE&apos;RE ON A<br />SHORT BREAK.
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/50 leading-relaxed">
            We&apos;re resting and will be back with fresh batches soon. Check our journal for updates. 🌾
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <Image src="/WWY-LOGO_White.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />

        <div className="text-center">
          <h1 className="font-black text-brand-charcoal tracking-tighter leading-none mb-2"
            style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}>
            {step === "email" && "ORDER\nONLINE."}
            {step === "otp" && "CHECK\nYOUR EMAIL."}
            {step === "register" && "FIRST TIME?\nGOOD TASTE."}
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/40">
            {step === "email" && "Enter your email — we'll send a one-time code. No password."}
            {step === "otp" && `An 8-digit code was sent to ${email}. Check your inbox (and spam).`}
            {step === "register" && "Just a few details and you're in."}
          </p>
        </div>

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <form onSubmit={sendOtp} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                Email Address
              </label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className={inputCls}
              />
              {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            </div>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Sending code..." : "Send code →"}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <form onSubmit={verifyOtp} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                Login Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={8}
                placeholder="12345678"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                className={inputCls + " tracking-[0.4em] text-center"}
              />
              {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            </div>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Verifying..." : "Verify →"}
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="text-xs font-bold text-brand-charcoal/30 hover:text-brand-terracotta transition-colors">
                ← Change email
              </button>
              {resendTimer > 0 ? (
                <span className="text-xs font-bold text-brand-charcoal/30">Resend in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={sendOtp}
                  className="text-xs font-bold text-brand-charcoal/50 hover:text-brand-terracotta transition-colors">
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── Step 3: Register (new user) ── */}
        {step === "register" && (
          <form onSubmit={register} className="w-full flex flex-col gap-4">
            <p className="text-xs font-bold text-brand-charcoal/40 -mt-2">{email}</p>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Your Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Arjun Mehta"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Flat Number</label>
              <input
                type="text"
                placeholder="e.g. 4B or 12A"
                value={flat}
                onChange={(e) => { setFlat(e.target.value); setError(""); }}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                Pincode <span className="text-brand-charcoal/20">(optional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="400001"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value); setError(""); }}
                className={inputCls}
              />
              <p className="text-[11px] font-bold text-brand-charcoal/30">Helps us assign the right baker.</p>
            </div>
            {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Saving..." : "Start ordering →"}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
