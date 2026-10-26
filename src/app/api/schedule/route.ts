import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { parseDeliveryDays } from "@/lib/dateUtils";
import { DEFAULT_CUTOFF_HOUR_IST, DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";

// Public: the delivery days and cutoff hour the announcement bar counts down to.
// Reads the same OMS settings the checkout resolver uses, so banner and checkout agree.
export async function GET() {
  const { data } = await createServerSupabase()
    .from("settings")
    .select("key, value")
    .in("key", ["delivery_days", "cutoff_hour_ist"]);
  const map = Object.fromEntries((data || []).map((s) => [s.key, s.value]));

  const days = map.delivery_days ? parseDeliveryDays(map.delivery_days) : DEFAULT_DELIVERY_DAYS;
  const hour = map.cutoff_hour_ist ? parseInt(map.cutoff_hour_ist, 10) : DEFAULT_CUTOFF_HOUR_IST;

  return NextResponse.json(
    {
      deliveryDays: days.length ? days : DEFAULT_DELIVERY_DAYS,
      cutoffHour: Number.isFinite(hour) ? hour : DEFAULT_CUTOFF_HOUR_IST,
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}
