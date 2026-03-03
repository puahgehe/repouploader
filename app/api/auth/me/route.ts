import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  // Only return safe fields - NEVER return githubToken
  return NextResponse.json({
    user: {
      userId: session.userId,
      username: session.username,
      avatarUrl: session.avatarUrl,
    },
  });
}
