// Standing Order: a monthly prepaid subscription (client spec, rules 7-11).
// 2 flavoured sourdough loaves a week on Wed, Sat or both, paid 4 weeks (8 loaves) at a time
// through a payment link (Razorpay checkout on /subscribe). Each paid period schedules its bakes;
// once a bake's order cutoff passes, the cron turns it into an ordinary paid order for the baker.
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CUTOFF_HOUR_IST, DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";
import { calculateDeliveryDate, deliveryDateISO, isBeforeCutoff, parseDeliveryDays } from "@/lib/dateUtils";
import { BAKE_MENU } from "@/lib/menu";
import { creditBalance } from "@/lib/crumbPoints";
import { defaultBakerId } from "@/lib/baker";
import { sendSubscriptionConfirmed, sendSubscriptionRenewal } from "@/lib/email";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://wildwildyeast.com";

export type SubDays = "wed" | "sat" | "both";
export const SUB_DAYS: Record<SubDays, { days: number[]; label: string }> = {
  wed: { days: [3], label: "Wednesdays" },
  sat: { days: [6], label: "Saturdays" },
  both: { days: [3, 6], label: "Wednesdays and Saturdays" },
};
export const SUB_LOAVES_PER_WEEK = 2;
export const SUB_PERIOD_WEEKS = 4;
export const SUB_LOAVES_PER_PERIOD = SUB_LOAVES_PER_WEEK * SUB_PERIOD_WEEKS;
export const MAX_SKIPS_PER_PERIOD = 2;
export const STREAK_BAKES = 8;
export const DEFAULT_SUB_LOAF_PRICE_PAISE = 37500;
// Renewal reminder goes out this many days before the last paid bake.
const REMIND_DAYS_BEFORE = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const isSubDays = (v: unknown): v is SubDays => v === "wed" || v === "sat" || v === "both";
export const loavesPerBake = (days: SubDays) => SUB_LOAVES_PER_WEEK / SUB_DAYS[days].days.length;

export async function subSettings(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["delivery_days", "cutoff_hour_ist", "sub_loaf_price_paise"]);
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return {
    deliveryDays: map.delivery_days ? parseDeliveryDays(map.delivery_days) : DEFAULT_DELIVERY_DAYS,
    cutoffHour: map.cutoff_hour_ist ? parseInt(map.cutoff_hour_ist, 10) : DEFAULT_CUTOFF_HOUR_IST,
    loafPricePaise: parseInt(map.sub_loaf_price_paise, 10) || DEFAULT_SUB_LOAF_PRICE_PAISE,
  };
}
type Settings = Awaited<ReturnType<typeof subSettings>>;

// What a period costs: 8 loaves, less the value of bakes skipped last period.
export function periodAmount(loafPricePaise: number, carryForwardPaise: number) {
  const full = SUB_LOAVES_PER_PERIOD * loafPricePaise;
  const carryUsed = Math.min(full, Math.max(0, carryForwardPaise));
  return { amountPaise: full - carryUsed, carryUsedPaise: carryUsed };
}

