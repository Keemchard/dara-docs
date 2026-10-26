import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, createSessionCookie } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

const ALLOWED_DOMAINS = ["globe.com.ph", "gsupport.com.ph"];

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  try {
    const payload = await verifyFirebaseToken(idToken);
    const email = payload.email as string | undefined;
    const domain = email?.split("@")[1];

    if (!email || !domain || !ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });
    }

    const sessionCookie = await createSessionCookie(email);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Session creation failed:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ status: "ok" });
}
