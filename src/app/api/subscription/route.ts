import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSessionCustomer } from "@/lib/customerSession";
import { getRazorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { isBeforeCutoff } from "@/lib/dateUtils";
import { isPincodeServiceable } from "@/lib/baker";
import {
  MAX_SKIPS_PER_PERIOD,
  SUB_LOAVES_PER_PERIOD,
  confirmPeriodPayment,
  flavourOptions,
  isSubDays,
  periodAmount,
  sendSubscriptionConfirmation,
  setBakeSkipped,
  subSettings,
} from "@/lib/subscriptions";

const NOT_READY = "Standing Orders aren't open yet. Please try again soon.";

// The signed-in customer's Standing Order: plan, upcoming bakes and what the next payment costs.
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const customer = await getSessionCustomer(req, supabase);
  if (!customer) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const settings = await subSettings(supabase);
  const { data: sub, error } = await supabase.from("subscriptions").select("*").eq("customer_id", customer.id).maybeSingle();
  if (error) return NextResponse.json({ error: NOT_READY }, { status: 503 });

  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: bakes } = sub
    ? await supabase
        .from("subscription_bakes")
        .select("id, period_id, bake_date, loaves, flavour, status")
        .eq("subscription_id", sub.id)
        .gte("bake_date", today)
        .order("bake_date")
    : { data: [] };
  const skipsByPeriod = new Map<string, number>();
  for (const b of bakes || []) if (b.status === "skipped") skipsByPeriod.set(b.period_id, (skipsByPeriod.get(b.period_id) || 0) + 1);

  const { amountPaise, carryUsedPaise } = periodAmount(settings.loafPricePaise, sub?.carry_forward_paise ?? 0);
  const lastBake = bakes?.length ? bakes[bakes.length - 1].bake_date : null;
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return NextResponse.json({
    loafPricePaise: settings.loafPricePaise,
    loavesPerPeriod: SUB_LOAVES_PER_PERIOD,
    subscription: sub
      ? { days: sub.days, status: sub.status, streakCount: sub.streak_count, streakRewardDue: sub.streak_reward_due }
      : null,
    bakes: (bakes || []).map((b) => ({
      id: b.id,
      date: b.bake_date,
      loaves: b.loaves,
      flavour: b.flavour,
      status: b.status,
      options: flavourOptions(b.bake_date),
      open: b.status !== "ordered" && isBeforeCutoff(b.bake_date, settings.cutoffHour),
      skipsLeft: MAX_SKIPS_PER_PERIOD - (skipsByPeriod.get(b.period_id) || 0),
    })),
    nextPayment: { amountPaise, carryUsedPaise, due: !!sub && sub.status !== "cancelled" && (!lastBake || lastBake <= weekAhead) },
  });
}

type Body = {
  action?: string;
  days?: string;
  bakeId?: string;
  flavour?: string | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const customer = await getSessionCustomer(req, supabase);
  if (!customer) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Body;

  const { data: sub, error: subErr } = await supabase.from("subscriptions").select("*").eq("customer_id", customer.id).maybeSingle();
  if (subErr) return NextResponse.json({ error: NOT_READY }, { status: 503 });
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  switch (body.action) {
    // Start (or restart) a Standing Order and open checkout for the first four weeks.
    case "start":
    case "pay": {
      if (!(await isPincodeServiceable(supabase, customer.pincode))) {
        return fail("We deliver within Mumbai only. Please update your address to a Mumbai pincode.");
      }
      let current = sub;
      if (body.action === "start") {
        if (!isSubDays(body.days)) return fail("Choose Wednesday, Saturday or both.");
        const { data, error } = await supabase
          .from("subscriptions")
          .upsert({ customer_id: customer.id, days: body.days, status: sub?.status === "active" ? "active" : "pending", updated_at: new Date().toISOString() }, { onConflict: "customer_id" })
          .select()
          .single();
        if (error || !data) return fail(NOT_READY, 503);
        current = data;
      }
      if (!current) return fail("Start a Standing Order first.");

      const settings = await subSettings(supabase);
      const { amountPaise, carryUsedPaise } = periodAmount(settings.loafPricePaise, current.carry_forward_paise);
      const rzpOrder = await getRazorpay().orders.create({
        amount: amountPaise,
        currency: "INR",
        notes: { customer_id: customer.id, subscription_id: current.id, kind: "standing_order" },
      });
      // Earlier unpaid attempts stay: a payment finishing in another tab must still be found.
      const { error } = await supabase.from("subscription_periods").insert({
        subscription_id: current.id,
        amount_paise: amountPaise,
        loaf_price_paise: settings.loafPricePaise,
        carry_used_paise: carryUsedPaise,
        razorpay_order_id: rzpOrder.id,
      });
      if (error) return fail(NOT_READY, 503);
      return NextResponse.json({ razorpayOrderId: rzpOrder.id, amount: amountPaise, keyId: process.env.RAZORPAY_KEY_ID });
    }

    case "verify": {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        return fail("Invalid payment signature");
      }
      if (!sub) return fail("Subscription not found", 404);
      const { data: period } = await supabase.from("subscription_periods").select("subscription_id").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
      if (!period || period.subscription_id !== sub.id) return fail("Payment not found", 404);
      const paid = await confirmPeriodPayment(supabase, razorpayOrderId, razorpayPaymentId);
      if (paid) await sendSubscriptionConfirmation(supabase, paid.id);
      return NextResponse.json({ ok: true });
    }

    case "skip":
    case "unskip": {
      if (!body.bakeId) return fail("Missing bake");
      const error = await setBakeSkipped(supabase, customer.id, body.bakeId, body.action === "skip");
      return error ? fail(error) : NextResponse.json({ ok: true });
    }

    // Pick a flavour for one bake, or null for baker's choice.
    case "flavour": {
      if (!sub || !body.bakeId) return fail("Missing bake");
      const { data: bake } = await supabase.from("subscription_bakes").select("bake_date, status").eq("id", body.bakeId).eq("subscription_id", sub.id).maybeSingle();
      if (!bake) return fail("Bake not found.", 404);
      const settings = await subSettings(supabase);
      if (bake.status === "ordered" || !isBeforeCutoff(bake.bake_date, settings.cutoffHour)) return fail("Orders for this bake have closed.");
      const flavour = body.flavour ?? null;
      if (flavour !== null && !flavourOptions(bake.bake_date).includes(flavour)) return fail("That flavour isn't baked that day.");
      await supabase.from("subscription_bakes").update({ flavour }).eq("id", body.bakeId);
      return NextResponse.json({ ok: true });
    }

    // New days apply from the next payment; bakes already paid for stay as they are.
    case "days": {
      if (!sub) return fail("Start a Standing Order first.");
      if (!isSubDays(body.days)) return fail("Choose Wednesday, Saturday or both.");
      await supabase.from("subscriptions").update({ days: body.days, updated_at: new Date().toISOString() }).eq("id", sub.id);
      return NextResponse.json({ ok: true });
    }

    // Stop renewing. Bakes already paid for are still delivered.
    case "cancel":
    case "resume": {
      if (!sub) return fail("No Standing Order.");
      const status = body.action === "cancel" ? "cancelled" : "active";
      await supabase.from("subscriptions").update({ status, updated_at: new Date().toISOString() }).eq("id", sub.id);
      return NextResponse.json({ ok: true });
    }
  }
  return fail("Unknown action");
}
