import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ valid: false, error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    const result = data?.[0];
    const postOffice = result?.Status === "Success" ? result.PostOffice?.[0] : null;

    if (!postOffice) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      area: (postOffice.Name || "").replace(/\s+(S\.O|B\.O|H\.O)$/i, ""),
      district: postOffice.District || "",
      state: postOffice.State || "",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Lookup failed" }, { status: 502 });
  }
}
