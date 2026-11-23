// Live: robot-in.borzodelivery.com. Test: set BORZO_API_BASE to https://robotapitest-in.borzodelivery.com/api/business/1.6
const BORZO_API_BASE =
  process.env.BORZO_API_BASE || "https://robot-in.borzodelivery.com/api/business/1.6";

export interface BorzoDeliveryInput {
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupContactName: string;
  pickupContactPhone: string;
  dropoffAddress: string;
  dropoffContactName: string;
  dropoffContactPhone: string;
  dropoffNote?: string;
  clientOrderId: string;
}

export interface BorzoDeliveryResult {
  borzoOrderId: string | null;
  trackingUrl: string | null;
  error?: string;
}

export async function createBorzoDelivery(
  input: BorzoDeliveryInput
): Promise<BorzoDeliveryResult> {
  const token = process.env.BORZO_AUTH_TOKEN;
  if (!token) {
    console.warn("[Borzo] BORZO_AUTH_TOKEN not set — delivery creation skipped");
    return { borzoOrderId: null, trackingUrl: null, error: "not_configured" };
  }

  const pickup: Record<string, unknown> = {
    address: input.pickupAddress,
    contact_person: {
      name: input.pickupContactName,
      phone: input.pickupContactPhone,
    },
  };
  if (input.pickupLat) pickup.latitude = input.pickupLat;
  if (input.pickupLng) pickup.longitude = input.pickupLng;

  const dropoff: Record<string, unknown> = {
    address: input.dropoffAddress,
    client_order_id: input.clientOrderId,
    contact_person: {
      name: input.dropoffContactName,
      phone: input.dropoffContactPhone,
    },
  };
  if (input.dropoffNote) dropoff.note = input.dropoffNote;

  const body = {
    type: "standard",
    matter: "Sourdough Bread",
    total_weight_kg: "2",
    is_client_notification_enabled: true,
    is_contact_person_notification_enabled: true,
    points: [pickup, dropoff],
  };

  try {
    const res = await fetch(`${BORZO_API_BASE}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DV-Auth-Token": token,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.is_successful) {
      const errMsg = JSON.stringify(data.errors || data.warnings || "unknown_error");
      console.error("[Borzo] create-order failed:", errMsg);
      return { borzoOrderId: null, trackingUrl: null, error: errMsg };
    }

    const borzoOrderId = data.order?.order_id ? String(data.order.order_id) : null;
    const trackingUrl = (data.order?.points?.[1]?.tracking_url as string) || null;

    return { borzoOrderId, trackingUrl };
  } catch (err) {
    console.error("[Borzo] fetch error:", err);
    return { borzoOrderId: null, trackingUrl: null, error: "fetch_failed" };
  }
}

// Price quote only (calculate-order): books nothing and costs nothing. Used by the OMS
// "Test Borzo connection" button to check the key and API address.
export async function quoteBorzoDelivery(pickupAddress: string, dropoffAddress: string): Promise<{
  ok: boolean;
  live: boolean;
  amount?: string;
  error?: string;
}> {
  const live = !BORZO_API_BASE.includes("robotapitest");
  const token = process.env.BORZO_AUTH_TOKEN;
  if (!token) return { ok: false, live, error: "BORZO_AUTH_TOKEN is not set in Vercel." };
  try {
    const res = await fetch(`${BORZO_API_BASE}/calculate-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DV-Auth-Token": token },
      body: JSON.stringify({
        type: "standard",
        matter: "Sourdough Bread",
        total_weight_kg: "2",
        points: [{ address: pickupAddress }, { address: dropoffAddress }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) return { ok: false, live, error: "Borzo rejected the key. Check BORZO_AUTH_TOKEN, and that it matches the live/test address." };
    if (!data.is_successful) return { ok: false, live, error: JSON.stringify(data.errors || data.parameter_errors || data.warnings || `HTTP ${res.status}`) };
    return { ok: true, live, amount: data.order?.payment_amount };
  } catch {
    return { ok: false, live, error: "Could not reach Borzo." };
  }
}
