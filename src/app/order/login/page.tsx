"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import AnnouncementBar from "@/components/AnnouncementBar";

export default function OrderLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "register" | "update">("email");
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [flat, setFlat] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeLookup, setPincodeLookup] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [pincodeLocation, setPincodeLocation] = useState("");
  const [pincodeServiceable, setPincodeServiceable] = useState<"idle" | "checking" | "ok" | "blocked">("idle");
  const lastAutoFill = useRef("");
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

  useEffect(() => {
    if (pincode.length !== 6) {
      setPincodeLookup("idle");
      setPincodeLocation("");
      setPincodeServiceable("idle");
      return;
    }
    let cancelled = false;
    setPincodeLookup("loading");
    setPincodeServiceable("idle");
    fetch(`/api/pincode/lookup?code=${pincode}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (cancelled) return;
        if (!d.valid) {
          setPincodeLookup("notfound");
          setPincodeLocation("");
          setPincodeServiceable("blocked");
          return;
        }
        const location = [d.area, d.district, d.state].filter(Boolean).join(", ");
        setPincodeLookup("found");
        setPincodeLocation(location);
        setAddress((prev) => {
          let base = prev;
          if (lastAutoFill.current && base.endsWith(lastAutoFill.current)) {
            base = base.slice(0, -lastAutoFill.current.length).replace(/,\s*$/, "");
          }
          lastAutoFill.current = location;
          return base ? `${base}, ${location}` : location;
        });
        // Check serviceability against active bakers
        setPincodeServiceable("checking");
        const { data: bakers } = await supabase
          .from("bakers")
          .select("pincodes")
          .eq("is_active", true);
        if (cancelled) return;
        const serviceable = (bakers || []).flatMap((b: { pincodes?: string[] }) => b.pincodes || []);
        setPincodeServiceable(serviceable.length > 0 && !serviceable.includes(pincode) ? "blocked" : "ok");
      })
      .catch(() => { if (!cancelled) { setPincodeLookup("notfound"); setPincodeServiceable("blocked"); } });
    return () => { cancelled = true; };
  }, [pincode]);

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
      // If phone is missing, ask for it before proceeding
      if (!customer.phone) {
        setExistingCustomerId(customer.id);
        setStep("update");
      } else {
        router.push("/order");
      }
    } else {
      setStep("register");
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!flat.trim()) { setError("Enter your flat number."); return; }
    if (!phone.trim() || phone.replace(/\D/g,"").length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    if (!pincode.trim() || pincode.trim().length !== 6) { setError("Enter your 6-digit pincode."); return; }

    // Validate pincode against serviceable bakers
    setError(""); setLoading(true);
    const { data: bakers } = await supabase
      .from("bakers")
      .select("pincodes")
      .eq("is_active", true);
    const serviceable = (bakers || []).flatMap((b) => b.pincodes || []);
    if (serviceable.length > 0 && !serviceable.includes(pincode.trim())) {
      setError("Sorry, we don't deliver to this pincode yet. We're expanding soon!");
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        flat_number: flat.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g,"").slice(-10),
        pincode: pincode.trim(),
        address: address.trim() || null,
      })
      .select()
      .single();

    setLoading(false);
    if (err || !data) {
      if (err?.code === "23505") {
        setError("That email is already registered. Try logging in with it instead.");
      } else {
        setError(err?.message || "Something went wrong. Try again.");
      }
      return;
    }
    localStorage.setItem("wwy_flat", data.flat_number);
    localStorage.setItem("wwy_name", data.name);
    localStorage.setItem("wwy_customer_id", data.id);
    if (data.pincode) localStorage.setItem("wwy_pincode", data.pincode);
    router.push("/order");
  };

  const updatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g,"").length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    setError(""); setLoading(true);
    await supabase
      .from("customers")
      .update({ phone: phone.replace(/\D/g,"").slice(-10) })
      .eq("id", existingCustomerId);
    setLoading(false);
    router.push("/order");
  };

  const inputCls = "w-full bg-white border-2 border-brand-charcoal/10 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 rounded-2xl px-5 py-4 font-black text-brand-charcoal text-xl placeholder:text-brand-charcoal/25 outline-none transition-all duration-300 shadow-sm focus:shadow-md";
  const btnCls = "w-full bg-brand-charcoal text-white hover:bg-brand-orange disabled:opacity-50 disabled:pointer-events-none rounded-2xl py-5 font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] min-h-[56px] flex items-center justify-center";

  if (vacationMode) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-5">
        <AnnouncementBar />
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
      <AnnouncementBar />
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <Image src="/WWY-LOGO_White.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />

        <div className="text-center">
          <h1 className="font-black text-brand-charcoal tracking-tighter leading-none mb-2"
            style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}>
            {step === "email" && "ORDER\nONLINE."}
            {step === "otp" && "CHECK\nYOUR EMAIL."}
            {step === "register" && "FIRST TIME?\nGOOD TASTE."}
            {step === "update" && "ONE LAST\nTHING."}
          </h1>
          <p className="text-sm font-bold text-brand-charcoal/40">
            {step === "email" && "Enter your email — we'll send a one-time code. No password."}
            {step === "otp" && `An 8-digit code was sent to ${email}. Check your inbox (and spam).`}
            {step === "register" && "Just a few details and you're in."}
            {step === "update" && "Add your phone number so your baker can reach you."}
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
            <div className="flex items-start gap-2 bg-brand-gold/15 border border-brand-gold/30 rounded-xl px-3 py-2.5">
              <span className="text-sm leading-none">📩</span>
              <p className="text-[11px] font-bold text-brand-charcoal/70 leading-snug">
                Don&apos;t see it in your inbox? Check your <span className="font-black">spam / junk</span> folder — the code can land there.
              </p>
            </div>
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
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Delivery Address</label>
              <textarea
                rows={2}
                placeholder="e.g. Flat 4B, Tower C, Sunshine Apartments, Linking Road, Bandra West, Mumbai"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(""); }}
                className={inputCls + " resize-none leading-snug text-base"}
              />
              <p className="text-[11px] font-bold text-brand-charcoal/30">Full address so the courier can find you.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                className={inputCls}
              />
              <p className="text-[11px] font-bold text-brand-charcoal/30">So your baker can reach you if needed.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Pincode</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="400001"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value.replace(/\D/g,"")); setError(""); setPincodeServiceable("idle"); }}
                className={`${inputCls} ${
                  pincodeServiceable === "ok" ? "border-emerald-400 focus:border-emerald-500" :
                  pincodeServiceable === "blocked" ? "border-brand-terracotta focus:border-brand-terracotta" : ""
                }`}
              />
              {pincodeLookup === "loading" && (
                <p className="text-[11px] font-bold text-brand-charcoal/30 animate-pulse">Looking up area…</p>
              )}
              {pincodeServiceable === "checking" && (
                <p className="text-[11px] font-bold text-brand-charcoal/30 animate-pulse">Checking delivery availability…</p>
              )}
              {pincodeServiceable === "ok" && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <span className="text-emerald-600 text-base leading-none">✓</span>
                  <div>
                    <p className="text-[11px] font-black text-emerald-700">{pincodeLocation}</p>
                    <p className="text-[10px] font-bold text-emerald-600">We deliver to your area!</p>
                  </div>
                </div>
              )}
              {pincodeServiceable === "blocked" && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  <span className="text-rose-500 text-base leading-none">✗</span>
                  <p className="text-[11px] font-black text-rose-600">Sorry, we don&apos;t deliver to this pincode yet. We&apos;re expanding soon!</p>
                </div>
              )}
              {pincodeServiceable === "idle" && pincodeLookup === "idle" && (
                <p className="text-[11px] font-bold text-brand-charcoal/30">Enter your 6-digit pincode to check delivery availability.</p>
              )}
            </div>
            {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            <button
              type="submit"
              disabled={loading || pincodeServiceable !== "ok"}
              className={btnCls}
            >
              {loading ? "Saving…" :
               pincodeServiceable === "idle" || pincodeServiceable === "checking" ? "Enter a valid pincode to continue" :
               pincodeServiceable === "blocked" ? "Delivery not available in your area" :
               "Start ordering →"}
            </button>
          </form>
        )}

        {/* ── Step 4: Add phone (existing user, no phone on file) ── */}
        {step === "update" && (
          <form onSubmit={updatePhone} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                placeholder="9876543210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                className={inputCls}
              />
              <p className="text-[11px] font-bold text-brand-charcoal/30">So your baker can reach you if needed.</p>
            </div>
            {error && <p className="text-xs font-bold text-brand-terracotta">{error}</p>}
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Saving..." : "Continue →"}
            </button>
            <button type="button" onClick={() => router.push("/order")}
              className="text-xs font-bold text-brand-charcoal/30 hover:text-brand-terracotta transition-colors text-center">
              Skip for now
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