// The bake dates of a 4-week period: from the first open bake (and after `afterISO`, the last
// bake already paid for) on the customer's days.
export function planBakeDates(days: SubDays, settings: Settings, afterISO?: string | null): string[] {
  const open = deliveryDateISO(calculateDeliveryDate(settings.deliveryDays, settings.cutoffHour));
  const dayAfter = afterISO ? new Date(Date.parse(afterISO + "T00:00:00Z") + DAY_MS).toISOString().slice(0, 10) : open;
  const fromISO = dayAfter > open ? dayAfter : open;
  const wanted = SUB_DAYS[days].days.filter((d) => settings.deliveryDays.includes(d));
  const start = Date.parse(fromISO + "T00:00:00Z");
  const dates: string[] = [];
  // The window opens on the first matching day and runs for 4 weeks.
  let first = -1;
  for (let i = 0; i < 7 + SUB_PERIOD_WEEKS * 7; i++) {
    const t = start + i * DAY_MS;
    if (!wanted.includes(new Date(t).getUTCDay())) continue;
    if (first < 0) first = t;
    if (t - first >= SUB_PERIOD_WEEKS * 7 * DAY_MS) break;
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

// The customer's next bake day after `afterISO`, open for orders or not.
function nextSubDay(days: SubDays, settings: Settings, afterISO: string): string {
  const wanted = SUB_DAYS[days].days.filter((d) => settings.deliveryDays.includes(d));
  let t = Date.parse(afterISO + "T00:00:00Z") + DAY_MS;
  while (!wanted.includes(new Date(t).getUTCDay())) t += DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

// Flavoured sourdoughs on a bake's menu (every sourdough except the Classic).
export function flavourOptions(iso: string): string[] {
  return (BAKE_MENU[iso] || []).filter((n) => /Sourdough$/.test(n) && n !== "Classic Sourdough");
}

// Mark a period paid and schedule its bakes. Returns the period only to the call that confirmed it,
// so the checkout and the webhook can both call this and only one sends the email.
export async function confirmPeriodPayment(supabase: SupabaseClient, razorpayOrderId: string, paymentId: string | null) {
  const { data: period } = await supabase.from("subscription_periods").select("*").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (!period || period.payment_status === "paid") return null;

  const { data: sub } = await supabase.from("subscriptions").select("*").eq("id", period.subscription_id).single();
  const settings = await subSettings(supabase);
  const { data: lastBake } = await supabase
    .from("subscription_bakes")
    .select("bake_date")
    .eq("subscription_id", sub.id)
    .order("bake_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const dates = planBakeDates(sub.days, settings, lastBake?.bake_date);
  if (dates.length === 0) throw new Error("No bake dates available for this subscription");

  // Paid after the cutoff, so bakes were missed between periods: no penalty, but the streak starts again.
  const missed = !!lastBake && nextSubDay(sub.days, settings, lastBake.bake_date) !== dates[0];

  const { data: claimed } = await supabase
    .from("subscription_periods")
    .update({
      payment_status: "paid",
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
      starts_on: dates[0],
      ends_on: dates[dates.length - 1],
    })
    .eq("id", period.id)
    .eq("payment_status", "pending")
    .select()
    .maybeSingle();
  if (!claimed) return null; // the other confirmation path got here first

  await supabase.from("subscription_bakes").upsert(
    dates.map((bake_date) => ({ subscription_id: sub.id, period_id: period.id, bake_date, loaves: loavesPerBake(sub.days) })),
    { onConflict: "subscription_id,bake_date", ignoreDuplicates: true }
  );
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      carry_forward_paise: Math.max(0, sub.carry_forward_paise - period.carry_used_paise),
      ...(missed ? { streak_count: 0 } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);
  return claimed;
}

// Skip or restore a bake before its cutoff. Skips per period are capped; the bake's value
// comes off the next payment.
export async function setBakeSkipped(supabase: SupabaseClient, customerId: string, bakeId: string, skip: boolean): Promise<string | null> {
  const { data: bake } = await supabase
    .from("subscription_bakes")
    .select("*, subscriptions!inner(id, customer_id, carry_forward_paise), subscription_periods!inner(loaf_price_paise)")
    .eq("id", bakeId)
    .maybeSingle();
  if (!bake || bake.subscriptions.customer_id !== customerId) return "Bake not found.";
  const settings = await subSettings(supabase);
  if (!isBeforeCutoff(bake.bake_date, settings.cutoffHour)) return "Orders for this bake have closed.";
  if (skip === (bake.status === "skipped")) return null;
  if (bake.status === "ordered") return "This bake is already being made.";

  if (skip) {
    const { count } = await supabase
      .from("subscription_bakes")
      .select("id", { count: "exact", head: true })
      .eq("period_id", bake.period_id)
      .eq("status", "skipped");
    if ((count ?? 0) >= MAX_SKIPS_PER_PERIOD) return `You can skip ${MAX_SKIPS_PER_PERIOD} bakes a month.`;
  }
  const value = bake.loaves * bake.subscription_periods.loaf_price_paise;
  await supabase.from("subscription_bakes").update({ status: skip ? "skipped" : "scheduled" }).eq("id", bakeId);
  await supabase
    .from("subscriptions")
    .update({
      carry_forward_paise: Math.max(0, bake.subscriptions.carry_forward_paise + (skip ? value : -value)),
      // A skip breaks the streak (restoring the bake does not bring it back).
      ...(skip ? { streak_count: 0 } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bake.subscriptions.id);
  return null;
}

function orderNumber(): string {
  return `WWY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

type Line = { product_id: string | null; product_name: string; quantity: number; unit_price_paise: number };

// Cron: turn every scheduled bake whose cutoff has passed into a paid order.
export async function createDueSubscriptionOrders(supabase: SupabaseClient): Promise<number> {
  const settings = await subSettings(supabase);
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: bakes } = await supabase
    .from("subscription_bakes")
    .select("*, subscription_periods!inner(loaf_price_paise, payment_status)")
    .eq("status", "scheduled")
    .gte("bake_date", today)
    .order("bake_date");
  const due = (bakes || []).filter((b) => b.subscription_periods.payment_status === "paid" && !isBeforeCutoff(b.bake_date, settings.cutoffHour));

  let created = 0;
  for (const bake of due) {
    // Claim the bake first so two cron runs can't both create its order.
    const { data: claimed } = await supabase
      .from("subscription_bakes")
      .update({ status: "ordered" })
      .eq("id", bake.id)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    // Read the subscription fresh: an earlier bake in this run may have moved its streak.
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("id", bake.subscription_id).single();
    const price = bake.subscription_periods.loaf_price_paise;
    const { data: customer } = await supabase.from("customers").select("id, name, flat_number").eq("id", sub.customer_id).single();
    const options = bake.flavour ? [bake.flavour] : flavourOptions(bake.bake_date);
    const names = options.length ? options : ["Flavoured Sourdough (baker's choice)"];
    const { data: products } = await supabase.from("products").select("id, name").in("name", names);
    const idOf = (n: string) => products?.find((p) => p.name === n)?.id ?? null;

    // Spread the loaves across the bake's flavours unless the customer picked one.
    const counts = new Map<string, number>();
    for (let i = 0; i < bake.loaves; i++) counts.set(names[i % names.length], (counts.get(names[i % names.length]) || 0) + 1);
    const lines: Line[] = [...counts].map(([n, q]) => ({ product_id: idOf(n), product_name: n, quantity: q, unit_price_paise: price }));
    const notes: string[] = [`Standing Order (${SUB_DAYS[sub.days as SubDays].label})`];

    // Rule 9: a balance worth a loaf becomes a free loaf on this bake.
    const balance = await creditBalance(supabase, sub.customer_id);
    const freeLoaf = balance >= price;
    if (freeLoaf) {
      lines.push({ product_id: idOf(names[0]), product_name: `${names[0]} (free, Crumb Points)`, quantity: 1, unit_price_paise: 0 });
      notes.push("Includes 1 free loaf from Crumb Points");
    }
    // Rule 11: 8 bakes in a row without a skip earns 2 Baker's Choice loaves on the next bake.
    if (sub.streak_reward_due) {
      lines.push(
        { product_id: null, product_name: "Baker's Choice, sweet (streak reward)", quantity: 1, unit_price_paise: 0 },
        { product_id: null, product_name: "Baker's Choice, savoury (streak reward)", quantity: 1, unit_price_paise: 0 }
      );
      notes.push("Streak reward: add 1 sweet and 1 savoury Baker's Choice loaf");
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        baker_id: await defaultBakerId(supabase),
        customer_id: sub.customer_id,
        flat_number: customer?.flat_number ?? "",
        customer_name: customer?.name ?? "Standing Order",
        total_paise: bake.loaves * price,
        shipping_fee_paise: 0,
        notes: notes.join(". "),
        status: "confirmed",
        payment_status: "paid",
        delivery_status: "placed",
        delivery_date: bake.bake_date,
        order_number: orderNumber(),
        source: "subscription",
      })
      .select("id")
      .single();
    if (error || !order) {
      console.error("[Subscriptions] order create failed:", error);
      await supabase.from("subscription_bakes").update({ status: "scheduled" }).eq("id", bake.id);
      continue;
    }
    await supabase.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
    await supabase.from("subscription_bakes").update({ order_id: order.id }).eq("id", bake.id);
    if (freeLoaf) {
      await supabase.from("ledger_entries").upsert(
        { customer_id: sub.customer_id, order_id: order.id, bake_date: bake.bake_date, source: "redeem", amount_paise: -price, note: "Free loaf" },
        { onConflict: "order_id,source", ignoreDuplicates: true }
      );
    }
    const streak = sub.streak_count + 1;
    await supabase
      .from("subscriptions")
      .update({
        streak_count: streak >= STREAK_BAKES ? 0 : streak,
        streak_reward_due: streak >= STREAK_BAKES,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    created++;
  }
  return created;
}

// Cron: subscriptions whose last paid bake is a week away get one renewal reminder per period.
export async function dueRenewals(supabase: SupabaseClient) {
  const { data: subs } = await supabase.from("subscriptions").select("*").eq("status", "active");
  const soon = new Date(Date.now() + REMIND_DAYS_BEFORE * DAY_MS).toISOString().slice(0, 10);
  const due: { sub: Record<string, unknown>; periodId: string; lastBake: string }[] = [];
  for (const sub of subs || []) {
    const { data: period } = await supabase
      .from("subscription_periods")
      .select("id, ends_on")
      .eq("subscription_id", sub.id)
      .eq("payment_status", "paid")
      .order("ends_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (period?.ends_on && period.ends_on <= soon && sub.reminded_period_id !== period.id) {
      due.push({ sub, periodId: period.id, lastBake: period.ends_on });
    }
  }
  return due;
}

// Email the customer the bakes a paid period covers.
export async function sendSubscriptionConfirmation(supabase: SupabaseClient, periodId: string) {
  const { data: period } = await supabase
    .from("subscription_periods")
    .select("id, amount_paise, subscriptions!inner(days, customers!inner(name, email))")
    .eq("id", periodId)
    .single();
  const sub = period?.subscriptions as unknown as { days: SubDays; customers: { name: string; email: string | null } } | undefined;
  if (!period || !sub?.customers.email) return;
  const { data: bakes } = await supabase.from("subscription_bakes").select("bake_date").eq("period_id", periodId).order("bake_date");
  await sendSubscriptionConfirmed(sub.customers.email, sub.customers.name, {
    amountPaise: period.amount_paise,
    daysLabel: SUB_DAYS[sub.days].label,
    bakeDates: (bakes || []).map((b) => b.bake_date),
    manageUrl: `${appUrl()}/subscribe`,
  }).catch(console.error);
}

// Cron: email the renewal link once per paid period, a week before its last bake.
export async function sendRenewalReminders(supabase: SupabaseClient): Promise<number> {
  const settings = await subSettings(supabase);
  let sent = 0;
  for (const { sub, periodId, lastBake } of await dueRenewals(supabase)) {
    const { data: customer } = await supabase.from("customers").select("name, email").eq("id", sub.customer_id).single();
    // Mark first so a failed email isn't retried every cron run.
    await supabase.from("subscriptions").update({ reminded_period_id: periodId }).eq("id", sub.id);
    if (!customer?.email) continue;
    const { amountPaise } = periodAmount(settings.loafPricePaise, Number(sub.carry_forward_paise) || 0);
    await sendSubscriptionRenewal(customer.email, customer.name, { amountPaise, lastBake, payUrl: `${appUrl()}/subscribe` }).catch(console.error);
    sent++;
  }
  return sent;
}
