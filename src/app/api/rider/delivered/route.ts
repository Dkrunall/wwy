import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { IN_HOUSE, inHouseRider } from "@/lib/delivery";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { customerOfOrder } from "@/lib/customerOfOrder";

// The in-house rider marks an order as delivered from their page.
export async function POST(req: NextRequest) {
  const { token, orderId } = (await req.json().catch(() => ({}))) as { token?: string; orderId?: string };
  const supabase = createServerSupabase();
  const rider = await inHouseRider(supabase);
  const a = Buffer.from(rider.token);
  const b = Buffer.from(token || "");
  if (!rider.token || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  }
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order || order.delivery_partner !== IN_HOUSE || order.delivery_status !== "out_for_delivery") {
    return NextResponse.json({ error: "This order is not out for delivery with you." }, { status: 400 });
  }

  await supabase.from("orders").update({ delivery_status: "delivered", updated_at: new Date().toISOString() }).eq("id", orderId);

  const customer = await customerOfOrder(supabase, order, "email");
  if (customer?.email) {
    await sendDeliveryUpdateToCustomer(customer.email, order.customer_name, order.order_number, "delivered").catch(console.error);
  }
  return NextResponse.json({ ok: true });
}
