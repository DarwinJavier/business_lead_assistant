import "server-only";
import type { DashboardLeadRow } from "@/lib/leadRows";
import type { ClientConfig, LeadAiSummary } from "@/lib/types";
import type { LeadSubmissionSchema } from "@/lib/validation";

declare global {
  // eslint-disable-next-line no-var
  var __localLeadStore: DashboardLeadRow[] | undefined;
}

function store() {
  globalThis.__localLeadStore ??= [];
  return globalThis.__localLeadStore;
}

export function addLocalLead(client: ClientConfig, lead: LeadSubmissionSchema, aiSummary: LeadAiSummary) {
  const now = new Date().toISOString();
  const id = `local_${crypto.randomUUID()}`;

  const row: DashboardLeadRow = {
    id,
    created_at: now,
    status: "new",
    ai_status: "complete",
    project_type: lead.projectType,
    project_location: lead.projectLocation || lead.projectPostalCode,
    project_description: lead.projectDescription,
    timeline: lead.timeline,
    budget_range: lead.budgetRange,
    has_photos: lead.hasPhotos,
    contact_preference: lead.contactPreference,
    homeowner_name: lead.homeownerName,
    homeowner_email: lead.homeownerEmail || "",
    homeowner_phone: lead.homeownerPhone || "",
    ai_summary: aiSummary,
    clients: {
      business_name: client.businessName,
      slug: client.slug,
    },
  };

  store().unshift(row);
  return row;
}

export function getLocalLeads(filters: { clientSlug?: string; fit?: string; status?: string } = {}) {
  return store().filter((lead) => {
    if (filters.clientSlug && lead.clients?.slug !== filters.clientSlug) {
      return false;
    }

    if (filters.fit && lead.ai_summary?.fitScore !== filters.fit) {
      return false;
    }

    if (filters.status && lead.status !== filters.status) {
      return false;
    }

    return true;
  });
}

export function updateLocalLeadStatus(leadId: string, status: DashboardLeadRow["status"]) {
  const lead = store().find((item) => item.id === leadId);

  if (!lead) {
    return null;
  }

  lead.status = status;
  return lead;
}

export function deleteLocalLead(leadId: string) {
  const leads = store();
  const index = leads.findIndex((lead) => lead.id === leadId);

  if (index === -1) {
    return false;
  }

  leads.splice(index, 1);
  return true;
}
