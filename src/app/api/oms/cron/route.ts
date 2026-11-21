import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { customerTrackingUrl, dispatchFields } from "@/lib/delivery";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { createDueSubscriptionOrders, sendRenewalReminders } from "@/lib/subscriptions";

// Called manually from OMS or via Vercel Cron (add to vercel.json)
// Processes delivery status transitions for today's orders.

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Manual trigger via x-cron-secret header
  const secret = req.headers.get("x-cron-secret");
  if (secret && secret === process.env.CRON_SECRET) return true;
  // OMS session cookie
  const cookieStore = await cookies();
  return verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const todayISO = new Date().toISOString().slice(0, 10);

  // Standing Orders: bakes past their order cutoff become orders, and renewal links go out.
  // Failures here (e.g. supabase-subscriptions.sql not run yet) must not stop the status updates below.
  const subscriptionOrders = await createDueSubscriptionOrders(supabase).catch((e) => { console.error("[Cron] subscription orders:", e); return 0; });
  const renewalEmails = await sendRenewalReminders(supabase).catch((e) => { console.error("[Cron] renewal reminders:", e); return 0; });

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(email, address, phone, pincode), bakers(id, name, phone, address, lat, lng)")
    .eq("delivery_date", todayISO)
    .eq("payment_status", "paid");

  if (!orders || orders.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, subscriptionOrders, renewalEmails });
  }

  const nowUTC = new Date();
  const istHour = Math.floor(((nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes() + 330) % 1440) / 60);

  const transitions: Record<string, { from: string; to: string }> = {
    "6":  { from: "placed",            to: "resting" },
    "8":  { from: "resting",           to: "baking" },
    "11": { from: "baking",            to: "out_for_delivery" },
    "16": { from: "out_for_delivery",  to: "delivered" },
  };

  const transition = transitions[String(istHour)];
  if (!transition) {
    return NextResponse.json({ ok: true, processed: 0, message: "No transition for this hour", subscriptionOrders, renewalEmails });
  }

  let processed = 0;
  for (const order of orders) {
    if (order.delivery_status !== transition.from) continue;

    const updatePayload: Record<string, unknown> = {
      delivery_status: transition.to,
      updated_at: new Date().toISOString(),
    };

    // Out for delivery: our in-house rider by default, or Borzo if this order is set to Borzo.
    if (transition.to === "out_for_delivery") {
      const baker = order.bakers as { name: string; phone: string; address: string | null; lat?: number | null; lng?: number | null } | null;
      const customer = order.customers as { address?: string; phone?: string; pincode?: string } | null;
      Object.assign(updatePayload, await dispatchFields(supabase, order, baker, customer));
    }

    await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id);

    const email = (order.customers as { email?: string } | null)?.email;
    if (email) {
      await sendDeliveryUpdateToCustomer(email, order.customer_name, order.order_number, transition.to, customerTrackingUrl(order, updatePayload)).catch(console.error);
    }
    processed++;
  }

  return NextResponse.json({ ok: true, processed, subscriptionOrders, renewalEmails });
}
