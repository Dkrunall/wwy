import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { creditBalance } from "@/lib/crumbPoints";

async function isAdmin() {
  const cookieStore = await cookies();
  return verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value);
}

// OMS: a customer's Crumb Points balance and history.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  const supabase = createServerSupabase();
  const balancePaise = await creditBalance(supabase, customerId);
  const { data: entries, error } = await supabase
    .from("ledger_entries")
    .select("source, amount_paise, note, created_at, orders(order_number)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: "Could not load. Has supabase-crumb-points.sql been run?" }, { status: 500 });
  return NextResponse.json({ balancePaise, entries });
}

// OMS: add or remove credit by hand (goodwill, corrections). Credit is never sold.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { customerId, amountPaise, note } = (await req.json().catch(() => ({}))) as { customerId?: string; amountPaise?: number; note?: string };
  if (!customerId || !Number.isInteger(amountPaise) || amountPaise === 0 || Math.abs(amountPaise!) > 1000000) {
    return NextResponse.json({ error: "Enter a whole rupee amount (up to ₹10,000)." }, { status: 400 });
  }
  if (!note?.trim()) return NextResponse.json({ error: "Add a reason." }, { status: 400 });

  const supabase = createServerSupabase();
  const balancePaise = await creditBalance(supabase, customerId);
  if (balancePaise + amountPaise! < 0) return NextResponse.json({ error: "That would take the balance below zero." }, { status: 400 });

  const { error } = await supabase
    .from("ledger_entries")
    .insert({ customer_id: customerId, source: "adjustment", amount_paise: amountPaise, note: note.trim().slice(0, 200) });
  if (error) return NextResponse.json({ error: "Could not save. Has supabase-crumb-points.sql been run?" }, { status: 500 });
  return NextResponse.json({ ok: true, balancePaise: balancePaise + amountPaise! });
}
