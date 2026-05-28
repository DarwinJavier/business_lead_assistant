import { NextResponse } from "next/server";
import { getClientBySlug } from "@/lib/clients";
import { createFallbackLeadSummary } from "@/lib/leadScoring";
import { addLocalLead } from "@/lib/localLeadStore";
import { createLeadAiSummary } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendContractorLeadNotification, sendHomeownerConfirmation } from "@/lib/resend";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { UploadedLeadPhoto } from "@/lib/types";
import { parseLeadSubmission } from "@/lib/validation";

const leadPhotoBucket = "lead-photos";
const maxPhotoCount = 6;
const maxPhotoSizeBytes = 8 * 1024 * 1024;

function ipFromRequest(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function recordLeadEvent(leadId: string, eventType: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event_type: eventType,
    payload,
  });
}

async function safeRecordLeadEvent(leadId: string, eventType: string, payload: Record<string, unknown>) {
  try {
    await recordLeadEvent(leadId, eventType, payload);
  } catch {
    // Lead event logging should never block intake completion.
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

async function parseLeadRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload = Object.fromEntries(
      Array.from(formData.entries()).filter(([, value]) => typeof value === "string"),
    );
    const photos = formData
      .getAll("projectPhotos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    return { payload, photos };
  }

  return {
    payload: await request.json().catch(() => null),
    photos: [] as File[],
  };
}

function validatePhotos(photos: File[]) {
  if (photos.length > maxPhotoCount) {
    return `Please upload ${maxPhotoCount} photos or fewer.`;
  }

  const invalidType = photos.find((photo) => !["image/jpeg", "image/png", "image/webp"].includes(photo.type));

  if (invalidType) {
    return "Please upload only JPG, PNG, or WebP images.";
  }

  const oversized = photos.find((photo) => photo.size > maxPhotoSizeBytes);

  if (oversized) {
    return "Each image must be 8 MB or smaller.";
  }

  return null;
}

async function uploadLeadPhotos({
  leadId,
  clientId,
  photos,
}: {
  leadId: string;
  clientId: string;
  photos: File[];
}): Promise<UploadedLeadPhoto[]> {
  if (!photos.length) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  await supabase.storage.createBucket(leadPhotoBucket, {
    public: false,
    fileSizeLimit: maxPhotoSizeBytes,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  const uploadedPhotos: UploadedLeadPhoto[] = [];

  for (const photo of photos) {
    const path = `${clientId}/${leadId}/${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
    const { error } = await supabase.storage.from(leadPhotoBucket).upload(path, await photo.arrayBuffer(), {
      contentType: photo.type,
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = await supabase.storage.from(leadPhotoBucket).createSignedUrl(path, 60 * 60 * 24 * 7);
    uploadedPhotos.push({
      fileName: photo.name,
      path,
      signedUrl: data?.signedUrl,
    });
  }

  return uploadedPhotos;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(ipFromRequest(request));

  if (!rateLimit.ok) {
    return NextResponse.json({ message: "Too many submissions. Please wait a moment and try again." }, { status: 429 });
  }

  const { payload, photos } = await parseLeadRequest(request);
  const photoValidationError = validatePhotos(photos);

  if (photoValidationError) {
    return NextResponse.json({ message: photoValidationError }, { status: 400 });
  }

  const parsed = parseLeadSubmission({
    ...(payload && typeof payload === "object" ? payload : {}),
    hasPhotos: photos.length > 0 ? "yes" : (payload as { hasPhotos?: string } | null)?.hasPhotos,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return NextResponse.json(
      {
        message: "Please fix the highlighted fields and try again.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const lead = {
    ...parsed.data,
    hasPhotos: photos.length > 0 ? "yes" : parsed.data.hasPhotos,
  };
  const client = await getClientBySlug(lead.clientSlug);

  if (!client || !client.isActive) {
    return NextResponse.json({ message: "This intake page is not available." }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    const aiSummary = createFallbackLeadSummary(client, lead);
    const localLead = addLocalLead(client, lead, aiSummary);

    return NextResponse.json({
      ok: true,
      leadId: localLead.id,
      mode: "local-demo",
      message: "Saved in local demo memory. Configure Supabase, OpenAI, and Resend for production submissions.",
    });
  }

  const supabase = getSupabaseAdmin();
  const rawPayload = {
    ...lead,
    projectPhotoFileNames: photos.map((photo) => photo.name),
  };
  const { data: insertedLead, error: insertError } = await supabase
    .from("leads")
    .insert({
      client_id: client.id,
      status: "new",
      ai_status: "pending",
      project_type: lead.projectType,
      project_description: lead.projectDescription,
      project_goals: lead.projectGoals || null,
      project_location: lead.projectLocation || lead.projectPostalCode,
      timeline: lead.timeline,
      budget_range: lead.budgetRange,
      has_photos: lead.hasPhotos,
      contact_preference: lead.contactPreference,
      homeowner_name: lead.homeownerName,
      homeowner_email: lead.homeownerEmail || "",
      homeowner_phone: lead.homeownerPhone || "",
      raw_payload: rawPayload,
    })
    .select("id")
    .single();

  if (insertError || !insertedLead) {
    return NextResponse.json({ message: "Could not save the lead. Please try again." }, { status: 500 });
  }

  let aiSummary = null;
  let photoUploads: UploadedLeadPhoto[] = [];

  try {
    photoUploads = await uploadLeadPhotos({
      leadId: insertedLead.id,
      clientId: client.id,
      photos,
    });

    if (photoUploads.length) {
      await supabase
        .from("leads")
        .update({
          raw_payload: {
            ...rawPayload,
            uploadedPhotos: photoUploads.map(({ fileName, path }) => ({ fileName, path })),
          },
        })
        .eq("id", insertedLead.id)
        .eq("client_id", client.id);
      await safeRecordLeadEvent(insertedLead.id, "photo_upload_complete", { count: photoUploads.length });
    }
  } catch (error) {
    await safeRecordLeadEvent(insertedLead.id, "photo_upload_failed", {
      message: error instanceof Error ? error.message : "Unknown photo upload error",
      count: photos.length,
    });
  }

  try {
    aiSummary = await createLeadAiSummary(client, lead);
    await supabase
      .from("leads")
      .update({
        ai_status: "complete",
        ai_summary: aiSummary,
        fit_score: aiSummary.fitScore,
        missing_info: aiSummary.missingInfo,
        recommended_next_step: aiSummary.recommendedNextStep,
      })
      .eq("id", insertedLead.id)
      .eq("client_id", client.id);
    await safeRecordLeadEvent(insertedLead.id, "ai_summary_complete", { fitScore: aiSummary.fitScore });
  } catch (error) {
    await supabase
      .from("leads")
      .update({ ai_status: "failed" })
      .eq("id", insertedLead.id)
      .eq("client_id", client.id);
    await safeRecordLeadEvent(insertedLead.id, "ai_summary_failed", {
      message: error instanceof Error ? error.message : "Unknown AI error",
    });
  }

  try {
    const contractorEmail = await sendContractorLeadNotification({ client, lead, aiSummary, photoUploads });
    await safeRecordLeadEvent(insertedLead.id, "contractor_email_sent", {
      photoCount: photoUploads.length,
      resendEmailId: contractorEmail?.id,
    });
  } catch (error) {
    await safeRecordLeadEvent(insertedLead.id, "contractor_email_failed", {
      message: error instanceof Error ? error.message : "Unknown email error",
    });
  }

  try {
    const homeownerEmailResult = await sendHomeownerConfirmation({ client, lead });
    await safeRecordLeadEvent(
      insertedLead.id,
      homeownerEmailResult ? "homeowner_email_sent" : "homeowner_email_skipped",
      homeownerEmailResult ? { resendEmailId: homeownerEmailResult.id } : {},
    );
  } catch (error) {
    await safeRecordLeadEvent(insertedLead.id, "homeowner_email_failed", {
      message: error instanceof Error ? error.message : "Unknown email error",
    });
  }

  return NextResponse.json({ ok: true, leadId: insertedLead.id });
}
