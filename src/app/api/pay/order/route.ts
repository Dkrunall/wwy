import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Order summary for the /pay/[id] payment link. Looked up by Razorpay order id, which
// works as the secret in the link. Returns only what the page shows.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ order: null }, { status: 400 });

  const { data } = await createServerSupabase()
    .from("orders")
    .select("id, order_number, customer_name, total_paise, payment_status, delivery_date, order_items(product_name, quantity, unit_price_paise)")
    .eq("razorpay_order_id", id)
    .maybeSingle();
  return NextResponse.json({ order: data ?? null });
}
