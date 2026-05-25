import type { ClientConfig } from "@/lib/types";
import type { LeadSubmissionSchema } from "@/lib/validation";

export function buildLeadSummaryPrompt(client: ClientConfig, lead: LeadSubmissionSchema) {
  const leadForScoring = {
    clientSlug: lead.clientSlug,
    projectType: lead.projectType,
    projectDescription: lead.projectDescription,
    projectGoals: lead.projectGoals,
    projectPostalCode: lead.projectPostalCode,
    timeline: lead.timeline,
    budgetRange: lead.budgetRange,
    hasPhotos: lead.hasPhotos,
    contactPreference: lead.contactPreference,
    homeownerName: lead.homeownerName,
    homeownerEmail: lead.homeownerEmail,
    homeownerPhone: lead.homeownerPhone,
  };

  return [
    {
      role: "system" as const,
      content:
        "You summarize renovation and home-service intake leads for contractors. Return only valid JSON that matches the requested schema. Do not estimate costs, promise timelines, give legal advice, provide permit or construction-code advice, or give warranty advice. Keep the contractor in control.",
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          contractor: {
            businessName: client.businessName,
            projectTypes: client.projectTypes,
            preferredProjectTypes: client.preferredProjectTypes ?? [],
            strongLeadFactors: client.strongLeadFactors ?? [],
            businessLocation: {
              region: client.businessRegion,
              city: client.businessCity,
              province: client.businessProvince,
              postalCode: client.businessPostalCode,
              serviceRadiusKm: client.serviceRadiusKm,
              serviceAreaNotes: client.serviceArea,
            },
            businessPreferences:
              client.businessPreferences ||
              "No additional specialization or project preference notes have been provided.",
            strongLeadCriteria:
              client.leadFitCriteria ||
              "A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.",
          },
          lead: leadForScoring,
          scoringGuidance: {
            strong:
              "Match the contractor's strongLeadCriteria, preferredProjectTypes, strongLeadFactors, and businessPreferences. Do not use city, distance, service area, or project location as a scoring factor.",
            medium:
              "Likely relevant but missing some important details, unclear budget/timeline, or scope needs clarification.",
            weak:
              "Very vague scope, unrealistic or missing budget/timeline context, project type mismatch, incomplete contact details, or not enough information to qualify.",
          },
          outputInstructions: {
            summary: "Two to four sentences in plain business language.",
            missingInfo: "List specific missing or unclear fields. Use an empty array if nothing material is missing.",
            recommendedNextStep:
              "One practical next action for the contractor, without promising availability, pricing, or timelines.",
          },
        },
        null,
        2,
      ),
    },
  ];
}
