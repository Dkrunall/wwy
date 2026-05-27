import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("oms_auth")?.value === "1";
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { enabled } = await req.json();
  const supabase = createServerSupabase();
  await supabase
    .from("settings")
    .upsert({ key: "vacation_mode", value: String(enabled) });
  return NextResponse.json({ ok: true, vacation_mode: enabled });
}

export async function GET() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("settings").select("value").eq("key", "vacation_mode").single();
  return NextResponse.json({ vacation_mode: data?.value === "true" });
}
