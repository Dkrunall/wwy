import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { OMS_COOKIE, OMS_SESSION_SECONDS, createOmsToken } from "@/lib/omsAuth";

function samePassword(given: unknown, expected: string): boolean {
  if (typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  const adminPassword = process.env.OMS_ADMIN_PASSWORD;

  if (!adminPassword || !samePassword(password, adminPassword)) {
    // Slow down password guessing.
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await createOmsToken();
  if (!token) {
    console.error("OMS_SESSION_SECRET is not set; cannot create admin session");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(OMS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OMS_SESSION_SECONDS,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(OMS_COOKIE);
  return NextResponse.json({ ok: true });
}
