import { NextResponse } from "next/server";

const GITHUB_SCOPES = "repo,user:email,read:user";
// Scope explanation:
//   repo          - full access to public/private repos (create, push, read)
//   user:email    - read user's email for git commit authoring
//   read:user     - read basic profile (avatar, username)

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.GITHUB_CALLBACK_URL || "",
    scope: GITHUB_SCOPES,
    state: crypto.randomUUID(), // CSRF protection (simple stateless)
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
