import { z } from "zod";
import type { ClientConfig, LeadAiSummary } from "@/lib/types";
import type { LeadSubmissionSchema } from "@/lib/validation";

export const leadAiSummarySchema = z
  .object({
    summary: z.string().trim().min(1).max(1200),
    fitScore: z.enum(["strong", "medium", "weak"]),
    missingInfo: z.array(z.string().trim().min(1).max(160)).max(12),
    recommendedNextStep: z.string().trim().min(1).max(600),
  })
  .strict();

export function parseLeadAiSummary(input: unknown) {
  return leadAiSummarySchema.parse(input);
}

export function createFallbackLeadSummary(client: ClientConfig, lead: LeadSubmissionSchema): LeadAiSummary {
  const missingInfo = [
    lead.projectDescription.length < 80 ? "More project detail" : null,
    lead.budgetRange === "Not sure yet" ? "Budget range" : null,
    lead.hasPhotos !== "yes" ? "Photos or drawings" : null,
  ].filter(Boolean) as string[];

  const knownProjectType = client.projectTypes.some((projectType) => projectType === lead.projectType);
  const fitScore = knownProjectType && missingInfo.length <= 1 ? "strong" : missingInfo.length <= 3 ? "medium" : "weak";

  return {
    summary: `${lead.homeownerName} is asking about ${lead.projectType.toLowerCase()} near ${lead.projectPostalCode}. They are targeting ${lead.timeline.toLowerCase()} with a rough budget range of ${lead.budgetRange.toLowerCase()}.`,
    fitScore,
    missingInfo,
    recommendedNextStep:
      missingInfo.length > 0
        ? `Follow up to confirm ${missingInfo[0].toLowerCase()} before deciding whether to schedule a project conversation.`
        : "Review the intake details and decide whether to schedule a project conversation.",
  };
}
