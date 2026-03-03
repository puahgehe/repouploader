"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Shield,
  LogOut,
  ExternalLink,
  Info,
  AlertTriangle,
} from "lucide-react";

interface SettingsPageClientProps {
  username: string;
  avatarUrl: string;
  maxUploadMb: string;
}

export default function SettingsPageClient({
  username,
  avatarUrl,
  maxUploadMb,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const scopes = [
    {
      scope: "repo",
      reason:
        "Required to create repositories and push code to both public and private repos",
    },
    {
      scope: "user:email",
      reason: "Used as the git commit author email for the initial commit",
    },
    {
      scope: "read:user",
      reason: "Reads your GitHub username and avatar for the dashboard",
    },
  ];

  const securityItems = [
    "GitHub token stored in httpOnly cookie — inaccessible to JavaScript",
    "Token is signed inside a JWT (HS256) and never returned raw to the browser",
    "Temp files are deleted immediately after each push job completes",
    "Zip extraction validates all paths to prevent directory traversal attacks",
    "Push uses HTTPS token auth, not SSH keys — no keys stored on server",
    "Rate limit: max 5 uploads per minute per account",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Account and application configuration
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">@{username}</p>
              <p className="text-sm text-muted-foreground">
                Connected via GitHub OAuth
              </p>
            </div>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                GitHub Profile
              </Button>
            </a>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Clears your session cookie
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OAuth scopes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            OAuth Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            GitPush requested the following GitHub OAuth scopes:
          </p>
          {scopes.map(({ scope, reason }) => (
            <div key={scope} className="flex items-start gap-3">
              <Badge variant="outline" className="font-mono text-xs mt-0.5 shrink-0">
                {scope}
              </Badge>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          ))}
          <Alert className="mt-3">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              To revoke access, visit{" "}
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                github.com/settings/applications
              </a>{" "}
              and revoke &quot;GitPush&quot;.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm">Maximum file size</p>
            <Badge variant="secondary">{maxUploadMb} MB</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <p className="text-sm">Allowed file types</p>
            <Badge variant="secondary">.zip only</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <p className="text-sm">Rate limit</p>
            <Badge variant="secondary">5 uploads / minute</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Security Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {securityItems.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
