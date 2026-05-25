import type { FitScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<FitScore, string> = {
  strong: "Strong",
  medium: "Medium",
  weak: "Weak",
};

export function FitScoreBadge({ score }: { score?: FitScore | null }) {
  if (!score) {
    return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Unscored</span>;
  }

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        score === "strong" && "bg-emerald-100 text-emerald-800",
        score === "medium" && "bg-amber-100 text-amber-800",
        score === "weak" && "bg-rose-100 text-rose-800",
      )}
    >
      {labels[score]}
    </span>
  );
}
