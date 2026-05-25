import "server-only";
import OpenAI from "openai";
import type { ClientConfig, LeadAiSummary } from "@/lib/types";
import { parseLeadAiSummary } from "@/lib/leadScoring";
import { buildLeadSummaryPrompt } from "@/lib/prompts";
import type { LeadSubmissionSchema } from "@/lib/validation";

const leadSummaryJsonSchema = {
  name: "lead_ai_summary",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      fitScore: { type: "string", enum: ["strong", "medium", "weak"] },
      missingInfo: {
        type: "array",
        items: { type: "string" },
      },
      recommendedNextStep: { type: "string" },
    },
    required: ["summary", "fitScore", "missingInfo", "recommendedNextStep"],
  },
} as const;

export async function createLeadAiSummary(client: ClientConfig, lead: LeadSubmissionSchema): Promise<LeadAiSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: buildLeadSummaryPrompt(client, lead),
    response_format: {
      type: "json_schema",
      json_schema: leadSummaryJsonSchema,
    },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty lead summary.");
  }

  return parseLeadAiSummary(JSON.parse(content)) as LeadAiSummary;
}
