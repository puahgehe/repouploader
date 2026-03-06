const GITHUB_API = "https://api.github.com";

export async function githubRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string | null;
  name: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  pushed_at: string;
}

export async function getGitHubUser(token: string): Promise<GitHubUser> {
  return githubRequest<GitHubUser>("/user", token);
}

export async function listUserRepos(
  token: string,
  page: number = 1
): Promise<GitHubRepo[]> {
  return githubRequest<GitHubRepo[]>(
    `/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner`,
    token
  );
}

export async function createRepo(
  token: string,
  name: string,
  isPrivate: boolean,
  description?: string
): Promise<GitHubRepo> {
  return githubRequest<GitHubRepo>("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({
      name,
      private: isPrivate,
      description: description || "",
      auto_init: false,
    }),
  });
}

export async function exchangeCodeForToken(
  code: string,
  credentials: { clientId: string; clientSecret: string; callbackUrl: string }
): Promise<{ access_token: string; scope: string; token_type: string }> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      redirect_uri: credentials.callbackUrl,
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string; scope?: string; token_type?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error || "Failed to exchange code for token");
  }

  return data as { access_token: string; scope: string; token_type: string };
}
