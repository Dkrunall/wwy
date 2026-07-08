import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("oms_auth")?.value === "1";
}

export async function GET() {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, read, created_at")
    .eq("recipient_type", "admin")
    .order("created_at", { ascending: false })
    .limit(30);
  return NextResponse.json({ notifications: data || [] });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json().catch(() => ({}));
  const supabase = createServerSupabase();
  let q = supabase.from("notifications").update({ read: true }).eq("recipient_type", "admin");
  if (ids?.length) q = q.in("id", ids);
  await q;
  return NextResponse.json({ ok: true });
}
