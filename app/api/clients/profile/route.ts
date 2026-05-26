import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { defaultProjectTypes } from "@/lib/projectOptions";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const clientProfileSchema = z.object({
  clientId: z.string().uuid().optional(),
  mode: z.enum(["create", "edit"]).default("edit"),
  businessName: z.string().trim().min(2).max(160),
  serviceArea: z.string().trim().min(2).max(240),
  businessRegion: z.string().trim().min(2, "Choose a service region.").max(120),
  businessCity: z.string().trim().min(2, "Add the business city.").max(120),
  businessProvince: z.string().trim().min(2, "Choose a province.").max(40),
  businessPostalCode: z.string().trim().min(3, "Add a postal code or postal prefix.").max(20),
  serviceRadiusKm: z.coerce.number().int().min(1).max(500),
  notificationEmail: z.string().trim().email().max(240),
  phone: z.string().trim().max(80).optional(),
  websiteUrl: z
    .string()
    .trim()
    .max(240)
    .optional()
    .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), "Use a full URL, such as https://example.com."),
  businessPreferences: z.string().trim().max(1600).optional(),
  preferredProjectTypes: z.array(z.string().trim().min(1)).min(1, "Choose at least one preferred project type.").max(20),
  strongLeadFactors: z.array(z.string().trim().min(1)).min(1, "Choose at least one strong-lead factor.").max(20),
  leadFitCriteria: z.string().trim().min(20).max(1200),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function createUniqueSlug(supabase: ReturnType<typeof getSupabaseAdmin>, businessName: string) {
  const baseSlug = slugify(businessName) || `business-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase.from("clients").select("id").eq("slug", slug).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  }

  const parsed = clientProfileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat().find(Boolean);

    return NextResponse.json(
      {
        message: firstError ?? "Review the business profile fields and try again.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const values = {
    business_name: parsed.data.businessName,
    service_area: parsed.data.serviceArea,
    business_region: parsed.data.businessRegion,
    business_city: parsed.data.businessCity,
    business_province: parsed.data.businessProvince,
    business_postal_code: parsed.data.businessPostalCode,
    service_radius_km: parsed.data.serviceRadiusKm,
    notification_email: parsed.data.notificationEmail,
    phone: parsed.data.phone || null,
    website_url: parsed.data.websiteUrl || null,
    business_preferences: parsed.data.businessPreferences || null,
    preferred_project_types: parsed.data.preferredProjectTypes,
    strong_lead_factors: parsed.data.strongLeadFactors,
    lead_fit_criteria: parsed.data.leadFitCriteria,
    updated_at: new Date().toISOString(),
  };
  const isCreate = parsed.data.mode === "create" || !parsed.data.clientId;

  let result;
  try {
    result = isCreate
      ? await supabase
          .from("clients")
          .insert({
            ...values,
            slug: await createUniqueSlug(supabase, parsed.data.businessName),
            brand_color: "#4d6b58",
            project_types: defaultProjectTypes,
            is_active: true,
          })
          .select("id,slug")
          .single()
      : await supabase.from("clients").update(values).eq("id", parsed.data.clientId).select("id,slug").single();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save the contractor profile." },
      { status: 500 },
    );
  }

  if (result.error) {
    const needsMigration =
      result.error.message.includes("business_preferences") ||
      result.error.message.includes("lead_fit_criteria") ||
      result.error.message.includes("business_region") ||
      result.error.message.includes("business_city") ||
      result.error.message.includes("business_province") ||
      result.error.message.includes("business_postal_code") ||
      result.error.message.includes("service_radius_km") ||
      result.error.message.includes("preferred_project_types") ||
      result.error.message.includes("strong_lead_factors");
    return NextResponse.json(
      {
        message: needsMigration
          ? "The database needs the contractor profile migration before these settings can be saved."
          : "Could not save the contractor profile.",
        detail: process.env.NODE_ENV !== "production" ? result.error.message : undefined,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, client: result.data, mode: isCreate ? "create" : "edit" });
}
