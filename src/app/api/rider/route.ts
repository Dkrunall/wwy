import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { IN_HOUSE, inHouseRider } from "@/lib/delivery";
import { customerOfOrder } from "@/lib/customerOfOrder";

// The in-house rider's page (/rider/[token]). The token in settings.in_house_rider_token is the credential.
async function authorise(token: unknown) {
  if (typeof token !== "string" || !token) return null;
  const supabase = createServerSupabase();
  const rider = await inHouseRider(supabase);
  const a = Buffer.from(rider.token);
  const b = Buffer.from(token);
  if (!rider.token || a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { supabase, rider };
}

// Deliveries the rider has right now: in-house orders that are out for delivery.
export async function GET(req: NextRequest) {
  const auth = await authorise(req.nextUrl.searchParams.get("token"));
  if (!auth) return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  const { supabase, rider } = auth;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, order_number, customer_name, flat_number, notes, delivery_date, order_items(product_name, quantity)")
    .eq("delivery_status", "out_for_delivery")
    .eq("delivery_partner", IN_HOUSE)
    .order("delivery_date");

  const withCustomer = await Promise.all(
    (orders || []).map(async ({ customer_id, ...o }) => ({
      ...o,
      customer: await customerOfOrder(supabase, { customer_id, flat_number: o.flat_number }, "address, phone, pincode"),
    }))
  );

  const { data: location } = await supabase.from("rider_locations").select("updated_at").eq("rider", IN_HOUSE).maybeSingle();

  return NextResponse.json({
    rider: rider.name,
    lastShared: location?.updated_at ?? null,
    orders: withCustomer,
  });
}

// The rider's phone sends its position every few seconds while sharing is on.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string; lat?: number; lng?: number; accuracy?: number };
  const auth = await authorise(body.token);
  if (!auth) return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  const { lat, lng, accuracy } = body;
  if (typeof lat !== "number" || typeof lng !== "number" || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Bad location" }, { status: 400 });
  }
  const { error } = await auth.supabase
    .from("rider_locations")
    .upsert({ rider: IN_HOUSE, lat, lng, accuracy: typeof accuracy === "number" ? accuracy : null, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[Rider] location save failed:", error);
    return NextResponse.json({ error: "Could not save location" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
