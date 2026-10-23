import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const path = body.path || "/";

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const referer = req.headers.get("referer") || "direct";
  const country = req.headers.get("x-vercel-ip-country") || "";
  const city = req.headers.get("x-vercel-ip-city") || "";

  await trackPageView({
    path,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    referer,
    country,
    city,
  });

  return NextResponse.json({ ok: true });
}
