import { NextResponse } from "next/server";
import { getGitHubOAuthConfig } from "@/lib/settings";

const GITHUB_SCOPES = "repo,user:email,read:user";
// Scope explanation:
//   repo          - full access to public/private repos (create, push, read)
//   user:email    - read user's email for git commit authoring
//   read:user     - read basic profile (avatar, username)

export const runtime = "nodejs";

export async function GET() {
  const config = await getGitHubOAuthConfig();
  if (!config) {
    // OAuth not configured, redirect to setup page
    return NextResponse.redirect(new URL("/setup", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: GITHUB_SCOPES,
    state: crypto.randomUUID(), // CSRF protection (simple stateless)
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
