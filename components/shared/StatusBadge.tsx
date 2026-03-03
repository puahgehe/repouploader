import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Upload,
  GitBranch,
  GitCommit,
  Rocket,
} from "lucide-react";

type Status =
  | "pending"
  | "uploading"
  | "extracting"
  | "git_init"
  | "committing"
  | "pushing"
  | "done"
  | "error";

const statusConfig: Record<
  Status,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  uploading: { label: "Uploading", variant: "default", icon: Upload },
  extracting: { label: "Extracting", variant: "default", icon: Loader2 },
  git_init: { label: "Git Init", variant: "default", icon: GitBranch },
  committing: { label: "Committing", variant: "default", icon: GitCommit },
  pushing: { label: "Pushing", variant: "default", icon: Rocket },
  done: { label: "Done", variant: "default", icon: CheckCircle2 },
  error: { label: "Error", variant: "destructive", icon: XCircle },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as Status] || statusConfig.pending;
  const Icon = cfg.icon;
  const isSpinning = ["uploading", "extracting", "git_init", "committing", "pushing"].includes(status);

  return (
    <Badge
      variant={cfg.variant}
      className={`flex items-center gap-1 w-fit ${status === "done" ? "bg-green-500 hover:bg-green-600" : ""}`}
    >
      <Icon className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
}
