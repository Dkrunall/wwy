"use client";

import React, { useState } from "react";
import { STANDARD_SHIPPING_FEE_PAISE } from "@/lib/shipping";

type State = "idle" | "checking" | "free" | "paid" | "blocked" | "error";

// Early pincode check (P3-4): tells visitors whether we deliver to them before they browse and add to cart.
export default function PincodeCheck({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState<State>("idle");

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setState("error");
      return;
    }
    setState("checking");
    try {
      const res = await fetch(`/api/pincode/serviceable?code=${pincode}`);
      const d = await res.json();
      setState(d.serviceable ? (d.free ? "free" : "paid") : "blocked");
    } catch {
      setState("error");
    }
  };

  const text = tone === "dark" ? "text-brand-oat" : "text-brand-brown";
  const message: Record<State, string> = {
    idle: "",
    checking: "Checking...",
    free: "Good news, we deliver to your pincode, and delivery is free.",
    paid: `Good news, we deliver to your pincode. A ₹${STANDARD_SHIPPING_FEE_PAISE / 100} delivery charge applies.`,
    blocked: "Sorry, we deliver within Mumbai only.",
    error: "Enter a valid 6-digit pincode.",
  };

  return (
    <form onSubmit={check} className="flex flex-col gap-2" aria-label="Check delivery to your pincode">
      <label htmlFor="pincode-check" className={`text-[11px] font-black tracking-[0.18em] uppercase ${text} opacity-50`}>
        Do we deliver to you?
      </label>
      <div className="flex gap-2">
        <input
          id="pincode-check"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setState("idle");
          }}
          placeholder="Pincode"
          className="w-32 bg-white border border-brand-brown/15 rounded-full px-4 py-2.5 text-sm font-black text-brand-brown placeholder:text-brand-brown/30 outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          className="bg-brand-brown text-white hover:bg-brand-orange px-5 py-2.5 rounded-full text-[11px] font-black tracking-[0.15em] uppercase transition-colors active:scale-95"
        >
          Check
        </button>
      </div>
      <p role="status" className={`text-xs font-bold min-h-4 ${state === "blocked" || state === "error" ? "text-rose-600" : state === "free" || state === "paid" ? "text-emerald-600" : text}`}>
        {message[state]}
      </p>
    </form>
  );
}
