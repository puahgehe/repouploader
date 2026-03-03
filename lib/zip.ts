import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import os from "os";

const ALLOWED_EXTENSIONS = [".zip"];
const MAX_SIZE_BYTES = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50") * 1024 * 1024;

export function validateUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${process.env.MAX_UPLOAD_SIZE_MB || 50}MB`,
    };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: "Only .zip files are allowed",
    };
  }

  return { valid: true };
}

/**
 * Sanitize a path component to prevent path traversal attacks.
 * Rejects any path containing ".." or absolute path components.
 */
function sanitizePath(entryPath: string): string | null {
  // Normalize separators
  const normalized = entryPath.replace(/\\/g, "/");
  const parts = normalized.split("/");

  for (const part of parts) {
    if (part === ".." || part === "" && parts.indexOf(part) > 0) {
      return null; // path traversal attempt
    }
    // Reject absolute paths
    if (part.startsWith("/")) return null;
  }

  // Reconstruct safe path
  const safe = parts.filter((p) => p !== "").join("/");
  return safe || null;
}

export async function extractZip(
  zipBuffer: Buffer,
  onLog: (msg: string) => void
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitpush-"));
  onLog(`Created temp directory: ${path.basename(tmpDir)}`);

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  onLog(`Found ${entries.length} entries in zip`);

  // Detect if there's a single root folder wrapping everything
  const topLevelDirs = new Set<string>();
  const topLevelFiles: string[] = [];

  for (const entry of entries) {
    const entryName = entry.entryName.replace(/\\/g, "/");
    const firstPart = entryName.split("/")[0];
    if (entry.isDirectory) {
      if (entryName.split("/").filter(Boolean).length === 1) {
        topLevelDirs.add(firstPart);
      }
    } else {
      if (!entryName.includes("/")) {
        topLevelFiles.push(entryName);
      } else {
        topLevelDirs.add(firstPart);
      }
    }
  }

  // If all content is under a single root directory and no loose files at top, strip it
  const hasSingleRoot =
    topLevelDirs.size === 1 && topLevelFiles.length === 0;
  const rootPrefix = hasSingleRoot ? Array.from(topLevelDirs)[0] + "/" : "";

  if (hasSingleRoot) {
    onLog(`Detected single root folder "${Array.from(topLevelDirs)[0]}", stripping it`);
  }

  let extractedCount = 0;
  for (const entry of entries) {
    const rawPath = entry.entryName.replace(/\\/g, "/");

    // Strip the root prefix if applicable
    const relativePath = hasSingleRoot && rawPath.startsWith(rootPrefix)
      ? rawPath.slice(rootPrefix.length)
      : rawPath;

    if (!relativePath || entry.isDirectory) continue;

    const safePath = sanitizePath(relativePath);
    if (!safePath) {
      onLog(`Skipping unsafe path: ${rawPath}`);
      continue;
    }

    const destPath = path.join(tmpDir, safePath);
    const destDir = path.dirname(destPath);

    // Ensure dest is still within tmpDir (double-check)
    if (!destPath.startsWith(tmpDir + path.sep) && destPath !== tmpDir) {
      onLog(`Skipping path outside temp dir: ${safePath}`);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, entry.getData());
    extractedCount++;
  }

  onLog(`Extracted ${extractedCount} files to temp directory`);
  return tmpDir;
}

export function ensureGitignore(dir: string): void {
  const gitignorePath = path.join(dir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    const content = `# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem
.vercel
`;
    fs.writeFileSync(gitignorePath, content);
  }
}

export function cleanupDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best effort cleanup
  }
}
