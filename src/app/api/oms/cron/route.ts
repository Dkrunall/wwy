import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdate } from "@/lib/whatsapp";

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
    .select("*, customers(phone)")
    .eq("delivery_date", todayISO)
    .eq("payment_status", "paid");

  if (!orders || orders.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const nowUTC = new Date();
  const istHour = (nowUTC.getUTCHours() + 5) % 24 + (nowUTC.getUTCMinutes() >= 30 ? 1 : 0);

  const transitions: Record<string, { from: string; to: string }> = {
    "6": { from: "placed", to: "resting" },
    "8": { from: "resting", to: "baking" },
    "11": { from: "baking", to: "out_for_delivery" },
    "16": { from: "out_for_delivery", to: "delivered" },
  };

  const transition = transitions[String(istHour)];
  if (!transition) {
    return NextResponse.json({ ok: true, processed: 0, message: "No transition for this hour" });
  }

  let processed = 0;
  for (const order of orders) {
    if (order.delivery_status !== transition.from) continue;

    await supabase
      .from("orders")
      .update({ delivery_status: transition.to, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    const phone = (order.customers as { phone: string } | null)?.phone;
    if (phone) {
      await sendDeliveryUpdate(phone, order.customer_name, order.order_number, transition.to).catch(console.error);
    }
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
