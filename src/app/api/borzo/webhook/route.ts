import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { customerOfOrder } from "@/lib/customerOfOrder";

// Borzo callbacks (API 1.6+), signed with X-DV-Signature = HMAC-SHA256(raw body, Callback Secret Key):
//   Delivery callback: { event_type: "delivery_changed", delivery: { client_order_id, status, ... } }
//   Order callback:    { event_type: "order_changed", order: { order_id, status, ... } }
// We map delivery "finished" / order "completed" → our "delivered".

function validSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature.trim().toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// Mark delivered once and email the customer once, whichever callback arrives first.
async function markDelivered(supabase: ReturnType<typeof createServerSupabase>, column: "id" | "borzo_order_id", value: string) {
  const { data: order } = await supabase
    .from("orders")
    .update({ delivery_status: "delivered", updated_at: new Date().toISOString() })
    .eq(column, value)
    .neq("delivery_status", "delivered")
    .select("id, customer_id, order_number, customer_name, flat_number")
    .maybeSingle();
  if (!order) return;

  const customer = await customerOfOrder(supabase, order, "email");
  if (customer?.email) {
    await sendDeliveryUpdateToCustomer(customer.email, order.customer_name, order.order_number, "delivered").catch(console.error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // The Callback Secret Key from the Borzo dashboard (API settings).
    const secret = process.env.BORZO_CALLBACK_SECRET || process.env.BORZO_WEBHOOK_TOKEN;
    if (secret && !validSignature(rawBody, req.headers.get("x-dv-signature"), secret)) {
      console.warn("[Borzo webhook] invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const supabase = createServerSupabase();

    // Delivery-level callback: client_order_id is our order UUID.
    const delivery = body.delivery;
    if (delivery?.client_order_id && delivery.status === "finished") {
      await markDelivered(supabase, "id", String(delivery.client_order_id));
      return NextResponse.json({ ok: true });
    }

    // Order-level callback: match via the stored borzo_order_id.
    if (body.order?.order_id && body.order.status === "completed") {
      await markDelivered(supabase, "borzo_order_id", String(body.order.order_id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, skipped: true });
  } catch (err) {
    console.error("[Borzo webhook] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
