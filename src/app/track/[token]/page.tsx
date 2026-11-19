"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

type Track = {
  orderNumber: string | null;
  firstName: string;
  status: string | null;
  deliveryDate: string | null;
  partner: string;
  riderName: string | null;
  borzoUrl: string | null;
  rider: { name: string; lat: number; lng: number; updatedAt: string } | null;
};

const STEPS = ["Order confirmed", "Baking", "Out for delivery", "Delivered"];
const stepOf = (status: string | null) =>
  status === "delivered" ? 3 : status === "out_for_delivery" ? 2 : status === "baking" ? 1 : 0;

function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? "just now" : `${Math.round(s / 60)} min ago`;
}

// Map tile around the rider, from OpenStreetMap.
function mapUrl(lat: number, lng: number) {
  const d = 0.008;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
}

// Customer tracking page: order progress and, while our rider is on the way, their live position.
export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Track | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/track/${encodeURIComponent(token)}`, { cache: "no-store" }).catch(() => null);
    if (!r) return;
    if (r.status === 404) {
      setMissing(true);
      return;
    }
    if (r.ok) setData(await r.json());
  }, [token]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  if (missing) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-6 text-center gap-3">
        <h1 className="font-serif text-3xl text-brand-brown">We could not find this order.</h1>
        <Link href="/" className="text-sm font-bold text-brand-orange underline">Go to Wild Wild Yeast</Link>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-brown" />
      </main>
    );
  }

  const step = stepOf(data.status);
  const cancelled = data.status === "cancelled";
  const riderName = data.rider?.name || data.riderName || "Our rider";

  return (
    <main className="min-h-screen bg-brand-oat pb-16">
      <header className="bg-brand-brown text-white px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-full bg-white p-0.5 shrink-0" aria-label="Wild Wild Yeast">
          <Image src="/WWY-LOGO_White.png" alt="" width={72} height={72} className="w-full h-full object-contain" />
        </Link>
        <div>
          <p className="text-xs font-bold text-white/70">Order {data.orderNumber}</p>
          <p className="font-black leading-tight">Hi {data.firstName}, here&apos;s your order</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-6 flex flex-col gap-5">
        {cancelled ? (
          <p className="bg-white rounded-3xl p-5 font-bold text-brand-brown">This order was cancelled.</p>
        ) : (
          <ol className="bg-white rounded-3xl border border-brand-brown/10 p-5 flex flex-col gap-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i <= step ? "bg-emerald-700 text-white" : "bg-brand-oat text-brand-brown/40"}`}>
                  {i < step || step === 3 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-black">{i + 1}</span>}
                </span>
                <span className={`font-bold ${i === step ? "text-brand-brown" : i < step ? "text-brand-brown/70" : "text-brand-brown/45"}`}>{label}</span>
              </li>
            ))}
          </ol>
        )}

        {data.status === "out_for_delivery" && data.partner === "borzo" && data.borzoUrl && (
          <a href={data.borzoUrl} target="_blank" rel="noopener noreferrer" className="h-12 rounded-2xl bg-brand-brown text-white font-black text-sm uppercase flex items-center justify-center">
            Track your courier →
          </a>
        )}

        {data.status === "out_for_delivery" && data.partner !== "borzo" && (
          <section className="bg-white rounded-3xl border border-brand-brown/10 overflow-hidden">
            <div className="p-5">
              <h1 className="font-serif text-2xl text-brand-brown">{riderName} is on the way.</h1>
              <p className="text-sm font-medium text-brand-brown/70 mt-1">
                {data.rider ? `Location updated ${ago(data.rider.updatedAt)}. This page refreshes on its own.` : `${riderName} will share their location as they head out. Check back in a few minutes.`}
              </p>
            </div>
            {data.rider && (
              <>
                <iframe title={`Where ${riderName} is now`} src={mapUrl(data.rider.lat, data.rider.lng)} className="w-full h-72 border-0" loading="lazy" />
                <a
                  href={`https://www.google.com/maps?q=${data.rider.lat},${data.rider.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm font-bold text-brand-orange underline py-3"
                >
                  Open in Google Maps
                </a>
              </>
            )}
          </section>
        )}

        {data.status === "delivered" && <p className="bg-white rounded-3xl p-5 font-serif text-2xl text-brand-brown">Delivered. Enjoy every bite! 🎉</p>}
        {step < 2 && !cancelled && (
          <p className="text-sm font-medium text-brand-brown/70">
            {data.deliveryDate ? `Your delivery is planned for ${new Date(data.deliveryDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}. ` : ""}
            We&apos;ll show your rider here once your order is on its way.
          </p>
        )}
      </div>
    </main>
  );
}
