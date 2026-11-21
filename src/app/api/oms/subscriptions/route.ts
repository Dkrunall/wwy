import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";

// OMS: every Standing Order with its customer, paid-until date and next bake.
export async function GET() {
  const cookieStore = await cookies();
  if (!(await verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServerSupabase();
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("id, days, status, streak_count, streak_reward_due, carry_forward_paise, customers(name, flat_number, phone), subscription_bakes(bake_date, status, loaves)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load. Has supabase-subscriptions.sql been run?" }, { status: 500 });

  return NextResponse.json({
    subscriptions: (subs || []).map((s) => {
      const bakes = (s.subscription_bakes || []) as { bake_date: string; status: string; loaves: number }[];
      const upcoming = bakes.filter((b) => b.bake_date >= today).sort((a, b) => a.bake_date.localeCompare(b.bake_date));
      return {
        id: s.id,
        days: s.days,
        status: s.status,
        streak: s.streak_count,
        streakRewardDue: s.streak_reward_due,
        customer: s.customers,
        paidUntil: bakes.map((b) => b.bake_date).sort().pop() ?? null,
        nextBake: upcoming.find((b) => b.status !== "skipped") ?? null,
        skippedUpcoming: upcoming.filter((b) => b.status === "skipped").length,
      };
    }),
  });
}
