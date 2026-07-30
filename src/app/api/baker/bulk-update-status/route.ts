import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { updateOrderDeliveryStatus, VALID_BAKER_STATUSES } from "@/lib/baker";

export async function POST(req: NextRequest) {
  try {
    const { orderIds, token, nextStatus } = await req.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0 || !token || !nextStatus) {
      return NextResponse.json({ error: "Missing orderIds, token or nextStatus" }, { status: 400 });
    }
    if (!VALID_BAKER_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid nextStatus" }, { status: 400 });
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

    const results = await Promise.all(
      orderIds.map((orderId: string) => updateOrderDeliveryStatus(supabase, baker, orderId, nextStatus))
    );

    const failed = orderIds.filter((_: string, i: number) => !results[i].ok);

    return NextResponse.json({ ok: failed.length === 0, updated: orderIds.length - failed.length, failed });
  } catch (err) {
    console.error("bulk-update-status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
