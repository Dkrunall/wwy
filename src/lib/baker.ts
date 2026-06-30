import { createServerSupabase } from "./supabase-server";

export async function findBestBaker(
  supabase: ReturnType<typeof createServerSupabase>,
  pincode?: string | null
): Promise<string | null> {
  if (pincode) {
    const { data } = await supabase
      .from("bakers")
      .select("id")
      .contains("pincodes", [pincode])
      .eq("is_active", true)
      .limit(1)
      .single();
    if (data?.id) return data.id as string;
  }

  // Fallback: any active baker when pincode is missing or unmatched
  const { data } = await supabase
    .from("bakers")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();
  return (data?.id as string) ?? null;
}
