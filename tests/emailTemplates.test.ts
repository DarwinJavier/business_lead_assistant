import { describe, expect, it } from "vitest";
import { demoClients } from "../lib/demoClients";
import { contractorLeadEmail, homeownerConfirmationEmail } from "../lib/emailTemplates";

const lead = {
  clientSlug: "northline-design-build",
  projectType: "Kitchen renovation",
  projectDescription: "We want to renovate our kitchen with a better layout, new cabinets, and improved lighting.",
  projectGoals: "",
  projectLocation: "",
  projectPostalCode: "M8X 1A1",
  timeline: "Within 3-6 months",
  budgetRange: "$50,000 - $100,000",
  hasPhotos: "yes" as const,
  contactPreference: "either" as const,
  homeownerName: "Alex Homeowner",
  homeownerEmail: "alex@example.com",
  homeownerPhone: "416-555-0199",
  company: "",
};

describe("email templates", () => {
  it("renders contractor email with AI summary fields", () => {
    const email = contractorLeadEmail({
      client: demoClients[0],
      lead,
      aiSummary: {
        summary: "Kitchen renovation lead with clear location and budget context.",
        fitScore: "strong",
        missingInfo: ["Photos"],
        recommendedNextStep: "Ask for photos and schedule a discovery call.",
      },
    });

    expect(email.subject).toContain("strong");
    expect(email.html).toContain("Kitchen renovation lead");
    expect(email.html).toContain("Photos");
  });

  it("keeps homeowner confirmation away from quotes and promises", () => {
    const email = homeownerConfirmationEmail({ client: demoClients[0], lead });

    expect(email.html).toContain("not a quote");
    expect(email.html).toContain("availability promise");
  });
});
