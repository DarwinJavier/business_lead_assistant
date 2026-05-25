import "server-only";
import { demoClients } from "@/lib/demoClients";
import { getSupabaseAdmin, isSupabaseConfigured, mapClientRow } from "@/lib/supabase";

const clientColumns =
  "id,business_name,slug,brand_color,logo_url,notification_email,phone,website_url,service_area,business_region,business_city,business_province,business_postal_code,service_radius_km,project_types,lead_fit_criteria,business_preferences,preferred_project_types,strong_lead_factors,is_active";
const profileClientColumns =
  "id,business_name,slug,brand_color,logo_url,notification_email,phone,website_url,service_area,project_types,lead_fit_criteria,business_preferences,is_active";
const fitCriteriaClientColumns =
  "id,business_name,slug,brand_color,logo_url,notification_email,phone,website_url,service_area,project_types,lead_fit_criteria,is_active";
const fallbackClientColumns =
  "id,business_name,slug,brand_color,logo_url,notification_email,phone,website_url,service_area,project_types,is_active";

export async function getClients() {
  if (!isSupabaseConfigured()) {
    return demoClients;
  }

  const supabase = getSupabaseAdmin();
  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("clients")
    .select(clientColumns)
    .order("business_name", { ascending: true });

  data = primary.data;
  error = primary.error;

  if (
    error?.message.includes("business_city") ||
    error?.message.includes("business_region") ||
    error?.message.includes("business_province") ||
    error?.message.includes("business_postal_code") ||
    error?.message.includes("service_radius_km") ||
    error?.message.includes("preferred_project_types") ||
    error?.message.includes("strong_lead_factors")
  ) {
    const fallback = await supabase
      .from("clients")
      .select(profileClientColumns)
      .order("business_name", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("business_preferences")) {
    const fallback = await supabase
      .from("clients")
      .select(fitCriteriaClientColumns)
      .order("business_name", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("lead_fit_criteria")) {
    const fallback = await supabase
      .from("clients")
      .select(fallbackClientColumns)
      .order("business_name", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Unable to load clients: ${error.message}`);
  }

  return ((data ?? []) as Parameters<typeof mapClientRow>[0][]).map(mapClientRow);
}

export async function getClientBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return demoClients.find((client) => client.slug === slug) ?? null;
  }

  const supabase = getSupabaseAdmin();
  let data: unknown | null = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("clients")
    .select(clientColumns)
    .eq("slug", slug)
    .maybeSingle();

  data = primary.data;
  error = primary.error;

  if (
    error?.message.includes("business_city") ||
    error?.message.includes("business_region") ||
    error?.message.includes("business_province") ||
    error?.message.includes("business_postal_code") ||
    error?.message.includes("service_radius_km") ||
    error?.message.includes("preferred_project_types") ||
    error?.message.includes("strong_lead_factors")
  ) {
    const fallback = await supabase
      .from("clients")
      .select(profileClientColumns)
      .eq("slug", slug)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("business_preferences")) {
    const fallback = await supabase
      .from("clients")
      .select(fitCriteriaClientColumns)
      .eq("slug", slug)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("lead_fit_criteria")) {
    const fallback = await supabase
      .from("clients")
      .select(fallbackClientColumns)
      .eq("slug", slug)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Unable to load client: ${error.message}`);
  }

  return data ? mapClientRow(data as Parameters<typeof mapClientRow>[0]) : null;
}
