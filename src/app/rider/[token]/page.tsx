"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { MapPin, Phone, Navigation, CheckCircle2, Loader2, Radio } from "lucide-react";

type RiderOrder = {
  id: string;
  order_number: string | null;
  customer_name: string;
  flat_number: string;
  notes: string | null;
  delivery_date: string | null;
  order_items: { product_name: string; quantity: number }[];
  customer: { address: string | null; phone: string | null; pincode: string | null } | null;
};

const SEND_EVERY_MS = 10000;

type PushState = "checking" | "unsupported" | "off" | "on" | "blocked" | "working";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function ago(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

// The in-house rider's page: today's deliveries, live location sharing and "mark delivered".
export default function RiderPage() {
  const { token } = useParams<{ token: string }>();
  const [rider, setRider] = useState("");
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [geoError, setGeoError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [push, setPush] = useState<PushState>("checking");
  const [pushMsg, setPushMsg] = useState("");
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/rider?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error || "Could not load your deliveries.");
    } else {
      setError("");
      setRider(d.rider);
      setOrders(d.orders || []);
      setLastSent((prev) => prev ?? d.lastShared);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  // Push notifications: is this phone already subscribed?
  useEffect(() => {
    const check = setTimeout(async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPush("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setPush("blocked");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setPush(sub ? "on" : "off");
    }, 0);
    return () => clearTimeout(check);
  }, []);

  const postPush = (body: Record<string, unknown>) =>
    fetch("/api/rider/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }) });

  const enablePush = async () => {
    setPush("working");
    setPushMsg("");
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Notifications are not set up on the server yet.");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "blocked" : "off");
        return;
      }
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      const r = await postPush({ action: "subscribe", subscription: sub.toJSON() });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Could not turn on notifications.");
      setPush("on");
      setPushMsg("Notifications are on. Tap “Send a test” to check.");
    } catch (e) {
      setPush("off");
      setPushMsg(e instanceof Error ? e.message : "Could not turn on notifications.");
    }
  };

  const disablePush = async () => {
    setPush("working");
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await postPush({ action: "unsubscribe", subscription: sub.toJSON() }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    setPush("off");
    setPushMsg("");
  };

  const testPush = async () => {
    setPushMsg("Sending…");
    const r = await postPush({ action: "test" });
    const d = await r.json().catch(() => ({}));
    setPushMsg(d.ok ? "Test sent. It should appear in a few seconds." : "No notification could be sent. Turn notifications off and on again.");
  };

  const send = useCallback(
    async (pos: GeolocationPosition) => {
      if (Date.now() - lastSentAt.current < SEND_EVERY_MS) return;
      lastSentAt.current = Date.now();
      const r = await fetch("/api/rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      }).catch(() => null);
      if (r?.ok) setLastSent(new Date().toISOString());
    },
    [token]
  );

  const stopSharing = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    setSharing(false);
  }, []);

  const startSharing = async () => {
    if (!("geolocation" in navigator)) {
      setGeoError("This phone's browser cannot share location.");
      return;
    }
    setGeoError("");
    lastSentAt.current = 0;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => send(pos),
      (err) => {
        setGeoError(err.code === err.PERMISSION_DENIED ? "Location permission is off. Allow location for this site in your browser settings." : "Could not get your location. Move to open sky and try again.");
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setSharing(true);
    // Keep the screen on while sharing, where the browser allows it.
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {}
  };

  useEffect(() => () => stopSharing(), [stopSharing]);

  const markDelivered = async (id: string) => {
    setDelivering(id);
    const r = await fetch("/api/rider/delivered", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, orderId: id }) });
    setDelivering(null);
    setConfirming(null);
    if (r.ok) {
      const left = orders.filter((o) => o.id !== id);
      setOrders(left);
      if (left.length === 0) stopSharing();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Could not mark delivered. Try again.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-oat flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-brown" />
      </main>
    );
  }

  if (error && !rider) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center px-6 text-center gap-3">
        <h1 className="font-serif text-3xl text-brand-brown">This link does not work.</h1>
        <p className="text-sm font-bold text-brand-brown/70">Ask the Wild Wild Yeast team for your current deliveries link.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-oat pb-16">
      <header className="sticky top-0 z-10 bg-brand-brown text-white px-4 py-3 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-white p-0.5 shrink-0">
          <Image src="/WWY-LOGO_White.png" alt="" width={72} height={72} className="w-full h-full object-contain" />
        </span>
        <div>
          <p className="text-xs font-bold text-white/70">Wild Wild Yeast deliveries</p>
          <p className="font-black leading-tight">Hi {rider}</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-5 flex flex-col gap-4">
        {/* Live location */}
        <section className={`rounded-3xl p-5 border ${sharing ? "bg-emerald-50 border-emerald-200" : "bg-white border-brand-brown/10"}`}>
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${sharing ? "text-emerald-700 animate-pulse" : "text-brand-brown/50"}`} />
            <h2 className="font-black text-brand-brown">{sharing ? "Sharing your live location" : "Live location is off"}</h2>
          </div>
          <p className="text-sm font-medium text-brand-brown/70 mt-1">
            {sharing
              ? `Customers on their way can see you. Last sent ${ago(lastSent)}. Keep this page open.`
              : "Turn this on when you leave with the orders, so customers can follow you on a map."}
          </p>
          {geoError && <p className="text-sm font-bold text-rose-700 mt-2">{geoError}</p>}
          <button
            onClick={sharing ? stopSharing : startSharing}
            className={`mt-4 w-full h-12 rounded-2xl font-black text-sm uppercase tracking-wide ${sharing ? "bg-white border border-emerald-300 text-emerald-800" : "bg-brand-brown text-white"}`}
          >
            {sharing ? "Stop sharing" : "Start sharing my location"}
          </button>
        </section>

        {/* Push notifications */}
        <section className="rounded-3xl p-5 border bg-white border-brand-brown/10">
          <h2 className="font-black text-brand-brown">
            {push === "on" ? "New delivery alerts are on" : "Get an alert for each new delivery"}
          </h2>
          <p className="text-sm font-medium text-brand-brown/70 mt-1">
            {push === "unsupported" && "This browser cannot show notifications. Open this page in Chrome."}
            {push === "blocked" && "Notifications are blocked. In Chrome, tap the lock icon next to the address, allow Notifications, then reload."}
            {(push === "off" || push === "checking" || push === "working") && "Your phone will buzz whenever an order is handed to you, even when Chrome is closed."}
            {push === "on" && "Your phone will buzz whenever an order is handed to you, even when Chrome is closed."}
          </p>
          {pushMsg && <p className="text-sm font-bold text-brand-brown mt-2">{pushMsg}</p>}
          {push !== "unsupported" && push !== "blocked" && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {push === "on" ? (
                <>
                  <button onClick={testPush} className="h-12 rounded-2xl bg-brand-brown text-white font-black text-xs uppercase">Send a test</button>
                  <button onClick={disablePush} className="h-12 rounded-2xl border border-brand-brown/20 text-brand-brown font-black text-xs uppercase">Turn off</button>
                </>
              ) : (
                <button
                  onClick={enablePush}
                  disabled={push === "working" || push === "checking"}
                  className="col-span-2 h-12 rounded-2xl bg-brand-brown text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {push === "working" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Turn on notifications"}
                </button>
              )}
            </div>
          )}
        </section>

        {error && <p className="text-sm font-bold text-rose-700">{error}</p>}

        <h2 className="font-serif text-2xl text-brand-brown mt-2">
          {orders.length === 0 ? "No deliveries right now." : `${orders.length} ${orders.length === 1 ? "delivery" : "deliveries"} to make`}
        </h2>
        {orders.length === 0 && <p className="text-sm font-medium text-brand-brown/70 -mt-2">New orders appear here when they go out for delivery. This page refreshes every minute.</p>}

        {orders.map((o) => {
          const address = o.customer?.address || `Flat ${o.flat_number}`;
          const query = `${address}${o.customer?.pincode ? " " + o.customer.pincode : ""}`;
          return (
            <article key={o.id} className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-brand-brown/60">{o.order_number || o.id.slice(0, 8).toUpperCase()}</p>
                  <h3 className="font-black text-lg text-brand-brown leading-tight">{o.customer_name}</h3>
                </div>
                <span className="text-xs font-black text-brand-brown/60">Flat {o.flat_number}</span>
              </div>
              <p className="flex gap-2 text-sm font-medium text-brand-brown/80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-brand-orange" />
                {address}
                {o.customer?.pincode ? `, ${o.customer.pincode}` : ""}
              </p>
              <ul className="text-sm font-bold text-brand-brown/80">
                {o.order_items.map((i) => (
                  <li key={i.product_name}>
                    {i.quantity} × {i.product_name}
                  </li>
                ))}
              </ul>
              {o.notes && <p className="text-sm italic text-brand-brown/70">Note: {o.notes}</p>}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-2xl bg-brand-oat border border-brand-brown/15 text-brand-brown font-black text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" /> Directions
                </a>
                {o.customer?.phone ? (
                  <a href={`tel:${o.customer.phone}`} className="h-11 rounded-2xl bg-brand-oat border border-brand-brown/15 text-brand-brown font-black text-xs uppercase flex items-center justify-center gap-1.5">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                ) : (
                  <span className="h-11 rounded-2xl bg-brand-oat/50 text-brand-brown/50 font-bold text-xs flex items-center justify-center">No phone</span>
                )}
              </div>
              {confirming === o.id ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setConfirming(null)} className="h-12 rounded-2xl border border-brand-brown/20 text-brand-brown font-black text-xs uppercase">
                    Not yet
                  </button>
                  <button onClick={() => markDelivered(o.id)} disabled={delivering === o.id} className="h-12 rounded-2xl bg-emerald-700 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-60">
                    {delivering === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, delivered"}
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirming(o.id)} className="h-12 rounded-2xl bg-brand-brown text-white font-black text-xs uppercase flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Mark delivered
                </button>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
