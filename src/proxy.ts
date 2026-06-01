import { NextRequest, NextResponse } from "next/server";

const DEV_KEY = process.env.DEV_PREVIEW_KEY ?? "wwy2026";
const COOKIE = "wwy_dev";

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ── OMS auth (existing) ──────────────────────────────────────────────────
  if (pathname.startsWith("/oms") && pathname !== "/oms/login") {
    const auth = req.cookies.get("oms_auth");
    if (auth?.value !== "1") {
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
  if (searchParams.get("dev") === DEV_KEY) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set(COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  }

  // Dev with valid cookie → full access
  if (req.cookies.get(COOKIE)?.value === "1") {
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
