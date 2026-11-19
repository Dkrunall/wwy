import { isMumbaiPincode } from "@/lib/pincodes";
import { createServerSupabase } from "./supabase-server";
import { sendDeliveryUpdateToCustomer } from "./email";
import { customerTrackingUrl, dispatchFields } from "./delivery";
import { customerOfOrder } from "./customerOfOrder";

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
  // A baker can only move their own orders.
  if (order.baker_id !== baker.id) {
    return { ok: false, error: "This order is not assigned to you" };
  }

  const needCustomer = nextStatus === "out_for_delivery" || EMAIL_MILESTONES.includes(nextStatus);
  let customer: { email?: string | null; address?: string | null; phone?: string | null; pincode?: string | null } | null = null;
  if (needCustomer) {
    customer = await customerOfOrder(supabase, order, "email, address, phone, pincode");
  }

  const updatePayload: Record<string, unknown> = {
    delivery_status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  // Out for delivery: our in-house rider by default, or Borzo if the OMS set this order to Borzo.
  if (nextStatus === "out_for_delivery") {
    Object.assign(updatePayload, await dispatchFields(supabase, order, baker, customer));
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
      nextStatus,
      customerTrackingUrl(order, updatePayload)
    ).catch(console.error);
  }

  return { ok: true };
}

// We take orders for any Mumbai pincode (see lib/pincodes.ts). Bakers' pincode lists are
// still used to pick a baker in findBestBaker.
export async function isPincodeServiceable(
  _supabase: ReturnType<typeof createServerSupabase>,
  pincode?: string | null
): Promise<boolean> {
  return isMumbaiPincode(pincode);
}

// The baker every new order goes to (settings.default_baker_id, chosen in OMS > Settings).
// Returns null if none is chosen or that baker is inactive, so the order waits for manual assignment.
export async function defaultBakerId(supabase: ReturnType<typeof createServerSupabase>): Promise<string | null> {
  const { data: setting } = await supabase.from("settings").select("value").eq("key", "default_baker_id").maybeSingle();
  if (!setting?.value) return null;
  const { data: baker } = await supabase.from("bakers").select("id").eq("id", setting.value).eq("is_active", true).maybeSingle();
  return (baker?.id as string | undefined) ?? null;
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
