import { createBorzoDelivery } from "./borzo";
import { sendRiderAssignment } from "./email";
import { pushToRider } from "./push";
import type { createServerSupabase } from "./supabase-server";

// Who delivers an order. New orders go to our in-house rider; the OMS can switch an order to Borzo.
export type DeliveryPartner = "in_house" | "borzo";
export const DELIVERY_PARTNERS: DeliveryPartner[] = ["in_house", "borzo"];
export const IN_HOUSE = "in_house";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wildwildyeast.com";

type Supabase = ReturnType<typeof createServerSupabase>;
type Baker = { id?: string; name: string; phone?: string | null; address?: string | null; lat?: number | null; lng?: number | null } | null;
type Customer = { address?: string | null; phone?: string | null; pincode?: string | null } | null;
type Order = {
  id: string;
  flat_number: string;
  customer_name: string;
  order_number?: string | null;
  notes?: string | null;
  delivery_partner?: string | null;
  tracking_token?: string | null;
  borzo_tracking_url?: string | null;
  order_items?: { product_name: string; quantity: number }[];
};

export type Rider = { name: string; phone: string; email: string; token: string };

// The in-house rider, from the settings table (in_house_rider_*).
export async function inHouseRider(supabase: Supabase): Promise<Rider> {
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["in_house_rider_name", "in_house_rider_phone", "in_house_rider_email", "in_house_rider_token"]);
  const map = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
  return {
    name: map.in_house_rider_name || "Nilesh",
    phone: map.in_house_rider_phone || "",
    email: map.in_house_rider_email || "",
    token: map.in_house_rider_token || "",
  };
}

export const riderPageUrl = (token: string) => `${SITE_URL}/rider/${token}`;

// The link a customer gets to follow their order: Borzo's tracking page, or our own for in-house deliveries.
export function customerTrackingUrl(order: Order, fields: Record<string, unknown> = {}): string | null {
  const borzo = (fields.borzo_tracking_url as string | undefined) || order.borzo_tracking_url;
  if (borzo) return borzo;
  if ((order.delivery_partner || IN_HOUSE) === IN_HOUSE && order.tracking_token) return `${SITE_URL}/track/${order.tracking_token}`;
  return null;
}

// Fields to save on an order when it goes out for delivery: the in-house rider by default (who gets
// an email and a push notification), or a Borzo booking when the order is set to Borzo.
export async function dispatchFields(supabase: Supabase, order: Order, baker: Baker, customer: Customer): Promise<Record<string, unknown>> {
  if (order.delivery_partner !== "borzo") {
    const rider = await inHouseRider(supabase);
    if (rider.email && rider.token) {
      const items =
        order.order_items ??
        ((await supabase.from("order_items").select("product_name, quantity").eq("order_id", order.id)).data as { product_name: string; quantity: number }[] | null) ??
        [];
      await sendRiderAssignment(rider.email, rider.name, {
        orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
        customerName: order.customer_name,
        flatNumber: order.flat_number,
        address: customer?.address,
        pincode: customer?.pincode,
        phone: customer?.phone,
        items,
        notes: order.notes,
        riderUrl: riderPageUrl(rider.token),
      }).catch((e) => console.error("[Rider] assignment email failed:", e));
    }
    if (rider.token) {
      const address = customer?.address || `Flat ${order.flat_number}`;
      await pushToRider(supabase, {
        title: "New delivery 🛵",
        body: `${order.customer_name} · ${address}${customer?.pincode ? ", " + customer.pincode : ""}`,
        url: riderPageUrl(rider.token),
        tag: `order-${order.id}`,
      }).catch((e) => console.error("[Rider] push failed:", e));
    }
    return { delivery_person: rider.name };
  }

  const fields: Record<string, unknown> = { delivery_person: "Borzo" };
  if (!baker?.address) {
    console.warn(`[Borzo] No pickup address for order ${order.id}, so Borzo was not booked`);
    return fields;
  }
  const result = await createBorzoDelivery({
    pickupAddress: baker.address,
    pickupLat: baker.lat ?? undefined,
    pickupLng: baker.lng ?? undefined,
    pickupContactName: baker.name,
    pickupContactPhone: baker.phone || "",
    dropoffAddress: customer?.address || `Flat ${order.flat_number}${customer?.pincode ? ", " + customer.pincode : ""}`,
    dropoffContactName: order.customer_name,
    dropoffContactPhone: customer?.phone || "",
    dropoffNote: `Flat ${order.flat_number} · WWY ${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
    clientOrderId: order.id,
  }).catch((e) => {
    console.error("[Borzo] booking failed:", e);
    return { borzoOrderId: null, trackingUrl: null, error: String(e) };
  });
  if (result.borzoOrderId) fields.borzo_order_id = result.borzoOrderId;
  if (result.trackingUrl) fields.borzo_tracking_url = result.trackingUrl;
  if (result.error && result.error !== "not_configured") console.error("[Borzo] booking error:", result.error);
  return fields;
}
