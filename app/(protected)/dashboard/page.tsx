import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Upload, GitBranch, History, ExternalLink, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch recent jobs
  const recentJobs = await prisma.uploadJob.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalJobs = await prisma.uploadJob.count({
    where: { userId: session.userId },
  });

  const doneJobs = await prisma.uploadJob.count({
    where: { userId: session.userId, status: "done" },
  });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.username}
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a project or manage your repositories.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Pushes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{doneJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GitHub Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`https://github.com/${session.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              @{session.username}
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/upload">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <Upload className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Upload Project</h3>
              <p className="text-sm text-muted-foreground">
                Upload a .zip and push to GitHub in one click
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/history">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <History className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">View History</h3>
              <p className="text-sm text-muted-foreground">
                Check status and logs of past uploads
              </p>
            </CardContent>
          </Card>
        </Link>
        <a
          href={`https://github.com/${session.username}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <GitBranch className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Browse Repos</h3>
              <p className="text-sm text-muted-foreground">
                View all your GitHub repositories
              </p>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Recent uploads */}
      {recentJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Uploads</h2>
            <Link href="/history">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.repoFullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={job.status} />
                    {job.status === "done" && (
                      <a
                        href={job.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recentJobs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No uploads yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first project to get started
            </p>
            <Link href="/upload">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
