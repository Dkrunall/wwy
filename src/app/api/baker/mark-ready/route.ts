import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { updateOrderDeliveryStatus } from "@/lib/baker";

export async function POST(req: NextRequest) {
  try {
    const { orderId, token, nextStatus } = await req.json();
    if (!orderId || !token || !nextStatus) {
      return NextResponse.json({ error: "Missing orderId, token or nextStatus" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: baker } = await supabase
      .from("bakers")
      .select("id, name, phone, address, lat, lng")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!baker) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const result = await updateOrderDeliveryStatus(supabase, baker, orderId, nextStatus);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "Order not found" ? 404 : 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark-ready error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
