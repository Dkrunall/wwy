import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";

// Admin-only database proxy for the OMS pages. They used to query Supabase from the browser
// with the anon key, which needed open RLS policies on every table. Now the browser sends the
// query chain here and it is replayed with the service-role key after the admin session check.

const TABLES = new Set(["orders", "order_items", "products", "coupons", "customers", "bakers", "settings", "feedbacks", "sessions"]);
const STARTERS = new Set(["select", "insert", "update", "delete", "upsert"]);
const MODIFIERS = new Set(["select", "eq", "in", "not", "order", "limit", "single", "maybeSingle"]);

type Op = { m: string; a: unknown[] };

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!(await verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value))) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const table = body?.table;
  const ops: Op[] = Array.isArray(body?.ops) ? body.ops : [];
  if (typeof table !== "string" || !TABLES.has(table) || ops.length === 0 || ops.length > 20) {
    return NextResponse.json({ error: { message: "Bad request" } }, { status: 400 });
  }
  if (!ops.every((o) => o && typeof o.m === "string" && Array.isArray(o.a))) {
    return NextResponse.json({ error: { message: "Bad request" } }, { status: 400 });
  }
  if (!STARTERS.has(ops[0].m) || !ops.slice(1).every((o) => MODIFIERS.has(o.m))) {
    return NextResponse.json({ error: { message: "Operation not allowed" } }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = createServerSupabase().from(table);
  for (const op of ops) query = query[op.m](...op.a);
  const { data, error, count } = await query;
  return NextResponse.json({ data: data ?? null, error: error ?? null, count: count ?? null });
}
