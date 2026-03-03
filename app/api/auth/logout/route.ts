import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
