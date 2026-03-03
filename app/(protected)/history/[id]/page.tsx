import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, ExternalLink, GitBranch, Clock } from "lucide-react";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;

  const job = await prisma.uploadJob.findFirst({
    where: { id, userId: session.userId },
  });

  if (!job) notFound();

  let logs: string[] = [];
  try {
    logs = JSON.parse(job.log) as string[];
  } catch {
    logs = [];
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/history">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">{job.id}</p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Repository</p>
              <div className="flex items-center gap-2 mt-1">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{job.repoFullName}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={job.status} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(job.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            {job.finishedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Finished</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(job.finishedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {job.status === "done" && job.repoUrl && (
            <a href={job.repoUrl} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
          )}

          {job.errorMessage && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Error</p>
              <p className="font-mono">{job.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs available</p>
          ) : (
            <div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <p key={i} className="text-xs font-mono leading-relaxed py-0.5">
                  <span className="text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {log}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
