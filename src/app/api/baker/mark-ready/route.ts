import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { orderId, token } = await req.json();
    if (!orderId || !token) {
      return NextResponse.json({ error: "Missing orderId or token" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify the baker token
    const { data: baker } = await supabase
      .from("bakers")
      .select("id")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!baker) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Fetch order
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update delivery status
    await supabase
      .from("orders")
      .update({ delivery_status: "out_for_delivery", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // Notify customer via WhatsApp
    const { data: customer } = await supabase
      .from("customers")
      .select("email")
      .eq("flat_number", order.flat_number)
      .single();

    if (customer?.email) {
      await sendDeliveryUpdateToCustomer(customer.email, order.customer_name, order.order_number, "out_for_delivery").catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark-ready error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
