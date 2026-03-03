# GitPush

Upload a `.zip` of your project and push it to GitHub — no terminal required.

## Features

- **GitHub OAuth login** — secure, token stored only in httpOnly cookie
- **Upload .zip** — drag & drop or file picker, up to 50 MB
- **Choose repo** — pick an existing repo or create a new one (public/private)
- **Auto git workflow** — extract → git init → `.gitignore` → commit → push
- **Progress stepper** — real-time step-by-step progress UI
- **Upload history** — full job list with logs and links to repos
- **Security first** — path traversal protection, rate limiting, token never exposed to JS

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | SQLite via Prisma 7 + libsql adapter |
| Auth | GitHub OAuth (httpOnly JWT cookie) |
| Git | simple-git |
| Zip | adm-zip |

## Local Setup

### 1. Clone and install

```bash
cd gitpush-web
npm install
```

### 2. Create GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: GitPush (or any name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/github/callback"
SESSION_SECRET="generate_with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
NEXTAUTH_URL="http://localhost:3000"
MAX_UPLOAD_SIZE_MB=50
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=50
```

### 4. Initialize database

```bash
npx prisma migrate dev --name init
```

### 5. Run development server

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
gitpush-web/
├── app/
│   ├── (protected)/          # Auth-gated pages (layout redirects if not logged in)
│   │   ├── dashboard/        # Main dashboard with stats + recent uploads
│   │   ├── upload/           # Upload form + drag-drop + progress stepper
│   │   ├── history/          # Upload history list
│   │   │   └── [id]/         # Job detail page with logs
│   │   └── settings/         # Account settings + OAuth info
│   ├── api/
│   │   ├── auth/
│   │   │   ├── github/       # GET  → redirect to GitHub OAuth
│   │   │   │   └── callback/ # GET  → exchange code, set session cookie
│   │   │   ├── logout/       # POST → clear session cookie
│   │   │   └── me/           # GET  → current user (no token returned)
│   │   ├── repos/
│   │   │   ├── list/         # GET  → list user repos
│   │   │   └── create/       # POST → create new repo
│   │   ├── upload/
│   │   │   └── push/         # POST → upload zip, extract, git push
│   │   └── history/
│   │       ├── route.ts      # GET  → job list (last 50)
│   │       └── [id]/         # GET  → job detail + logs
│   ├── page.tsx              # Landing page
│   └── layout.tsx
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx        # Responsive navbar with user dropdown
│   │   └── StatusBadge.tsx   # Colored status badge for job states
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── prisma.ts             # Prisma client singleton (libsql adapter)
│   ├── session.ts            # JWT session helpers (httpOnly cookie)
│   ├── github.ts             # GitHub REST API helpers
│   ├── git.ts                # simple-git init + push logic
│   ├── zip.ts                # Zip extraction + path traversal protection
│   └── middleware.ts         # withAuth helper + in-memory rate limiter
├── middleware.ts             # Next.js route protection proxy
├── prisma/
│   ├── schema.prisma         # User + UploadJob models
│   └── dev.db                # SQLite database (gitignored)
├── .env.example              # Template for environment variables
└── prisma.config.ts          # Prisma 7 config with libsql datasource
```

## Database Schema

```prisma
model User {
  id        String      @id @default(cuid())
  githubId  String      @unique
  username  String
  avatarUrl String
  uploadJobs UploadJob[]
}

model UploadJob {
  id           String    @id @default(cuid())
  userId       String
  repoFullName String
  repoUrl      String
  status       String    # pending|uploading|extracting|git_init|committing|pushing|done|error
  log          String    # JSON array of log lines
  errorMessage String?
  createdAt    DateTime
  finishedAt   DateTime?
}
```

**Token storage approach**: The GitHub OAuth token is stored inside a signed JWT (HS256, using `SESSION_SECRET`). The JWT lives in an httpOnly cookie. It is never returned to browser JavaScript. Each API request reads the session server-side only.

## Security Notes

| Concern | Implementation |
|---|---|
| Token storage | Signed HS256 JWT in httpOnly cookie — inaccessible to JS |
| Token in logs | Sanitized before writing to DB (`ghp_xxx` → `***`) |
| Path traversal | Zip entries checked for `..` and absolute paths before extraction |
| Rate limiting | In-memory: 5 uploads/minute per user |
| Temp files | Deleted immediately after job completes (success or error) |
| Push transport | HTTPS with `x-access-token` auth, never SSH |
| OAuth scopes | Minimum required: `repo`, `user:email`, `read:user` |

## Production Deployment

1. Set `NEXTAUTH_URL` to your production domain
2. Update the GitHub OAuth App callback URL to match production
3. Use a strong random `SESSION_SECRET` (32+ chars hex)
4. Ensure the SQLite `dev.db` path has write permissions, or switch to PostgreSQL
5. For multi-instance deployments, replace SQLite with PostgreSQL
