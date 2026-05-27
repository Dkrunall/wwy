import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, flatNumber, rating, comment } = await req.json();

    if (!orderId || !flatNumber || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid feedback data" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: order } = await supabase
      .from("orders")
      .select("id, flat_number, delivery_status")
      .eq("id", orderId)
      .eq("flat_number", flatNumber)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { error } = await supabase.from("feedbacks").insert({
      order_id: orderId,
      flat_number: flatNumber,
      rating,
      comment: comment?.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
