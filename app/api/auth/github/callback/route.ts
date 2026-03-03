import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getGitHubUser } from "@/lib/github";
import { createSession, setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || ""}/?error=oauth_denied`
    );
  }

  try {
    // Exchange code for token (token never exposed to client)
    const { access_token } = await exchangeCodeForToken(code);

    // Fetch GitHub user info
    const ghUser = await getGitHubUser(access_token);

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { githubId: String(ghUser.id) },
      update: {
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
      },
      create: {
        githubId: String(ghUser.id),
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
      },
    });

    // Create signed JWT session (token stored in JWT, never sent raw to client)
    const sessionToken = await createSession({
      userId: user.id,
      githubToken: access_token, // encrypted inside JWT via HMAC-HS256
      username: user.username,
      avatarUrl: user.avatarUrl,
    });

    const res = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || ""}/dashboard`
    );
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || ""}/?error=oauth_failed`
    );
  }
}
