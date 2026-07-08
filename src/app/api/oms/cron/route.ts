import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { createBorzoDelivery } from "@/lib/borzo";

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
  return cookieStore.get("oms_auth")?.value === "1";
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

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(email, address, phone, pincode), bakers(id, name, phone, address)")
    .eq("delivery_date", todayISO)
    .eq("payment_status", "paid");

  if (!orders || orders.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
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
    return NextResponse.json({ ok: true, processed: 0, message: "No transition for this hour" });
  }

  let processed = 0;
  for (const order of orders) {
    if (order.delivery_status !== transition.from) continue;

    const updatePayload: Record<string, unknown> = {
      delivery_status: transition.to,
      updated_at: new Date().toISOString(),
    };

    // Dispatch Borzo when transitioning to out_for_delivery
    if (transition.to === "out_for_delivery") {
      const baker = order.bakers as { name: string; phone: string; address: string | null } | null;
      const customer = order.customers as { email?: string; address?: string; phone?: string; pincode?: string } | null;

      if (baker?.address) {
        const dropoffAddress =
          customer?.address ||
          `Flat ${order.flat_number}${customer?.pincode ? ", " + customer.pincode : ""}`;

        const borzoResult = await createBorzoDelivery({
          pickupAddress: baker.address,
          pickupContactName: baker.name,
          pickupContactPhone: baker.phone,
          dropoffAddress,
          dropoffContactName: order.customer_name,
          dropoffContactPhone: customer?.phone || "",
          dropoffNote: `Flat ${order.flat_number} · WWY ${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
          clientOrderId: order.id,
        }).catch((e) => { console.error("[Cron Borzo] error:", e); return { borzoOrderId: null, trackingUrl: null }; });

        if (borzoResult.borzoOrderId) updatePayload.borzo_order_id = borzoResult.borzoOrderId;
        if (borzoResult.trackingUrl) updatePayload.borzo_tracking_url = borzoResult.trackingUrl;
      } else {
        console.warn(`[Cron Borzo] Baker has no address for order ${order.id} — skipping dispatch`);
      }
    }

    await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id);

    const email = (order.customers as { email?: string } | null)?.email;
    if (email) {
      await sendDeliveryUpdateToCustomer(email, order.customer_name, order.order_number, transition.to).catch(console.error);
    }
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
