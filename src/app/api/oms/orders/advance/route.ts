import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendDeliveryUpdateToCustomer } from "@/lib/email";
import { createBorzoDelivery } from "@/lib/borzo";

const VALID_STATUSES = ["placed","mixing","stretching","resting","cold_proof","baking","out_for_delivery","delivered"];
const EMAIL_MILESTONES = ["resting","baking","out_for_delivery","delivered"];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("oms_auth")?.value !== "1") {
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

    if (nextStatus === "out_for_delivery" && order.baker_id) {
      const { data: baker } = await supabase
        .from("bakers")
        .select("id, name, phone, address, lat, lng")
        .eq("id", order.baker_id)
        .single();

      if (baker?.address) {
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
          console.error("[Borzo] OMS advance delivery error:", borzoResult.error);
        }
      } else {
        console.warn(`[Borzo] Baker ${order.baker_id} has no pickup address — skipping dispatch`);
      }
    }

    await supabase.from("orders").update(updatePayload).eq("id", orderId);

    if (EMAIL_MILESTONES.includes(nextStatus) && customer?.email) {
      await sendDeliveryUpdateToCustomer(
        customer.email,
        order.customer_name,
        order.order_number,
        nextStatus
      ).catch(console.error);
    }

    return NextResponse.json({ ok: true, updatePayload });
  } catch (err) {
    console.error("OMS advance delivery error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
