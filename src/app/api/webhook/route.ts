import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-gitlab-token");
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const event = req.headers.get("x-gitlab-event") || "";
  const projectPath = body.project?.path || "";

  revalidatePath("/", "page");
  revalidatePath("/", "layout");

  if (projectPath) {
    revalidatePath(`/repo/${projectPath}`, "page");
  }

  return NextResponse.json({
    revalidated: true,
    event,
    project: projectPath,
    timestamp: new Date().toISOString(),
  });
}
