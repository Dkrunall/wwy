import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { customerTrackingUrl, dispatchFields } from "@/lib/delivery";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { customerOfOrder } from "@/lib/customerOfOrder";

const VALID_STATUSES = ["placed","mixing","stretching","resting","cold_proof","baking","out_for_delivery","delivered"];
const EMAIL_MILESTONES = ["resting","baking","out_for_delivery","delivered"];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!(await verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, nextStatus } = await req.json();
    if (!orderId || !nextStatus) {
      return NextResponse.json({ error: "Missing orderId or nextStatus" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid nextStatus" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const needCustomer = nextStatus === "out_for_delivery" || EMAIL_MILESTONES.includes(nextStatus);
    let customer: { email?: string | null; address?: string | null; phone?: string | null; pincode?: string | null } | null = null;
    if (needCustomer) {
      customer = await customerOfOrder(supabase, order, "email, address, phone, pincode");
    }

    const updatePayload: Record<string, unknown> = {
      delivery_status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    // Out for delivery: our in-house rider by default, or Borzo if this order is set to Borzo.
    if (nextStatus === "out_for_delivery") {
      const { data: baker } = order.baker_id
        ? await supabase.from("bakers").select("id, name, phone, address, lat, lng").eq("id", order.baker_id).single()
        : { data: null };
      Object.assign(updatePayload, await dispatchFields(supabase, order, baker, customer));
    }

    await supabase.from("orders").update(updatePayload).eq("id", orderId);

    if (EMAIL_MILESTONES.includes(nextStatus) && customer?.email) {
      await sendDeliveryUpdateToCustomer(
        customer.email,
        order.customer_name,
        order.order_number,
        nextStatus,
        customerTrackingUrl(order, updatePayload)
      ).catch(console.error);
    }

    return NextResponse.json({ ok: true, updatePayload });
  } catch (err) {
    console.error("OMS advance delivery error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
