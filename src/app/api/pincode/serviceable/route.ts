import { NextRequest, NextResponse } from "next/server";
import { isMumbaiPincode } from "@/lib/pincodes";

// Public pincode check: we deliver within Mumbai.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  return NextResponse.json({ serviceable: isMumbaiPincode(code) });
}
