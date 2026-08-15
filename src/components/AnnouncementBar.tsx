"use client";

const ANNOUNCEMENT =
  "Bake days: Wed & Sat · Orders close Mon & Thu, 9 PM · Free shipping over ₹599 · ₹65 shipping below ₹599";

export default function AnnouncementBar() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] bg-brand-terracotta text-white px-4 sm:px-6 py-1.5 rounded-t-[1rem] shadow-lg w-[95%] sm:w-auto max-w-[90vw] text-center">
      <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-black tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] uppercase leading-snug">
        {ANNOUNCEMENT}
      </p>
    </div>
  );
}
