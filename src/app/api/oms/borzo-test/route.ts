import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";
import { defaultBakerId } from "@/lib/baker";
import { quoteBorzoDelivery } from "@/lib/borzo";

// OMS: check the Borzo key with a price quote from the default baker to a sample Mumbai address.
export async function POST() {
  const cookieStore = await cookies();
  if (!(await verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServerSupabase();
  const bakerId = await defaultBakerId(supabase);
  const { data: baker } = bakerId
    ? await supabase.from("bakers").select("name, address").eq("id", bakerId).maybeSingle()
    : { data: null };
  const pickup = baker?.address || "Lower Parel, Mumbai, Maharashtra 400013";
  const result = await quoteBorzoDelivery(pickup, "Hill Road, Bandra West, Mumbai, Maharashtra 400050");
  return NextResponse.json({
    ...result,
    pickup: baker?.address ? `${baker.name}'s address` : "a sample address (no baker address set)",
  });
}
