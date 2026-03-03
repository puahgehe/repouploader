import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (_, session) => {
    try {
      const { id } = await params;
      const job = await prisma.uploadJob.findFirst({
        where: {
          id,
          userId: session.userId, // ensure user can only see their own jobs
        },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      let parsedLog: string[] = [];
      try {
        parsedLog = JSON.parse(job.log) as string[];
      } catch {
        parsedLog = [];
      }

      return NextResponse.json({
        job: {
          ...job,
          log: parsedLog,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch job";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  });
}
