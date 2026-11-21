// Crumb Points: one rupee credit balance per customer (client spec, 21 Nov 2026).
// Credit is only ever earned, never bought: no top-up, no cash-out, no transfers.
// The balance is the sum of ledger_entries. Earning and reversals are reconciled from the
// customer's orders whenever the balance is read, so no status-change path needs to remember them.
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";
import { parseDeliveryDays } from "@/lib/dateUtils";

// Cart totals (before discounts) that earn credit, highest first.
export const CART_TIERS = [
  { minPaise: 250000, percent: 8 },
  { minPaise: 200000, percent: 5 },
];
// Credit can pay for at most this share of the goods.
export const MAX_CREDIT_SHARE = 0.5;
// Credit expires after this many bake days without an order.
export const EXPIRY_BAKE_CYCLES = 8;
// Standing Order bakes earn this share of their value.
export const SUB_CREDIT_PERCENT = 10;

export function cartRewardPercent(subtotalPaise: number): number {
  return CART_TIERS.find((t) => subtotalPaise >= t.minPaise)?.percent ?? 0;
}

export function maxCreditFor(goodsPaise: number, balancePaise: number): number {
  return Math.max(0, Math.min(balancePaise, Math.floor(goodsPaise * MAX_CREDIT_SHARE)));
}

type LedgerOrder = {
  id: string;
  source: string | null;
  status: string | null;
  payment_status: string | null;
  delivery_status: string | null;
  delivery_date: string | null;
  credit_used_paise: number | null;
  order_items: { quantity: number; unit_price_paise: number }[] | null;
};
type Entry = { order_id: string | null; source: string; amount_paise: number; created_at: string };

const DAY_MS = 24 * 60 * 60 * 1000;

// Bake days strictly after `fromISO` up to and including today (IST).
function bakeDaysSince(fromISO: string, deliveryDays: number[]): number {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const today = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  let count = 0;
  for (let t = Date.parse(fromISO.slice(0, 10) + "T00:00:00Z") + DAY_MS; t <= today; t += DAY_MS) {
    if (deliveryDays.includes(new Date(t).getUTCDay())) count++;
  }
  return count;
}

const sum = (entries: Entry[]) => entries.reduce((s, e) => s + e.amount_paise, 0);

