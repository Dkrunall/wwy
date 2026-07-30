"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, User, ShoppingBag, X } from "lucide-react";
import AnnouncementBar from "./AnnouncementBar";
import { WHATSAPP_CONTACT_URL } from "@/lib/contact";

const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Shop", href: "/order" },
  { label: "Our Story", href: "/story" },
  { label: "Contact", href: WHATSAPP_CONTACT_URL, external: true },
];

function getCartCount(): number {
  try {
    const cart = JSON.parse(localStorage.getItem("wwy_cart") || "[]");
    return cart.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
  } catch {
    return 0;
  }
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setLoggedIn(!!localStorage.getItem("wwy_flat"));
      setCartCount(getCartCount());
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [pathname]);

  const runSearch = () => {
    const query = searchValue.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(query ? `/order?q=${encodeURIComponent(query)}` : "/order");
  };

  const profileHref = loggedIn ? "/order/account" : "/order/login";

  const pillBase =
    "bg-white/85 backdrop-blur-2xl border border-white/50 shadow-lg transition-all duration-500";
  const topPos = scrolled ? "top-3" : "top-10 md:top-12";

  return (
    <>
      {/* ── Announcement Bar ── */}
      <AnnouncementBar />

      {/* ════════════ THREE-PILL DESKTOP NAVBAR ════════════ */}
      <div
        className={`hidden lg:flex fixed left-0 right-0 z-50 items-center justify-between px-8 xl:px-16 transition-all duration-500 ${topPos}`}
      >
        {/* ── Pill 1: Nav Links ── */}
        <div className={`${pillBase} rounded-full px-8 h-14 flex items-center gap-7`}>
          {NAV_LINKS.map(({ label, href, external }) => (
            <Link
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
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
              src="/WWY-LOGO_White.png"
              alt="Wild Wild Yeast"
              width={300}
              height={300}
              className="w-full h-full object-contain drop-shadow-sm"
              priority
            />
          </Link>
        </div>

        {/* ── Pill 3: Search / Profile / Cart ── */}
        <div className={`${pillBase} rounded-full ${searchOpen ? "px-3" : "px-2"} h-14 flex items-center gap-1.5 transition-all duration-300`}>
          {searchOpen && (
            <input
              autoFocus
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); if (e.key === "Escape") setSearchOpen(false); }}
              placeholder="Search products…"
              className="w-40 bg-transparent outline-none font-bold text-xs text-brand-charcoal placeholder:text-brand-charcoal/30"
            />
          )}
          <button
            onClick={() => (searchOpen ? runSearch() : setSearchOpen(true))}
            aria-label="Search"
            className="w-10 h-10 rounded-full flex items-center justify-center text-brand-charcoal/60 hover:text-brand-terracotta hover:bg-brand-charcoal/5 transition-colors duration-300"
          >
            {searchOpen ? <X className="w-4 h-4" onClick={(e) => { e.stopPropagation(); setSearchOpen(false); }} /> : <Search className="w-4 h-4" />}
          </button>
          <Link
            href={profileHref}
            aria-label="Profile"
            title={loggedIn ? "My Account" : "Sign in"}
            className="w-10 h-10 rounded-full flex items-center justify-center text-brand-charcoal/60 hover:text-brand-terracotta hover:bg-brand-charcoal/5 transition-colors duration-300"
          >
            <User className="w-4 h-4" />
          </Link>
          <Link
            href="/order/cart"
            aria-label="Cart"
            title="Cart"
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-brand-charcoal/60 hover:text-brand-terracotta hover:bg-brand-charcoal/5 transition-colors duration-300"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-terracotta text-white text-[9px] font-black flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ════════════ MOBILE NAVBAR ════════════ */}
      <div
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[95%] transition-all duration-500 flex items-center justify-between gap-2 ${topPos}`}
      >
        {/* Logo pill — circle */}
        <div className={`${pillBase} rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1`}>
          <Link href="/" className="flex items-center justify-center w-full h-full hover:scale-105 transition-transform duration-500">
            <Image
              src="/WWY-LOGO_White.png"
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

          {/* Search / Profile / Cart icons */}
          <button
            onClick={() => { setMobileMenuOpen(true); setSearchOpen(true); }}
            aria-label="Search"
            className={`${pillBase} rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-brand-charcoal hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta/40 transition-all duration-300 active:scale-95`}
          >
            <Search className="w-4 h-4" />
          </button>
          <Link
            href={profileHref}
            aria-label="Profile"
            className={`${pillBase} rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-brand-charcoal hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta/40 transition-all duration-300 active:scale-95`}
          >
            <User className="w-4 h-4" />
          </Link>
          <Link
            href="/order/cart"
            aria-label="Cart"
            className={`${pillBase} relative rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-brand-charcoal hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta/40 transition-all duration-300 active:scale-95`}
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-terracotta text-white text-[9px] font-black flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
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
          className="flex flex-col gap-8 sm:gap-10 font-black uppercase tracking-[0.1em] text-center px-8 w-full max-w-sm"
          style={{
            transform: mobileMenuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease 0.1s",
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder="Search products…"
              className="w-full bg-white border border-brand-charcoal/10 rounded-full pl-11 pr-4 py-3 text-sm font-bold normal-case tracking-normal text-brand-charcoal placeholder:text-brand-charcoal/30 outline-none focus:border-brand-terracotta transition-colors"
            />
          </div>

          {NAV_LINKS.map(({ label, href, external }) => (
            <Link
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-4xl sm:text-5xl font-serif text-brand-charcoal hover:text-brand-terracotta transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
