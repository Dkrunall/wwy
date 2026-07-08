import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

async function resolveBaker(supabase: ReturnType<typeof createServerSupabase>, token: string) {
  const { data } = await supabase
    .from("bakers")
    .select("id")
    .eq("share_token", token)
    .eq("is_active", true)
    .single();
  return data;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const supabase = createServerSupabase();
  const baker = await resolveBaker(supabase, token);
  if (!baker) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, read, created_at")
    .eq("recipient_type", "baker")
    .eq("baker_id", baker.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return NextResponse.json({ notifications: data || [] });
}

export async function POST(req: NextRequest) {
  const { token, ids } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const supabase = createServerSupabase();
  const baker = await resolveBaker(supabase, token);
  if (!baker) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  let q = supabase.from("notifications").update({ read: true }).eq("baker_id", baker.id).eq("recipient_type", "baker");
  if (ids?.length) q = q.in("id", ids);
  await q;
  return NextResponse.json({ ok: true });
}
