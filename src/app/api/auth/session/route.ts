import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

const ALLOWED_DOMAINS = ["globe.com.ph", "gsupport.com.ph"];

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const domain = decoded.email?.split("@")[1];

    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ status: "ok" });
}
