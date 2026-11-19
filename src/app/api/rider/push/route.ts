import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { IN_HOUSE, inHouseRider, riderPageUrl } from "@/lib/delivery";
import { pushToRider } from "@/lib/push";

type Body = {
  token?: string;
  action?: "subscribe" | "unsubscribe" | "test";
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
};

// The rider page turns push notifications on or off for this phone, or sends itself a test.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const supabase = createServerSupabase();
  const rider = await inHouseRider(supabase);
  const a = Buffer.from(rider.token);
  const b = Buffer.from(body.token || "");
  if (!rider.token || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  }

  if (body.action === "test") {
    const sent = await pushToRider(supabase, {
      title: "Notifications are on 🛵",
      body: `Hi ${rider.name}, you'll get a notification like this for every new delivery.`,
      url: riderPageUrl(rider.token),
      tag: "test",
    });
    return NextResponse.json({ ok: sent > 0, sent });
  }

  const endpoint = body.subscription?.endpoint;
  if (!endpoint || !/^https:\/\//.test(endpoint)) return NextResponse.json({ error: "Missing subscription" }, { status: 400 });

  if (body.action === "unsubscribe") {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  }

  const { p256dh, auth } = body.subscription?.keys || {};
  if (!p256dh || !auth) return NextResponse.json({ error: "Missing subscription keys" }, { status: 400 });
  const { error } = await supabase.from("push_subscriptions").upsert({ rider: IN_HOUSE, endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) {
    console.error("[Push] subscribe failed:", error);
    return NextResponse.json({ error: "Could not save. Has supabase-delivery-partner.sql been run?" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
