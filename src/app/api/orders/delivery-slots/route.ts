import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getAvailableDeliverySlots, deliveryDateISO, formatDeliveryDate, parseDeliveryDays } from "@/lib/dateUtils";

export async function GET() {
  const supabase = createServerSupabase();
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["delivery_days", "cutoff_hour_ist"]);

  const map = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));
  const deliveryDays = map.delivery_days ? parseDeliveryDays(map.delivery_days) : [3, 6];
  const cutoffHour = map.cutoff_hour_ist ? parseInt(map.cutoff_hour_ist, 10) : 12;

  const slots = getAvailableDeliverySlots(5, deliveryDays, cutoffHour).map((d) => ({
    iso: deliveryDateISO(d),
    label: formatDeliveryDate(d),
  }));

  return NextResponse.json({ slots });
}
