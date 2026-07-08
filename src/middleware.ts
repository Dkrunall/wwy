import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("oms_auth")?.value;
  if (auth !== "1") {
    return NextResponse.redirect(new URL("/oms/login", req.url));
  }
  return NextResponse.next();
}

// Only protect the OMS dashboard page — not the login page or API routes
export const config = {
  matcher: ["/oms"],
};
