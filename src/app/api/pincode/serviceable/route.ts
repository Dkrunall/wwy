import { NextRequest, NextResponse } from "next/server";

// Public yes/no pincode check. We take orders for every valid pincode; delivery charges may apply.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  return NextResponse.json({ serviceable: /^\d{6}$/.test(code) });
}
