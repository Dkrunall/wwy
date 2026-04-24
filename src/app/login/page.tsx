"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Payment gateway / auth integration goes here
  };

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="min-h-screen flex">

        {/* Left — Brand Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand-charcoal relative overflow-hidden flex-col justify-between p-16">
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
          {/* Orb */}
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-brand-terracotta/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-brand-gold/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10">
            <Link href="/">
              <Image src="/logo.png" alt="Wild Wild Yeast" width={80} height={80} className="object-contain" />
            </Link>
          </div>

          {/* Quote */}
          <div className="relative z-10">
            <h2
              className="font-black text-brand-oat leading-[0.88] tracking-tighter mb-8"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
            >
              SLOW <br />
              <span className="text-brand-terracotta">FERMENTED.</span>
              <br /> NOTHING <br /> ADDED.
            </h2>
            <p className="text-brand-oat/40 text-sm font-bold tracking-wide max-w-xs leading-relaxed">
              Living food, made slowly. Sign in to manage your orders and provisions.
            </p>
          </div>

          {/* Watermark */}
          <p className="relative z-10 text-[10px] font-black tracking-[0.3em] uppercase text-brand-oat/20">
            © 2026 Wild Wild Yeast
          </p>
        </div>

        {/* Right — Form Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-16 pt-32 lg:pt-0 pb-16">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="mb-10">
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-3 block">
                Welcome Back
              </span>
              <h1 className="font-black text-brand-charcoal tracking-tighter leading-none"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
                SIGN IN
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/50">
                    Password
                  </label>
                  <Link href="#" className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta hover:opacity-70 transition-opacity">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 w-full bg-brand-charcoal text-white hover:bg-brand-terracotta py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                Sign In
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-brand-charcoal/10" />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-charcoal/30">or</span>
                <div className="flex-1 h-px bg-brand-charcoal/10" />
              </div>

              {/* Register link */}
              <p className="text-center text-xs font-bold text-brand-charcoal/40">
                New here?{" "}
                <Link href="/register" className="text-brand-terracotta hover:opacity-70 transition-opacity font-black">
                  Create an account
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
