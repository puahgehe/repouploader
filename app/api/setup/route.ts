import { NextRequest, NextResponse } from "next/server";
import { saveGitHubOAuthConfig, isOAuthConfigured } from "@/lib/settings";

export const runtime = "nodejs";

// GET /api/setup - Check if OAuth is configured
export async function GET() {
  try {
    const configured = await isOAuthConfigured();
    return NextResponse.json({ configured });
  } catch {
    // If database table doesn't exist yet, treat as not configured
    return NextResponse.json({ configured: false });
  }
}

// POST /api/setup - Save OAuth credentials
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };

    const { clientId, clientSecret, callbackUrl } = body;

    // Validate required fields
    if (!clientId || !clientSecret || !callbackUrl) {
      return NextResponse.json(
        { error: "All fields are required: clientId, clientSecret, callbackUrl" },
        { status: 400 }
      );
    }

    // Basic validation
    if (clientId.length < 10) {
      return NextResponse.json(
        { error: "Client ID seems too short. Please check your GitHub OAuth App settings." },
        { status: 400 }
      );
    }

    if (clientSecret.length < 10) {
      return NextResponse.json(
        { error: "Client Secret seems too short. Please check your GitHub OAuth App settings." },
        { status: 400 }
      );
    }

    try {
      new URL(callbackUrl);
    } catch {
      return NextResponse.json(
        { error: "Callback URL must be a valid URL." },
        { status: 400 }
      );
    }

    if (!callbackUrl.endsWith("/api/auth/github/callback")) {
      return NextResponse.json(
        { error: "Callback URL must end with /api/auth/github/callback" },
        { status: 400 }
      );
    }

    // Save to database
    await saveGitHubOAuthConfig({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      callbackUrl: callbackUrl.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Failed to save configuration. Make sure the database is migrated." },
      { status: 500 }
    );
  }
}
