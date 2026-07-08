import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Borzo sends two types of callbacks:
//   Delivery callback: { delivery_id, client_order_id, status, order_id, point_id }
//   Order callback:    { order: { order_id, status, ... } }
// We map Borzo "finished" → our "delivered".

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const expectedToken = process.env.BORZO_WEBHOOK_TOKEN;
    if (expectedToken && body.token !== expectedToken) {
      console.warn("[Borzo webhook] invalid token received");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Delivery-level callback — client_order_id is our order UUID
    if (body.client_order_id && body.status === "finished") {
      await supabase
        .from("orders")
        .update({ delivery_status: "delivered", updated_at: new Date().toISOString() })
        .eq("id", body.client_order_id);
      return NextResponse.json({ ok: true });
    }

    // Order-level callback — match via stored borzo_order_id
    if (body.order?.order_id && body.order?.status === "completed") {
      await supabase
        .from("orders")
        .update({ delivery_status: "delivered", updated_at: new Date().toISOString() })
        .eq("borzo_order_id", String(body.order.order_id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, skipped: true });
  } catch (err) {
    console.error("[Borzo webhook] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
