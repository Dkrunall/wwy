import type { createServerSupabase } from "./supabase-server";

type Supabase = ReturnType<typeof createServerSupabase>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// The customer who placed an order. Uses the order's customer_id; flat numbers are not unique
// (two buildings can both have a 4B), so the flat is only a fallback when it matches exactly one customer.
export async function customerOfOrder(
  supabase: Supabase,
  order: { customer_id?: string | null; flat_number: string },
  columns = "*"
): Promise<Row | null> {
  if (order.customer_id) {
    const { data } = await supabase.from("customers").select(columns).eq("id", order.customer_id).maybeSingle();
    if (data) return data as Row;
  }
  const { data } = await supabase.from("customers").select(columns).eq("flat_number", order.flat_number).limit(2);
  return data && data.length === 1 ? (data[0] as Row) : null;
}
