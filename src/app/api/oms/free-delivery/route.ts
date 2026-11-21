import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { normalisePhone } from "@/lib/crumbPoints";

async function isAdmin() {
  const cookieStore = await cookies();
  return verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value);
}

const MISSING_TABLE = "Could not save. Has supabase-crumb-points.sql been run?";

// OMS: the existing-customer phone list. These numbers always get free delivery.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createServerSupabase().from("free_delivery_phones").select("phone, note").order("phone");
  if (error) return NextResponse.json({ error: MISSING_TABLE }, { status: 500 });
  return NextResponse.json({ phones: data });
}

// Add numbers pasted one per line (or separated by commas). Anything that isn't a 10-digit number is skipped.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  const parts = (text || "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const phones = [...new Set(parts.map(normalisePhone).filter((p): p is string => !!p))];
  const skipped = parts.length - parts.filter((s) => normalisePhone(s)).length;
  if (phones.length === 0) return NextResponse.json({ error: "No 10-digit phone numbers found." }, { status: 400 });

  const { error } = await createServerSupabase()
    .from("free_delivery_phones")
    .upsert(phones.map((phone) => ({ phone })), { onConflict: "phone", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: MISSING_TABLE }, { status: 500 });
  return NextResponse.json({ ok: true, added: phones.length, skipped });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const phone = normalisePhone(req.nextUrl.searchParams.get("phone"));
  if (!phone) return NextResponse.json({ error: "Bad phone" }, { status: 400 });
  const { error } = await createServerSupabase().from("free_delivery_phones").delete().eq("phone", phone);
  if (error) return NextResponse.json({ error: MISSING_TABLE }, { status: 500 });
  return NextResponse.json({ ok: true });
}
