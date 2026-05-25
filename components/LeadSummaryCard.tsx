import type { LeadAiSummary } from "@/lib/types";
import { FitScoreBadge } from "@/components/FitScoreBadge";

export function LeadSummaryCard({ summary }: { summary?: LeadAiSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-md border border-line bg-slate-50 p-4 text-sm text-slate-600">
        AI summary unavailable. Review the raw intake details.
      </div>
    );
  }

  const missingInfo = summary.missingInfo.filter((item) => {
    const normalized = item.toLowerCase().replace(/\s+/g, "");
    return !normalized.includes("projectlocation");
  });

  return (
    <div className="rounded-md border border-line bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">AI readout</p>
        <FitScoreBadge score={summary.fitScore} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{summary.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Missing info</p>
          <p className="mt-1 text-sm text-slate-700">
            {missingInfo.length ? missingInfo.join(", ") : "No major gaps flagged"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Next step</p>
          <p className="mt-1 text-sm text-slate-700">{summary.recommendedNextStep}</p>
        </div>
      </div>
    </div>
  );
}
