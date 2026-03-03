import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";

// Simple in-memory rate limiter for upload endpoint
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(userId);

  if (!record || record.resetAt < now) {
    uploadAttempts.set(userId, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= maxRequests) {
    return false; // rate limited
  }

  record.count++;
  return true;
}

export async function withAuth(
  req: NextRequest,
  handler: (
    req: NextRequest,
    session: { userId: string; githubToken: string; username: string; avatarUrl: string }
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(req, session);
}
