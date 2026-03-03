import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { listUserRepos } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_, session) => {
    try {
      const repos = await listUserRepos(session.githubToken);
      return NextResponse.json({ repos });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to list repos";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  });
}
