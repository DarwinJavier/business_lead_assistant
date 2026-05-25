import { describe, expect, it } from "vitest";
import { parseLeadSubmission } from "../lib/validation";

const validLead = {
  clientSlug: "northline-design-build",
  projectType: "Kitchen renovation",
  projectDescription: "We want to renovate our kitchen with a better layout, new cabinets, and improved lighting.",
  projectGoals: "More storage and a better island for family meals.",
  projectLocation: "",
  projectPostalCode: "M8X 1A1",
  timeline: "Within 3-6 months",
  budgetRange: "$50,000 - $100,000",
  hasPhotos: "yes",
  contactPreference: "either",
  homeownerName: "Alex Homeowner",
  homeownerEmail: "alex@example.com",
  homeownerPhone: "416-555-0199",
  company: "",
};

describe("leadSubmissionSchema", () => {
  it("accepts a complete lead submission", () => {
    expect(parseLeadSubmission(validLead).success).toBe(true);
  });

  it("rejects short vague project descriptions", () => {
    expect(parseLeadSubmission({ ...validLead, projectDescription: "Kitchen" }).success).toBe(false);
  });

  it("rejects honeypot spam", () => {
    expect(parseLeadSubmission({ ...validLead, company: "Spam Corp" }).success).toBe(false);
  });

  it("accepts either email or phone when contact preference is either", () => {
    expect(parseLeadSubmission({ ...validLead, homeownerEmail: "", contactPreference: "either" }).success).toBe(true);
    expect(parseLeadSubmission({ ...validLead, homeownerPhone: "", contactPreference: "either" }).success).toBe(true);
  });

  it("requires the selected preferred contact method", () => {
    expect(parseLeadSubmission({ ...validLead, homeownerEmail: "", contactPreference: "email" }).success).toBe(false);
    expect(parseLeadSubmission({ ...validLead, homeownerPhone: "", contactPreference: "phone" }).success).toBe(false);
  });
});
