import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getAvailableDeliverySlots, deliveryDateISO, formatDeliveryDate, parseDeliveryDays } from "@/lib/dateUtils";
import { DEFAULT_CUTOFF_HOUR_IST, DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";

export async function GET() {
  const supabase = createServerSupabase();
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["delivery_days", "cutoff_hour_ist"]);

  const map = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));
  const deliveryDays = map.delivery_days ? parseDeliveryDays(map.delivery_days) : DEFAULT_DELIVERY_DAYS;
  const cutoffHour = map.cutoff_hour_ist ? parseInt(map.cutoff_hour_ist, 10) : DEFAULT_CUTOFF_HOUR_IST;

  const slots = getAvailableDeliverySlots(5, deliveryDays, cutoffHour).map((d) => ({
    iso: deliveryDateISO(d),
    label: formatDeliveryDate(d),
  }));

  return NextResponse.json({ slots });
}
