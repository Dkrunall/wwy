import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// WhatsApp opt-in list (P3-6, D4 option A). Stores the number and the consent timestamp (DPDP Act).
// Needs the newsletter_signups table from supabase-plan-migration.sql.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(-10) : "";

  if (body.consent !== true) {
    return NextResponse.json({ error: "Please tick the box to agree to receive WhatsApp updates." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }

  const { error } = await createServerSupabase()
    .from("newsletter_signups")
    .upsert({ phone, consent_at: new Date().toISOString(), source: "website", unsubscribed_at: null }, { onConflict: "phone" });

  if (error) {
    console.error("newsletter signup error:", error.message);
    return NextResponse.json({ error: "Couldn't save your number. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
