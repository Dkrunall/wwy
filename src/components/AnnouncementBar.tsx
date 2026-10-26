"use client";

import { useEffect, useState } from "react";
import { getNextWindow } from "@/lib/dateUtils";
import {
  DEFAULT_CUTOFF_HOUR_IST,
  DEFAULT_DELIVERY_DAYS,
  deliveryDayName,
  deliveryDaysShort,
  formatHour,
  cutoffDayName,
} from "@/lib/schedule";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/lib/shipping";

const SHIPPING = `Free shipping over ₹${FREE_SHIPPING_THRESHOLD_PAISE / 100} · ₹${STANDARD_SHIPPING_FEE_PAISE / 100} shipping below ₹${FREE_SHIPPING_THRESHOLD_PAISE / 100}`;

function countdown(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ${hrs} hrs`;
  if (hrs > 0) return `${hrs} ${hrs === 1 ? "hr" : "hrs"} ${rem} mins`;
  return `${rem} mins`;
}

// Counts down to the active order cutoff, using the same resolver as checkout (P3-5, P2-1).
export default function AnnouncementBar() {
  const [settings, setSettings] = useState({ deliveryDays: DEFAULT_DELIVERY_DAYS, cutoffHour: DEFAULT_CUTOFF_HOUR_IST });
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.deliveryDays) && typeof d.cutoffHour === "number") setSettings(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  let message: string;
  if (now === null) {
    // Server render and first paint: the static rule, so there is no hydration mismatch.
    const days = settings.deliveryDays;
    const closes = [...days].sort((a, b) => a - b).map((d) => cutoffDayName(d).slice(0, 3)).join(" & ");
    message = `Bake days: ${deliveryDaysShort(days)} · Orders close ${closes}, ${formatHour(settings.cutoffHour)}`;
  } else {
    const { date, cutoffAt } = getNextWindow(settings.deliveryDays, settings.cutoffHour, new Date(now));
    message = `${deliveryDayName(date.getUTCDay())} window closes in ${countdown(cutoffAt.getTime() - now)}`;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] bg-brand-terracotta text-white px-4 sm:px-6 py-1.5 rounded-t-[1rem] shadow-lg w-[95%] sm:w-auto max-w-[90vw] text-center">
      <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-black tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] uppercase leading-snug">
        {message} · {SHIPPING}
      </p>
    </div>
  );
}
