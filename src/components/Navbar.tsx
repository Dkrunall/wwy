"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pillBase =
    "bg-white/85 backdrop-blur-2xl border border-white/50 shadow-lg transition-all duration-500";
  const topPos = scrolled ? "top-3" : "top-10 md:top-12";

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-brand-terracotta text-white px-4 sm:px-6 py-1.5 rounded-b-[1rem] shadow-lg transition-all duration-500 origin-top w-[95%] sm:w-auto max-w-[90vw] text-center ${scrolled ? "scale-y-0 opacity-0 pointer-events-none" : "scale-y-100 opacity-100"
          }`}
      >
        <p className="text-[8px] sm:text-[9px] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase leading-snug">
          Complimentary shipping on provisions over ₹500
        </p>
      </div>

      {/* ════════════ THREE-PILL DESKTOP NAVBAR ════════════ */}
      <div
        className={`hidden lg:flex fixed left-0 right-0 z-50 items-center justify-between px-8 xl:px-16 transition-all duration-500 ${topPos}`}
      >
        {/* ── Pill 1: Nav Links ── */}
        <div className={`${pillBase} rounded-full px-8 h-14 flex items-center gap-7`}>
          {[
            { label: "Shop", href: "/shop" },
            { label: "Story", href: "/story" },
            { label: "Journal", href: "/journal" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative group font-black text-[10px] tracking-[0.18em] uppercase text-brand-charcoal/60 hover:text-brand-terracotta transition-colors duration-300"
            >
              {label}
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-terracotta scale-0 group-hover:scale-100 transition-transform duration-300" />
            </Link>
          ))}
        </div>

        {/* ── Pill 2: Logo (circle) ── */}
        <div className={`${pillBase} rounded-full w-24 h-24 lg:w-24 lg:h-24 absolute left-1/2 -translate-x-1/2 flex items-center justify-center p-1 lg:p-1`}>
          <Link href="/" className="flex items-center justify-center w-full h-full hover:scale-105 transition-transform duration-500">
            <Image
              src="/logo.png"
              alt="Wild Wild Yeast"
              width={300}
              height={300}
              className="w-full h-full object-contain drop-shadow-sm"
              priority
            />
          </Link>
        </div>

        {/* ── Pill 3: Account + Cart ── */}
        <div className={`${pillBase} rounded-full pl-6 pr-2 h-14 flex items-center gap-4`}>
          <Link
            href="/login"
            className="font-black text-[10px] tracking-[0.18em] uppercase text-brand-charcoal/60 hover:text-brand-terracotta transition-colors duration-300"
          >
            Account
          </Link>

          <div className="w-px h-3.5 bg-brand-charcoal/15 rounded-full" />

          <button onClick={openCart} className="flex items-center gap-2 bg-brand-charcoal text-white hover:bg-brand-terracotta transition-colors duration-300 px-5 py-2.5 rounded-full font-black text-[10px] tracking-[0.15em] uppercase shadow-md active:scale-95 group">
            Cart
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] group-hover:bg-white text-white group-hover:text-brand-terracotta transition-colors">
              {totalItems}
            </span>
          </button>
        </div>
      </div>

      {/* ════════════ MOBILE NAVBAR ════════════ */}
      <div
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[95%] transition-all duration-500 flex items-center justify-between gap-2 ${topPos}`}
      >
        {/* Logo pill — circle */}
        <div className={`${pillBase} rounded-full w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center p-1 sm:p-1`}>
          <Link href="/" className="flex items-center justify-center w-full h-full hover:scale-105 transition-transform duration-500">
            <Image
              src="/logo.png"
              alt="Wild Wild Yeast"
              width={300}
              height={300}
              className="w-full h-full object-contain drop-shadow-sm"
              priority
            />
          </Link>
        </div>

        {/* Right Actions Container */}
        <div className="flex items-center gap-2">
          {/* Menu pill */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className={`${pillBase} rounded-full px-4 sm:px-5 h-11 sm:h-12 flex items-center justify-center font-black text-[9px] sm:text-[10px] tracking-widest uppercase text-brand-charcoal hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta/40 transition-all duration-300 whitespace-nowrap`}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>

          {/* Cart pill */}
          <button onClick={openCart} className={`${pillBase} rounded-full px-4 sm:px-5 h-11 sm:h-12 flex items-center justify-center gap-1.5 sm:gap-2 font-black text-[9px] sm:text-[10px] tracking-widest uppercase text-brand-charcoal hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta/40 transition-all duration-300 active:scale-95 group whitespace-nowrap`}>
            Cart
            <span className="bg-brand-charcoal/10 text-brand-charcoal px-2 py-0.5 rounded-full text-[9px] group-hover:bg-white/20 group-hover:text-white transition-colors">
              {totalItems}
            </span>
          </button>
        </div>
      </div>

      {/* ════════════ FULLSCREEN MOBILE MENU ════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-brand-oat/98 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] flex flex-col justify-center items-center ${mobileMenuOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className="flex flex-col gap-8 sm:gap-10 font-black uppercase tracking-[0.1em] text-center px-8"
          style={{
            transform: mobileMenuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease 0.1s",
          }}
        >
          {[
            { label: "Shop", href: "/shop" },
            { label: "Our Story", href: "/story" },
            { label: "Journal", href: "/journal" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-4xl sm:text-5xl font-serif text-brand-charcoal hover:text-brand-terracotta transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          <div className="h-[2px] w-12 bg-brand-terracotta/30 mx-auto mt-2" />

          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="text-sm font-bold tracking-[0.2em] text-brand-charcoal/50 hover:text-brand-terracotta"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account / Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
