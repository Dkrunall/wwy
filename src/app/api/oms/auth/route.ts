import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OMS_COOKIE, OMS_SESSION_SECONDS, createOmsToken } from "@/lib/omsAuth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.OMS_ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
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
