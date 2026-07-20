"use client";

import { useState, useEffect } from "react";

const ANNOUNCEMENT =
  "Bake days: Wed & Sat · Orders close Mon & Thu, 9 PM · Baked fresh to order — no inventory · Free shipping over ₹499";

export default function AnnouncementBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-brand-terracotta text-white px-4 sm:px-6 py-1.5 rounded-b-[1rem] shadow-lg transition-all duration-500 origin-top w-[95%] sm:w-auto max-w-[90vw] text-center ${
        scrolled ? "scale-y-0 opacity-0 pointer-events-none" : "scale-y-100 opacity-100"
      }`}
    >
      <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-black tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] uppercase leading-snug">
        {ANNOUNCEMENT}
      </p>
    </div>
  );
}
