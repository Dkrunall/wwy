import { NextRequest, NextResponse } from "next/server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname !== "/oms/login") {
    if (!(await verifyOmsToken(req.cookies.get(OMS_COOKIE)?.value))) {
      return NextResponse.redirect(new URL("/oms/login", req.url));
    }
  }

  return NextResponse.next();
}

// API routes do their own auth.
export const config = {
  matcher: ["/oms", "/oms/:path*"],
};
