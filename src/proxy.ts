import { NextRequest, NextResponse } from "next/server";
import { OMS_COOKIE, createSignedToken, verifyOmsToken, verifySignedToken } from "@/lib/omsAuth";

// No fallback key: if DEV_PREVIEW_KEY is unset, nobody can unlock the preview.
const DEV_KEY = process.env.DEV_PREVIEW_KEY;
const COOKIE = "wwy_dev";
const DEV_SCOPE = "dev";
const DEV_SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ── OMS auth (existing) ──────────────────────────────────────────────────
  if (pathname.startsWith("/oms") && pathname !== "/oms/login") {
    if (!(await verifyOmsToken(req.cookies.get(OMS_COOKIE)?.value))) {
      return NextResponse.redirect(new URL("/oms/login", req.url));
    }
  }

  // ── Coming-soon gate ─────────────────────────────────────────────────────

  // Lock: clears the dev cookie
  if (searchParams.get("dev") === "lock") {
    const res = NextResponse.redirect(new URL("/coming-soon", req.url));
    res.cookies.delete(COOKIE);
    return res;
  }

  // Unlock: correct key sets cookie and sends to home
  if (DEV_KEY && searchParams.get("dev") === DEV_KEY) {
    const token = await createSignedToken(DEV_SCOPE, DEV_SESSION_SECONDS);
    if (token) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: DEV_SESSION_SECONDS,
        path: "/",
      });
      return res;
    }
  }

  // Dev with valid signed cookie → full access
  if (await verifySignedToken(DEV_SCOPE, req.cookies.get(COOKIE)?.value)) {
    return NextResponse.next();
  }

  // API routes and payment page must always be reachable (webhooks, payments)
  if (pathname.startsWith("/api/") || pathname.startsWith("/pay/")) {
    return NextResponse.next();
  }

  // Everyone else → coming soon (skip the coming-soon page itself)
  if (pathname !== "/coming-soon") {
    return NextResponse.redirect(new URL("/coming-soon", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|mp4|ico)$).*)"],
};
