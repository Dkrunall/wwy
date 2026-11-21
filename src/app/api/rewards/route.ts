import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSessionCustomer } from "@/lib/customerSession";
import { creditBalance, hasFreeDelivery, reservedCredit } from "@/lib/crumbPoints";

// The signed-in customer's Crumb Points balance, recent credit history and delivery waiver.
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const customer = await getSessionCustomer(req, supabase);
  if (!customer) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const [balancePaise, reservedPaise, freeDelivery, { data: entries }] = await Promise.all([
    creditBalance(supabase, customer.id),
    reservedCredit(supabase, customer.id),
    hasFreeDelivery(supabase, customer.phone),
    supabase
      .from("ledger_entries")
      .select("source, amount_paise, bake_date, created_at, orders(order_number)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    balancePaise,
    availablePaise: Math.max(0, balancePaise - reservedPaise),
    freeDelivery,
    entries: entries || [],
  });
}
