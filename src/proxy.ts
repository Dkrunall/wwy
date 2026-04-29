import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/oms") && pathname !== "/oms/login") {
    const auth = req.cookies.get("oms_auth");
    if (!auth?.value) {
      return NextResponse.redirect(new URL("/oms/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/oms/:path*"],
};
