import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { createRepo } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withAuth(req, async (_, session) => {
    try {
      const body = await req.json() as { name?: string; private?: boolean; description?: string };
      const { name, private: isPrivate = false, description } = body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Repository name is required" },
          { status: 400 }
        );
      }

      // Validate repo name (GitHub rules)
      if (!/^[a-zA-Z0-9._-]+$/.test(name.trim())) {
        return NextResponse.json(
          {
            error:
              "Invalid repository name. Use only letters, numbers, hyphens, underscores, and periods.",
          },
          { status: 400 }
        );
      }

      const repo = await createRepo(
        session.githubToken,
        name.trim(),
        isPrivate,
        description
      );

      return NextResponse.json({ repo }, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create repo";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  });
}
