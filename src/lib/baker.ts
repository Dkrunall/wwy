import { createServerSupabase } from "./supabase-server";

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
