import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Data for the baker dashboard (/baker/[token]). The share token is the credential.
// Replaces browser reads of bakers, orders, customers and settings.

const ORDER_SELECT = "id, order_number, flat_number, customer_name, total_paise, delivery_date, delivery_status, payment_status, notes, created_at, order_items(product_name, quantity)";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const view = req.nextUrl.searchParams.get("view");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: baker } = await supabase
    .from("bakers")
    .select("id, name, phone, address, daily_capacity")
    .eq("share_token", token)
    .eq("is_active", true)
    .maybeSingle();
  if (!baker) return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });

  if (view === "history") {
    const { data } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("baker_id", baker.id)
      .eq("payment_status", "paid")
      .eq("delivery_status", "delivered")
      .order("created_at", { ascending: false })
      .limit(40);
    return NextResponse.json({ history: data || [] });
  }

  const [{ data: orders }, { data: holiday }, { count }] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("baker_id", baker.id)
      .eq("payment_status", "paid")
      .not("delivery_status", "eq", "delivered")
      .order("created_at", { ascending: true }),
    supabase.from("settings").select("value").eq("key", `baker_holiday_${baker.id}`).maybeSingle(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("baker_id", baker.id)
      .eq("payment_status", "paid")
      .eq("delivery_status", "delivered"),
  ]);

  // Attach customer phones so the baker can call for delivery.
  const rows = orders || [];
  const flats = [...new Set(rows.map((o) => o.flat_number))];
  const phones: Record<string, string | null> = {};
  if (flats.length) {
    const { data: custs } = await supabase.from("customers").select("flat_number, phone").in("flat_number", flats);
    for (const c of custs || []) phones[c.flat_number] = c.phone;
  }

  return NextResponse.json({
    baker,
    queue: rows.map((o) => ({ ...o, customer_phone: phones[o.flat_number] ?? null })),
    isHoliday: holiday?.value === "true",
    deliveredCount: count ?? 0,
  });
}
