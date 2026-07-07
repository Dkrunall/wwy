import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";

const VALID_BAKER_STATUSES = ["placed","mixing","stretching","resting","cold_proof","baking","out_for_delivery","delivered"];

export async function POST(req: NextRequest) {
  try {
    const { orderId, token, nextStatus } = await req.json();
    if (!orderId || !token || !nextStatus) {
      return NextResponse.json({ error: "Missing orderId, token or nextStatus" }, { status: 400 });
    }
    if (!VALID_BAKER_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid nextStatus" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: baker } = await supabase
      .from("bakers")
      .select("id")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!baker) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await supabase
      .from("orders")
      .update({ delivery_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // Email customer on meaningful milestones (not every micro-step)
    const EMAIL_MILESTONES = ["resting", "baking", "out_for_delivery", "delivered"];
    if (EMAIL_MILESTONES.includes(nextStatus)) {
      const { data: customer } = await supabase
        .from("customers")
        .select("email")
        .eq("flat_number", order.flat_number)
        .single();
      if (customer?.email) {
        await sendDeliveryUpdateToCustomer(customer.email, order.customer_name, order.order_number, nextStatus).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark-ready error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
