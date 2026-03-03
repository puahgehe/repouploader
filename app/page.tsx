import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Upload,
  Shield,
  Zap,
  Github,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const features = [
    {
      icon: Upload,
      title: "Upload & Push",
      description:
        "Zip your project folder, upload it, and we handle the git init, commit, and push to GitHub — all from your browser.",
    },
    {
      icon: Shield,
      title: "Secure OAuth",
      description:
        "Login with GitHub OAuth. Your access token is stored only in a signed, httpOnly cookie — never exposed to the browser.",
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description:
        "Choose an existing repo or create a new one. Auto-generate .gitignore, initial commit, and push in seconds.",
    },
    {
      icon: GitBranch,
      title: "Full History",
      description:
        "Track every upload job with status, logs, and a direct link to the resulting GitHub repository.",
    },
  ];

  const steps = [
    "Login with GitHub OAuth",
    "Upload your .zip project",
    "Choose or create a repo",
    "We push the code for you",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GitBranch className="w-5 h-5 text-primary" />
            <span>GitPush</span>
          </div>
          <Link href="/api/auth/github">
            <Button size="sm">
              <Github className="w-4 h-4 mr-2" />
              Sign in with GitHub
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4">
            No terminal needed
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Push projects to GitHub
            <br />
            <span className="text-primary">without opening a terminal</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload a .zip of your project folder and GitPush automatically
            extracts it, runs git init, makes an initial commit, and pushes to
            your GitHub repository.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/auth/github">
              <Button size="lg" className="gap-2">
                <Github className="w-5 h-5" />
                Get Started with GitHub
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {/* Error handling */}
          <ErrorAlert searchParamsPromise={searchParams} />
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium">{step}</span>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security note */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-4">Security First</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {[
              "GitHub token stored only in httpOnly cookie (never in localStorage)",
              "Tokens are signed via HS256 JWT — not readable by client JS",
              "Zip extraction protects against path traversal attacks",
              "Temp files deleted immediately after push completes",
              "Push uses HTTPS token auth, not SSH keys",
              "Rate limiting on upload endpoint",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GitBranch className="w-4 h-4" />
          <span className="font-medium">GitPush</span>
        </div>
        <p>Built with Next.js, Prisma, and GitHub OAuth</p>
      </footer>
    </div>
  );
}

// Async component to handle error params
async function ErrorAlert({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string }>;
}) {
  const params = await searchParamsPromise;
  if (!params.error) return null;

  const messages: Record<string, string> = {
    oauth_denied: "GitHub OAuth was denied. Please try again.",
    oauth_failed: "OAuth login failed. Check your app configuration.",
  };

  return (
    <div className="mt-6 p-3 bg-destructive/10 text-destructive rounded-md text-sm max-w-md mx-auto">
      {messages[params.error] || "An error occurred during login."}
    </div>
  );
}
