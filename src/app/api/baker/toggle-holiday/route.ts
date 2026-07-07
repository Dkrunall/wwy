import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { token, holiday } = await req.json();
    if (!token || typeof holiday !== "boolean") {
      return NextResponse.json({ error: "Missing token or holiday" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: baker } = await supabase
      .from("bakers")
      .select("id")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!baker) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const key = `baker_holiday_${baker.id}`;
    await supabase
      .from("settings")
      .upsert({ key, value: holiday ? "true" : "false" }, { onConflict: "key" });

    return NextResponse.json({ ok: true, holiday });
  } catch (err) {
    console.error("toggle-holiday error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
