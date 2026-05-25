import { describe, expect, it } from "vitest";
import { parseLeadAiSummary } from "../lib/leadScoring";

describe("parseLeadAiSummary", () => {
  it("accepts valid structured AI output", () => {
    expect(
      parseLeadAiSummary({
        summary: "The homeowner wants a kitchen renovation and has provided location, timeline, and budget context.",
        fitScore: "strong",
        missingInfo: [],
        recommendedNextStep: "Call the homeowner to clarify layout goals and request photos.",
      }),
    ).toEqual(
      expect.objectContaining({
        fitScore: "strong",
      }),
    );
  });

  it("rejects invalid fit scores", () => {
    expect(() =>
      parseLeadAiSummary({
        summary: "Looks good.",
        fitScore: "excellent",
        missingInfo: [],
        recommendedNextStep: "Call.",
      }),
    ).toThrow();
  });
});
