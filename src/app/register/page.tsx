"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });

  const passwordsMatch = form.password && form.confirm && form.password === form.confirm;
  const passwordStrong = form.password.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth integration goes here
  };

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="min-h-screen flex">

        {/* Left — Brand Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand-charcoal relative overflow-hidden flex-col justify-between p-16">
          <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-brand-gold/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-brand-terracotta/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <Link href="/">
              <Image src="/logo.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />
            </Link>
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <h2
              className="font-black text-brand-oat leading-[0.88] tracking-tighter"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
            >
              ROOTED IN <br />
              <span className="text-brand-gold">PROCESS.</span>
            </h2>
            <p className="text-brand-oat/40 text-sm font-bold tracking-wide max-w-xs leading-relaxed">
              Join a community built around honest ingredients, slow fermentation, and flavour that takes time.
            </p>

            {/* Perks */}
            <div className="flex flex-col gap-3 mt-2">
              {[
                "Early access to small-batch drops",
                "Order history and tracking",
                "Fermentation notes from the culture",
              ].map((perk) => (
                <div key={perk} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-terracotta/20 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-brand-terracotta" />
                  </div>
                  <span className="text-brand-oat/50 text-xs font-bold">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] font-black tracking-[0.3em] uppercase text-brand-oat/20">
            © 2026 Wild Wild Yeast
          </p>
        </div>

        {/* Right — Form Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-16 pt-32 lg:pt-0 pb-16">
          <div className="w-full max-w-md">

            <div className="mb-10">
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-3 block">
                New Account
              </span>
              <h1 className="font-black text-brand-charcoal tracking-tighter leading-none"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
                CREATE <br /> ACCOUNT
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Name row */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Arjun"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white border border-brand-charcoal/10 rounded-full px-5 py-4 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors duration-300 shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white border border-brand-charcoal/10 rounded-full px-5 py-4 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors duration-300 shadow-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-brand-charcoal/10 rounded-full px-6 py-4 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors duration-300 shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-brand-charcoal/10 rounded-full px-6 py-4 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors duration-300 shadow-sm pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-terracotta transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex-1 h-1 rounded-full bg-brand-charcoal/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${passwordStrong ? "bg-brand-olive w-full" : "bg-brand-terracotta w-1/3"}`} />
                    </div>
                    <span className={`text-[10px] font-black tracking-wide ${passwordStrong ? "text-brand-olive" : "text-brand-terracotta"}`}>
                      {passwordStrong ? "Good" : "Too short"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className={`w-full bg-white border rounded-full px-6 py-4 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none transition-colors duration-300 shadow-sm pr-14 ${
                      form.confirm
                        ? passwordsMatch
                          ? "border-brand-olive"
                          : "border-brand-terracotta"
                        : "border-brand-charcoal/10 focus:border-brand-terracotta"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-terracotta transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 w-full bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                Create Account
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-xs font-bold text-brand-charcoal/40">
                Already have an account?{" "}
                <Link href="/login" className="text-brand-terracotta hover:opacity-70 transition-opacity font-black">
                  Sign in
                </Link>
              </p>

            </form>
          </div>
        </div>

      </div>
      <Footer />
    </main>
  );
}
