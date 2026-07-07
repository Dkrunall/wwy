import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { createBorzoDelivery } from "@/lib/borzo";

const VALID_BAKER_STATUSES = ["placed","mixing","stretching","resting","cold_proof","baking","out_for_delivery","delivered"];
const EMAIL_MILESTONES    = ["resting","baking","out_for_delivery","delivered"];

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
      .select("id, name, phone, address, lat, lng")
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

    // Fetch customer once — needed for Borzo dispatch and email
    const needCustomer = nextStatus === "out_for_delivery" || EMAIL_MILESTONES.includes(nextStatus);
    let customer: { email?: string | null; address?: string | null; phone?: string | null; pincode?: string | null } | null = null;
    if (needCustomer) {
      const { data } = await supabase
        .from("customers")
        .select("email, address, phone, pincode")
        .eq("flat_number", order.flat_number)
        .single();
      customer = data;
    }

    const updatePayload: Record<string, unknown> = {
      delivery_status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    // When baker marks ready for dispatch, create a Borzo delivery order
    if (nextStatus === "out_for_delivery") {
      if (!baker.address) {
        console.warn(`[Borzo] Baker ${baker.id} has no pickup address set — skipping`);
      } else {
        const dropoffAddress =
          customer?.address ||
          `Flat ${order.flat_number}${customer?.pincode ? ", " + customer.pincode : ""}`;

        const borzoResult = await createBorzoDelivery({
          pickupAddress: baker.address as string,
          pickupLat: (baker.lat as number | null) ?? undefined,
          pickupLng: (baker.lng as number | null) ?? undefined,
          pickupContactName: baker.name as string,
          pickupContactPhone: baker.phone as string,
          dropoffAddress,
          dropoffContactName: order.customer_name,
          dropoffContactPhone: customer?.phone || "",
          dropoffNote: `Flat ${order.flat_number} · WWY ${order.order_number || orderId.slice(0, 8).toUpperCase()}`,
          clientOrderId: orderId,
        });

        if (borzoResult.borzoOrderId) updatePayload.borzo_order_id = borzoResult.borzoOrderId;
        if (borzoResult.trackingUrl) updatePayload.borzo_tracking_url = borzoResult.trackingUrl;

        if (borzoResult.error && borzoResult.error !== "not_configured") {
          console.error("[Borzo] Delivery creation error:", borzoResult.error);
        }
      }
    }

    await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    // Email customer on meaningful milestones
    if (EMAIL_MILESTONES.includes(nextStatus) && customer?.email) {
      await sendDeliveryUpdateToCustomer(
        customer.email,
        order.customer_name,
        order.order_number,
        nextStatus
      ).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark-ready error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