// Bring the ledger up to date for one customer and return the balance in paise (never below 0).
export async function creditBalance(supabase: SupabaseClient, customerId: string): Promise<number> {
  const [{ data: orderRows }, { data: entryRows }, { data: daysRow }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, source, status, payment_status, delivery_status, delivery_date, credit_used_paise, order_items(quantity, unit_price_paise)")
      .eq("customer_id", customerId),
    supabase.from("ledger_entries").select("order_id, source, amount_paise, created_at").eq("customer_id", customerId),
    supabase.from("settings").select("value").eq("key", "delivery_days").maybeSingle(),
  ]);
  const orders = (orderRows || []) as LedgerOrder[];
  const entries = (entryRows || []) as Entry[];
  const has = (orderId: string, source: string) => entries.some((e) => e.order_id === orderId && e.source === source);
  const amountOf = (orderId: string, source: string) =>
    entries.find((e) => e.order_id === orderId && e.source === source)?.amount_paise ?? 0;

  const additions: { order_id: string | null; bake_date: string | null; source: string; amount_paise: number; note?: string }[] = [];
  for (const o of orders) {
    const cancelled = o.status === "cancelled" || o.delivery_status === "cancelled";
    const paid = o.payment_status === "paid";
    // Earned only once the order is both delivered and paid. One percentage per order:
    // a Standing Order bake earns the sub rate or the cart tier, whichever is higher.
    const isSub = o.source === "subscription";
    const earnSource = isSub ? "sub" : "cart_tier";
    if (!cancelled && paid && o.delivery_status === "delivered" && !has(o.id, earnSource)) {
      const subtotal = (o.order_items || []).reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
      const percent = Math.max(cartRewardPercent(subtotal), isSub ? SUB_CREDIT_PERCENT : 0);
      const earned = Math.floor((subtotal * percent) / 100);
      if (earned > 0) additions.push({ order_id: o.id, bake_date: o.delivery_date, source: earnSource, amount_paise: earned });
    }
    // A cancelled (refunded) order gives back the credit it spent and loses the credit it earned.
    if (cancelled && has(o.id, "redeem") && !has(o.id, "redeem_return")) {
      additions.push({ order_id: o.id, bake_date: o.delivery_date, source: "redeem_return", amount_paise: -amountOf(o.id, "redeem") });
    }
    if (cancelled && has(o.id, earnSource) && !has(o.id, "earn_reversal")) {
      additions.push({ order_id: o.id, bake_date: o.delivery_date, source: "earn_reversal", amount_paise: -amountOf(o.id, earnSource) });
    }
  }
  if (additions.length > 0) {
    const rows = additions.map((a) => ({ ...a, customer_id: customerId }));
    // The unique (order_id, source) index makes a concurrent duplicate a no-op.
    await supabase.from("ledger_entries").upsert(rows, { onConflict: "order_id,source", ignoreDuplicates: true });
  }

  let balance = sum(entries) + additions.reduce((s, a) => s + a.amount_paise, 0);

  // Expiry: no paid order for EXPIRY_BAKE_CYCLES bake days.
  if (balance > 0) {
    const lastOrder = orders
      .filter((o) => o.payment_status === "paid")
      .map((o) => o.delivery_date)
      .filter((d): d is string => !!d)
      .sort()
      .pop();
    const lastGrant = entries.filter((e) => e.source === "adjustment" && e.amount_paise > 0).map((e) => e.created_at).sort().pop();
    const lastActivity = [lastOrder, lastGrant?.slice(0, 10)].filter((d): d is string => !!d).sort().pop();
    const deliveryDays = daysRow?.value ? parseDeliveryDays(daysRow.value) : DEFAULT_DELIVERY_DAYS;
    if (lastActivity && bakeDaysSince(lastActivity, deliveryDays) >= EXPIRY_BAKE_CYCLES) {
      await supabase.from("ledger_entries").insert({
        customer_id: customerId,
        source: "expiry",
        amount_paise: -balance,
        note: `No order for ${EXPIRY_BAKE_CYCLES} bakes since ${lastActivity}`,
      });
      balance = 0;
    }
  }
  return Math.max(0, balance);
}

// Credit set aside by the customer's other unpaid checkouts from the last half hour,
// so two open payment windows cannot spend the same balance.
export async function reservedCredit(supabase: SupabaseClient, customerId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("credit_used_paise")
    .eq("customer_id", customerId)
    .eq("payment_status", "pending")
    .gte("created_at", since);
  return (data || []).reduce((s, o) => s + (o.credit_used_paise || 0), 0);
}

// Called once payment is confirmed: records the credit the order spent.
export async function redeemOrderCredit(
  supabase: SupabaseClient,
  order: { id: string; customer_id: string | null; delivery_date: string | null; credit_used_paise?: number | null }
): Promise<void> {
  if (!order.customer_id || !order.credit_used_paise) return;
  await supabase.from("ledger_entries").upsert(
    { customer_id: order.customer_id, order_id: order.id, bake_date: order.delivery_date, source: "redeem", amount_paise: -order.credit_used_paise },
    { onConflict: "order_id,source", ignoreDuplicates: true }
  );
}

// Free delivery for phone numbers on the existing-customer list.
export function normalisePhone(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function hasFreeDelivery(supabase: SupabaseClient, phone: string | null | undefined): Promise<boolean> {
  const p = normalisePhone(phone);
  if (!p) return false;
  const { data } = await supabase.from("free_delivery_phones").select("phone").eq("phone", p).maybeSingle();
  return !!data;
}
