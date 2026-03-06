import { prisma } from "@/lib/prisma";

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

/**
 * Get a single app setting by key.
 * Falls back to environment variable if not found in database.
 */
async function getSetting(key: string, envFallback?: string): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (row?.value) return row.value;
  } catch {
    // Table may not exist yet (before migration), fall through to env
  }
  return envFallback ?? null;
}

/**
 * Set a single app setting by key (upsert).
 */
async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Get GitHub OAuth credentials from database, with env var fallback.
 */
export async function getGitHubOAuthConfig(): Promise<GitHubOAuthConfig | null> {
  const clientId = await getSetting("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID);
  const clientSecret = await getSetting("GITHUB_CLIENT_SECRET", process.env.GITHUB_CLIENT_SECRET);
  const callbackUrl = await getSetting("GITHUB_CALLBACK_URL", process.env.GITHUB_CALLBACK_URL);

  if (!clientId || !clientSecret || !callbackUrl) {
    return null;
  }

  return { clientId, clientSecret, callbackUrl };
}

/**
 * Save GitHub OAuth credentials to database.
 */
export async function saveGitHubOAuthConfig(config: GitHubOAuthConfig): Promise<void> {
  await Promise.all([
    setSetting("GITHUB_CLIENT_ID", config.clientId),
    setSetting("GITHUB_CLIENT_SECRET", config.clientSecret),
    setSetting("GITHUB_CALLBACK_URL", config.callbackUrl),
  ]);
}

/**
 * Check if GitHub OAuth is configured (either in DB or env).
 */
export async function isOAuthConfigured(): Promise<boolean> {
  const config = await getGitHubOAuthConfig();
  return config !== null;
}
