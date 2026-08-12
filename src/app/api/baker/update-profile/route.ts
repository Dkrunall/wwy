import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { token, phone, address, daily_capacity } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const supabase = createServerSupabase();

    const { data: baker } = await supabase
      .from("bakers")
      .select("id")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!baker) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const update: Record<string, string | number> = {};
    if (typeof phone === "string" && phone.trim()) update.phone = phone.trim();
    if (typeof address === "string" && address.trim()) update.address = address.trim();
    if (typeof daily_capacity === "number" && Number.isInteger(daily_capacity) && daily_capacity > 0) {
      update.daily_capacity = daily_capacity;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await supabase.from("bakers").update(update).eq("id", baker.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("update-profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
