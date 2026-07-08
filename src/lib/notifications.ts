import { SupabaseClient } from "@supabase/supabase-js";

export async function createAdminNotification(
  supabase: SupabaseClient,
  title: string,
  body?: string
): Promise<void> {
  await supabase.from("notifications").insert({
    recipient_type: "admin",
    title,
    body: body || null,
  });
}

export async function createBakerNotification(
  supabase: SupabaseClient,
  bakerId: string,
  title: string,
  body?: string
): Promise<void> {
  await supabase.from("notifications").insert({
    recipient_type: "baker",
    baker_id: bakerId,
    title,
    body: body || null,
  });
}
