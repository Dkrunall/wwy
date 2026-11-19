import webpush from "web-push";
import type { createServerSupabase } from "./supabase-server";

type Supabase = ReturnType<typeof createServerSupabase>;
export type PushMessage = { title: string; body: string; url: string; tag?: string };

let configured: boolean | null = null;
function configure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  configured = !!(pub && priv);
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://wildwildyeast.com", pub!, priv!);
  else console.warn("[Push] VAPID keys not set, so push notifications are off");
  return configured;
}

// Sends a notification to every phone the rider turned notifications on for. Expired subscriptions are removed.
export async function pushToRider(supabase: Supabase, message: PushMessage, rider = "in_house"): Promise<number> {
  if (!configure()) return 0;
  const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("rider", rider);
  let sent = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(message), { TTL: 60 * 60 * 6 });
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id);
      else console.error("[Push] send failed:", status, e);
    }
  }
  return sent;
}
