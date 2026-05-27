import { createServerSupabase } from "./supabase-server";

export async function findBestBaker(
  supabase: ReturnType<typeof createServerSupabase>,
  pincode: string
): Promise<string | null> {
  const { data } = await supabase
    .from("bakers")
    .select("id")
    .contains("pincodes", [pincode])
    .eq("is_active", true)
    .limit(1)
    .single();
  return data?.id ?? null;
}
