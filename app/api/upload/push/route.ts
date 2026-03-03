import { NextRequest, NextResponse } from "next/server";
import { withAuth, rateLimit } from "@/lib/middleware";
import { validateUpload, extractZip, ensureGitignore, cleanupDir } from "@/lib/zip";
import { initAndPush } from "@/lib/git";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type UploadStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "git_init"
  | "committing"
  | "pushing"
  | "done"
  | "error";

export async function POST(req: NextRequest) {
  return withAuth(req, async (_, session) => {
    // Rate limit: 5 uploads per minute per user
    if (!rateLimit(session.userId, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait a minute." },
        { status: 429 }
      );
    }

    let jobId: string | null = null;
    let tempDir: string | null = null;

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
    };

    const updateJob = async (status: UploadStatus, extra?: { errorMessage?: string; finishedAt?: Date; repoUrl?: string }) => {
      if (!jobId) return;
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          status,
          log: JSON.stringify(logs),
          ...extra,
        },
      });
    };

    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const repoFullName = formData.get("repoFullName") as string | null;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      if (!repoFullName || !repoFullName.includes("/")) {
        return NextResponse.json(
          { error: "Invalid repository name (expected owner/repo)" },
          { status: 400 }
        );
      }

      // Validate file
      const validation = validateUpload(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const [repoOwner, repoName] = repoFullName.split("/");

      // Create job record
      const job = await prisma.uploadJob.create({
        data: {
          userId: session.userId,
          repoFullName,
          repoUrl: `https://github.com/${repoFullName}`,
          status: "uploading",
          log: JSON.stringify([]),
        },
      });
      jobId = job.id;

      addLog(`Job started for ${repoFullName}`);
      addLog(`File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      await updateJob("uploading");

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract
      addLog("Extracting zip file...");
      await updateJob("extracting");

      tempDir = await extractZip(buffer, addLog);

      // Ensure .gitignore
      ensureGitignore(tempDir);
      addLog("Ensured .gitignore exists");

      // Git init + commit + push
      addLog("Initializing git...");
      await updateJob("git_init");

      await initAndPush({
        dir: tempDir,
        repoOwner,
        repoName,
        token: session.githubToken,
        authorName: session.username,
        authorEmail: `${session.username}@users.noreply.github.com`,
        onLog: addLog,
      });

      // Done
      await updateJob("done", {
        finishedAt: new Date(),
        repoUrl: `https://github.com/${repoFullName}`,
      });

      return NextResponse.json({
        success: true,
        jobId,
        repoUrl: `https://github.com/${repoFullName}`,
        logs,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      // Don't log the error message directly as it might contain token info
      const safeErrorMsg = errorMsg
        .replace(/x-access-token:[^@]+@/g, "x-access-token:***@")
        .replace(/ghp_[a-zA-Z0-9]+/g, "***");

      addLog(`Error: ${safeErrorMsg}`);
      if (jobId) {
        await updateJob("error", {
          errorMessage: safeErrorMsg,
          finishedAt: new Date(),
        }).catch(() => {});
      }

      return NextResponse.json(
        { error: safeErrorMsg, jobId },
        { status: 500 }
      );
    } finally {
      // Cleanup temp directory regardless of success/failure
      if (tempDir) {
        cleanupDir(tempDir);
      }
    }
  });
}
