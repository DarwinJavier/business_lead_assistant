import type { LeadAiSummary, LeadStatus } from "@/lib/types";

export type DashboardLeadRow = {
  id: string;
  created_at: string;
  status: LeadStatus;
  ai_status: string;
  project_type: string;
  project_location: string;
  project_description: string;
  timeline: string;
  budget_range: string;
  has_photos: string;
  contact_preference: string;
  homeowner_name: string;
  homeowner_email: string;
  homeowner_phone: string;
  ai_summary: LeadAiSummary | null;
  raw_payload?: {
    projectPostalCode?: string;
    uploadedPhotos?: Array<{
      fileName: string;
      path: string;
      signedUrl?: string;
    }>;
  } | null;
  clients: {
    business_name: string;
    slug: string;
  } | null;
};
