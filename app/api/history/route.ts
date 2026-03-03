import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_, session) => {
    try {
      const jobs = await prisma.uploadJob.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          repoFullName: true,
          repoUrl: true,
          status: true,
          createdAt: true,
          finishedAt: true,
          errorMessage: true,
        },
      });

      return NextResponse.json({ jobs });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch history";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  });
}
