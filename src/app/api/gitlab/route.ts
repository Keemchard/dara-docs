import { NextRequest, NextResponse } from "next/server";

const GITLAB_BASE = process.env.GITLAB_BASE_URL || "https://gitlab.com";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const customPat = req.headers.get("x-gitlab-pat");
  const token = customPat || process.env.GITLAB_PAT || "";

  const res = await fetch(`${GITLAB_BASE}/api/v4${path}`, {
    headers: { "PRIVATE-TOKEN": token },
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}
