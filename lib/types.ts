export type FitScore = "strong" | "medium" | "weak";

export type LeadStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "qualified"
  | "appointment_scheduled"
  | "proposal_sent"
  | "won"
  | "lost"
  | "not_fit";

export type AiStatus = "pending" | "complete" | "failed";

export type ContactPreference = "email" | "phone" | "either";

export type ClientConfig = {
  id: string;
  businessName: string;
  slug: string;
  brandColor: string;
  logoUrl?: string | null;
  notificationEmail: string;
  phone?: string | null;
  websiteUrl?: string | null;
  serviceArea: string;
  businessRegion?: string | null;
  businessCity?: string | null;
  businessProvince?: string | null;
  businessPostalCode?: string | null;
  serviceRadiusKm?: number | null;
  projectTypes: string[];
  leadFitCriteria?: string | null;
  businessPreferences?: string | null;
  preferredProjectTypes?: string[];
  strongLeadFactors?: string[];
  isActive: boolean;
};

export type LeadSubmissionInput = {
  clientSlug: string;
  projectType: string;
  projectDescription: string;
  projectGoals?: string;
  projectLocation?: string;
  projectPostalCode: string;
  timeline: string;
  budgetRange: string;
  hasPhotos: "yes" | "no" | "not_sure";
  contactPreference: ContactPreference;
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string;
  company?: string;
};

export type LeadAiSummary = {
  summary: string;
  fitScore: FitScore;
  missingInfo: string[];
  recommendedNextStep: string;
};

export type UploadedLeadPhoto = {
  fileName: string;
  path: string;
  signedUrl?: string;
};

export type LeadRecord = LeadSubmissionInput & {
  id: string;
  clientId: string;
  status: LeadStatus;
  aiStatus: AiStatus;
  aiSummary?: LeadAiSummary | null;
  createdAt: string;
};
