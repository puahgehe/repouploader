"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Settings, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyConfigured, setAlreadyConfigured] = useState(false);

  useEffect(() => {
    // Auto-fill callback URL based on current origin
    setCallbackUrl(`${window.location.origin}/api/auth/github/callback`);

    // Check if already configured
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data: { configured: boolean }) => {
        setAlreadyConfigured(data.configured);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          callbackUrl: callbackUrl.trim(),
        }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error || "Failed to save configuration");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GitBranch className="w-5 h-5 text-primary" />
            <span>GitPush</span>
          </div>
          <Badge variant="outline">
            <Settings className="w-3 h-3 mr-1" />
            Setup
          </Badge>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Initial Setup</h1>
          <p className="text-muted-foreground mt-2">
            Configure your GitHub OAuth App to enable login.
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to get GitHub OAuth credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  GitHub Developer Settings
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Click <strong>New OAuth App</strong></li>
              <li>
                Fill in:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>
                    <strong>Application name:</strong> anything (e.g. &quot;GitPush&quot;)
                  </li>
                  <li>
                    <strong>Homepage URL:</strong>{" "}
                    <code className="bg-muted px-1 rounded">{typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}</code>
                  </li>
                  <li>
                    <strong>Authorization callback URL:</strong>{" "}
                    <code className="bg-muted px-1 rounded">{callbackUrl || "http://localhost:3000/api/auth/github/callback"}</code>
                  </li>
                </ul>
              </li>
              <li>Click <strong>Register application</strong></li>
              <li>Copy the <strong>Client ID</strong> and generate a <strong>Client Secret</strong></li>
              <li>Paste them below</li>
            </ol>
          </CardContent>
        </Card>

        {/* Already configured notice */}
        {alreadyConfigured && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              GitHub OAuth is already configured. Submitting this form will
              overwrite the existing credentials.
            </p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>Configuration saved! Redirecting to login...</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GitHub OAuth Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Ov23li..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Your client secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callbackUrl">Authorization Callback URL</Label>
                <Input
                  id="callbackUrl"
                  type="url"
                  placeholder="http://localhost:3000/api/auth/github/callback"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must match exactly what you entered in your GitHub OAuth App settings.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || success}>
                {loading ? "Saving..." : success ? "Saved!" : "Save & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
