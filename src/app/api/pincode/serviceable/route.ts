import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Public yes/no pincode check. Replaces browser reads of the bakers table, which exposed
// baker phone numbers and share tokens. Same rule as before: if no baker has set any
// pincodes yet, everything is allowed.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ serviceable: false });

  const { data } = await createServerSupabase().from("bakers").select("pincodes").eq("is_active", true);
  const all = (data || []).flatMap((b: { pincodes?: string[] | null }) => b.pincodes || []);
  return NextResponse.json({ serviceable: all.length === 0 || all.includes(code) });
}
