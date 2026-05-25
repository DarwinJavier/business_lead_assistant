import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { ClientConfig } from "@/lib/types";

type ClientRow = {
  id: string;
  business_name: string;
  slug: string;
  brand_color: string;
  logo_url: string | null;
  notification_email: string;
  phone: string | null;
  website_url: string | null;
  service_area: string;
  business_region?: string | null;
  business_city?: string | null;
  business_province?: string | null;
  business_postal_code?: string | null;
  service_radius_km?: number | null;
  project_types: string[];
  lead_fit_criteria?: string | null;
  business_preferences?: string | null;
  preferred_project_types?: string[] | null;
  strong_lead_factors?: string[] | null;
  is_active: boolean;
};

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function mapClientRow(row: ClientRow): ClientConfig {
  return {
    id: row.id,
    businessName: row.business_name,
    slug: row.slug,
    brandColor: row.brand_color,
    logoUrl: row.logo_url,
    notificationEmail: row.notification_email,
    phone: row.phone,
    websiteUrl: row.website_url,
    serviceArea: row.service_area,
    businessRegion: row.business_region ?? null,
    businessCity: row.business_city ?? null,
    businessProvince: row.business_province ?? null,
    businessPostalCode: row.business_postal_code ?? null,
    serviceRadiusKm: row.service_radius_km ?? null,
    projectTypes: row.project_types,
    leadFitCriteria: row.lead_fit_criteria ?? null,
    businessPreferences: row.business_preferences ?? null,
    preferredProjectTypes: row.preferred_project_types ?? [],
    strongLeadFactors: row.strong_lead_factors ?? [],
    isActive: row.is_active,
  };
}
