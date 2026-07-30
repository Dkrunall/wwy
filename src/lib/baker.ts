import { createServerSupabase } from "./supabase-server";
import { sendDeliveryUpdateToCustomer } from "./email";
import { createBorzoDelivery } from "./borzo";

export const VALID_BAKER_STATUSES = ["placed", "mixing", "stretching", "resting", "cold_proof", "baking", "out_for_delivery", "delivered"];
const EMAIL_MILESTONES = ["resting", "baking", "out_for_delivery", "delivered"];

export async function updateOrderDeliveryStatus(
  supabase: ReturnType<typeof createServerSupabase>,
  baker: { id: string; name: string; phone?: string | null; address?: string | null; lat?: number | null; lng?: number | null },
  orderId: string,
  nextStatus: string
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_BAKER_STATUSES.includes(nextStatus)) {
    return { ok: false, error: "Invalid nextStatus" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { ok: false, error: "Order not found" };
  }

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

  if (nextStatus === "out_for_delivery") {
    if (!baker.address) {
      console.warn(`[Borzo] Baker ${baker.id} has no pickup address set — skipping`);
    } else {
      const dropoffAddress =
        customer?.address ||
        `Flat ${order.flat_number}${customer?.pincode ? ", " + customer.pincode : ""}`;

      const borzoResult = await createBorzoDelivery({
        pickupAddress: baker.address as string,
        pickupLat: baker.lat ?? undefined,
        pickupLng: baker.lng ?? undefined,
        pickupContactName: baker.name,
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

  if (EMAIL_MILESTONES.includes(nextStatus) && customer?.email) {
    await sendDeliveryUpdateToCustomer(
      customer.email,
      order.customer_name,
      order.order_number,
      nextStatus
    ).catch(console.error);
  }

  return { ok: true };
}

export async function isPincodeServiceable(
  supabase: ReturnType<typeof createServerSupabase>,
  pincode?: string | null
): Promise<boolean> {
  if (!pincode) return false;
  const { data } = await supabase
    .from("bakers")
    .select("id")
    .contains("pincodes", [pincode])
    .eq("is_active", true);
  return (data || []).length > 0;
}

export async function findBestBaker(
  supabase: ReturnType<typeof createServerSupabase>,
  pincode?: string | null
): Promise<string | null> {
  // Collect baker IDs currently on holiday
  const { data: holidaySettings } = await supabase
    .from("settings")
    .select("key, value")
    .like("key", "baker_holiday_%");

  const onHoliday = new Set(
    (holidaySettings || [])
      .filter((s: { key: string; value: string }) => s.value === "true")
      .map((s: { key: string }) => s.key.replace("baker_holiday_", ""))
  );

  // Pincode-matched bakers first, skip any on holiday
  if (pincode) {
    const { data } = await supabase
      .from("bakers")
      .select("id")
      .contains("pincodes", [pincode])
      .eq("is_active", true);

    const match = (data || []).find((b: { id: string }) => !onHoliday.has(b.id));
    if (match) return match.id as string;
  }

  // Fallback: any active baker not on holiday
  const { data } = await supabase
    .from("bakers")
    .select("id")
    .eq("is_active", true);

  const fallback = (data || []).find((b: { id: string }) => !onHoliday.has(b.id));
  return (fallback?.id as string) ?? null;
}
