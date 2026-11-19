import { NextRequest, NextResponse } from "next/server";
import { isFreeDeliveryPincode, isMumbaiPincode } from "@/lib/pincodes";

// Public pincode check: we deliver within Mumbai; Colaba to Kandivali is free from ₹300.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  return NextResponse.json({ serviceable: isMumbaiPincode(code), free: isFreeDeliveryPincode(code) });
}
