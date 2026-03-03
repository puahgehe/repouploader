"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  GitBranch,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
};

const STEPS: Step[] = [
  { id: "upload", label: "Upload", status: "pending" },
  { id: "extract", label: "Extract", status: "pending" },
  { id: "git_init", label: "Init Git", status: "pending" },
  { id: "commit", label: "Commit", status: "pending" },
  { id: "push", label: "Push", status: "pending" },
  { id: "done", label: "Done", status: "pending" },
];

const STATUS_TO_STEP: Record<string, number> = {
  uploading: 0,
  extracting: 1,
  git_init: 2,
  committing: 3,
  pushing: 4,
  done: 5,
  error: -1,
};

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  const [repoMode, setRepoMode] = useState<"existing" | "new">("existing");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEPS.map((s) => ({ ...s })));
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Poll job status
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch("/api/repos/list");
      const data = await res.json() as { repos?: Repo[]; error?: string };
      if (data.repos) setRepos(data.repos);
    } catch {
      // silently fail
    } finally {
      setLoadingRepos(false);
    }
  };

  const updateStepFromStatus = (status: string) => {
    const activeIdx = STATUS_TO_STEP[status] ?? -1;
    setSteps((prev) =>
      prev.map((step, i) => {
        if (status === "error") {
          return {
            ...step,
            status:
              i < (activeIdx === -1 ? 0 : activeIdx)
                ? "done"
                : i === activeIdx
                ? "error"
                : "pending",
          };
        }
        return {
          ...step,
          status: i < activeIdx ? "done" : i === activeIdx ? "active" : "pending",
        };
      })
    );
  };

  const startPolling = (id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/history/${id}`);
        const data = await res.json() as { job?: { status: string; log: string[]; repoUrl?: string; errorMessage?: string } };
        if (!data.job) return;
        const { status, log, repoUrl, errorMessage } = data.job;
        updateStepFromStatus(status);
        if (log) setLogs(log);
        if (status === "done" && repoUrl) {
          setResultUrl(repoUrl);
          clearInterval(pollingRef.current!);
          setUploading(false);
        }
        if (status === "error") {
          setError(errorMessage || "Push failed");
          clearInterval(pollingRef.current!);
          setUploading(false);
        }
      } catch {
        // ignore poll errors
      }
    }, 1500);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    setLogs([]);
    setSteps(STEPS.map((s) => ({ ...s })));

    if (!file) {
      setError("Please select a .zip file");
      return;
    }

    let repoFullName = selectedRepo;

    // Create new repo if needed
    if (repoMode === "new") {
      if (!newRepoName.trim()) {
        setError("Please enter a repository name");
        return;
      }
      try {
        const res = await fetch("/api/repos/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newRepoName.trim(),
            private: newRepoPrivate,
          }),
        });
        const data = await res.json() as { repo?: { full_name: string }; error?: string };
        if (!res.ok) {
          setError(data.error || "Failed to create repository");
          return;
        }
        repoFullName = data.repo!.full_name;
        // Refresh repo list
        loadRepos();
      } catch {
        setError("Failed to create repository");
        return;
      }
    }

    if (!repoFullName) {
      setError("Please select or create a repository");
      return;
    }

    setUploading(true);
    updateStepFromStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("repoFullName", repoFullName);

    try {
      const res = await fetch("/api/upload/push", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { success?: boolean; jobId?: string; repoUrl?: string; logs?: string[]; error?: string };

      if (data.jobId) {
        setJobId(data.jobId);
        if (data.logs) setLogs(data.logs);
      }

      if (!res.ok) {
        setError(data.error || "Upload failed");
        updateStepFromStatus("error");
        setUploading(false);
        return;
      }

      if (data.success) {
        // Done immediately (sync response)
        updateStepFromStatus("done");
        setResultUrl(data.repoUrl || `https://github.com/${repoFullName}`);
        if (data.logs) setLogs(data.logs);
        setUploading(false);
      } else if (data.jobId) {
        startPolling(data.jobId);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      updateStepFromStatus("error");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Project</h1>
        <p className="text-muted-foreground mt-1">
          Upload a .zip of your project and push it to GitHub
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Select Project ZIP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Click to change
                  </Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="font-medium">Drop your .zip file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse — max {process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || 50}MB
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Repo selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Select Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={repoMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setRepoMode("existing")}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Existing Repo
              </Button>
              <Button
                type="button"
                variant={repoMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setRepoMode("new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Repo
              </Button>
            </div>

            {repoMode === "existing" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Choose a repository</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadRepos}
                    disabled={loadingRepos}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${loadingRepos ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                {loadingRepos ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading repositories...
                  </div>
                ) : (
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a repository..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          <div className="flex items-center gap-2">
                            <span>{repo.full_name}</span>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs h-4">
                                private
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedRepo && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Warning: Pushing to an existing repo will force-push to the{" "}
                      <strong>main</strong> branch and may overwrite existing
                      history.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="repoName">Repository name</Label>
                  <Input
                    id="repoName"
                    placeholder="my-awesome-project"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant={!newRepoPrivate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRepoPrivate(false)}
                  >
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={newRepoPrivate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRepoPrivate(true)}
                  >
                    Private
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Push
            </>
          )}
        </Button>
      </form>

      {/* Progress stepper */}
      {(uploading || resultUrl || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Steps */}
            <div className="flex items-center gap-1">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        step.status === "done"
                          ? "bg-green-500 text-white"
                          : step.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : step.status === "error"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.status === "active" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : step.status === "error" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mb-4 transition-colors ${
                        step.status === "done" ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Logs
                </p>
                {logs.map((log, i) => (
                  <p key={i} className="text-xs font-mono leading-relaxed">
                    {log}
                  </p>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success */}
            {resultUrl && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span className="text-green-700 dark:text-green-400">
                    Successfully pushed to GitHub!
                  </span>
                  <a
                    href={resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                  >
                    View Repo <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
