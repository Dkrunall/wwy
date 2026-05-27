import { createServerSupabase } from "./supabase-server";

export async function applyDiscounts(
  customerId: string,
  baseTotalPaise: number
): Promise<{ finalTotal: number; discountPercent: number }> {
  const supabase = createServerSupabase();

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("payment_status", "paid");

  const paidOrders = count ?? 0;
  const discountPercent = paidOrders >= 10 ? 15 : paidOrders >= 5 ? 5 : 0;
  const finalTotal = Math.round(baseTotalPaise * (1 - discountPercent / 100));

  return { finalTotal, discountPercent };
}
