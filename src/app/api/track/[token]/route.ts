import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { IN_HOUSE, inHouseRider } from "@/lib/delivery";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FRESH_MS = 20 * 60 * 1000; // a position older than this is not shown

// Customer tracking page data. The order's tracking_token is the credential; only the first name,
// status and (while it is out with our rider) the rider's position are shared.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = createServerSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, customer_name, delivery_status, delivery_date, delivery_partner, delivery_person, borzo_tracking_url, status")
    .eq("tracking_token", token)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let rider: { name: string; lat: number; lng: number; updatedAt: string } | null = null;
  if (order.delivery_status === "out_for_delivery" && (order.delivery_partner || IN_HOUSE) === IN_HOUSE) {
    const { data: loc } = await supabase.from("rider_locations").select("lat, lng, updated_at").eq("rider", IN_HOUSE).maybeSingle();
    if (loc && Date.now() - new Date(loc.updated_at).getTime() < FRESH_MS) {
      rider = { name: order.delivery_person || (await inHouseRider(supabase)).name, lat: loc.lat, lng: loc.lng, updatedAt: loc.updated_at };
    }
  }

  return NextResponse.json(
    {
      orderNumber: order.order_number,
      firstName: (order.customer_name || "").split(" ")[0],
      status: order.status === "cancelled" ? "cancelled" : order.delivery_status,
      deliveryDate: order.delivery_date,
      partner: order.delivery_partner || IN_HOUSE,
      riderName: order.delivery_person,
      borzoUrl: order.delivery_partner === "borzo" ? order.borzo_tracking_url : null,
      rider,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
