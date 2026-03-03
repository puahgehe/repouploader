import simpleGit, { SimpleGit } from "simple-git";
import path from "path";

export interface GitPushOptions {
  dir: string;
  repoOwner: string;
  repoName: string;
  token: string;
  authorName: string;
  authorEmail: string;
  onLog: (msg: string) => void;
}

export async function initAndPush(options: GitPushOptions): Promise<void> {
  const { dir, repoOwner, repoName, token, authorName, authorEmail, onLog } =
    options;

  // IMPORTANT: Token is never logged
  const remoteUrl = `https://x-access-token:${token}@github.com/${repoOwner}/${repoName}.git`;

  const git: SimpleGit = simpleGit(dir, {
    config: [
      `user.name=${authorName}`,
      `user.email=${authorEmail}`,
    ],
  });

  onLog("Initializing git repository...");
  await git.init();

  onLog("Staging all files...");
  await git.add(".");

  onLog("Creating initial commit...");
  await git.commit("Initial commit");

  onLog(`Pushing to github.com/${repoOwner}/${repoName}...`);

  // Set remote without logging token
  await git.addRemote("origin", remoteUrl);

  // Get the default branch name
  const branchSummary = await git.branchLocal();
  const branch = branchSummary.current || "main";

  // Rename branch to main if needed
  if (branch !== "main") {
    await git.branch(["-M", "main"]);
  }

  await git.push("origin", "main", ["--force"]);

  onLog("Push successful!");
}
