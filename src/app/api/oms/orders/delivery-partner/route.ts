import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { DELIVERY_PARTNERS, dispatchFields, inHouseRider, type DeliveryPartner } from "@/lib/delivery";
import { customerOfOrder } from "@/lib/customerOfOrder";

// OMS: choose who delivers an order (in-house rider or Borzo).
// If the order is already out for delivery, the switch takes effect at once (Borzo is booked now).
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!(await verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, partner } = (await req.json()) as { orderId?: string; partner?: DeliveryPartner };
  if (!orderId || !partner || !DELIVERY_PARTNERS.includes(partner)) {
    return NextResponse.json({ error: "Missing orderId or invalid partner" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const update: Record<string, unknown> = { delivery_partner: partner, updated_at: new Date().toISOString() };
  let note: string | undefined;

  if (order.delivery_status === "out_for_delivery") {
    if (partner === "borzo" && !order.borzo_order_id) {
      const [{ data: baker }, { data: customer }] = await Promise.all([
        order.baker_id
          ? supabase.from("bakers").select("id, name, phone, address, lat, lng").eq("id", order.baker_id).single()
          : Promise.resolve({ data: null }),
        customerOfOrder(supabase, order, "address, phone, pincode").then((data) => ({ data })),
      ]);
      Object.assign(update, await dispatchFields(supabase, { ...order, delivery_partner: "borzo" }, baker, customer));
      if (!update.borzo_order_id) note = "Saved, but Borzo could not be booked. Check the baker's pickup address and the Borzo settings.";
    } else if (partner === "in_house") {
      update.delivery_person = (await inHouseRider(supabase)).name;
      if (order.borzo_order_id) note = "Switched to the in-house rider. Cancel the existing booking in the Borzo dashboard.";
    }
  }

  const { error } = await supabase.from("orders").update(update).eq("id", orderId);
  if (error) {
    console.error("[OMS] delivery partner update failed:", error);
    return NextResponse.json({ error: "Could not save. Has supabase-delivery-partner.sql been run?" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, update, note });
}
