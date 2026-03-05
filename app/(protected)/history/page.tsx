import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Upload } from "lucide-react";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) return null;

  const jobs = await prisma.uploadJob.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload History</h1>
          <p className="text-muted-foreground mt-1">
            {jobs.length} upload{jobs.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            New Upload
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No uploads yet</h3>
            <p className="text-muted-foreground mb-4">
              Your upload history will appear here
            </p>
            <Link href="/upload">
              <Button>Upload Your First Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Finished</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: { id: string; repoFullName: string; repoUrl: string; status: string; createdAt: Date; finishedAt: Date | null; errorMessage: string | null; log: string }) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.repoFullName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(job.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {job.finishedAt
                        ? new Date(job.finishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/history/${job.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                        {job.status === "done" && job.repoUrl && (
                          <a
                            href={job.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
