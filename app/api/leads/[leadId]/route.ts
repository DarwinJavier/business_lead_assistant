import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { leadStatusOptions } from "@/lib/leadStatuses";
import { deleteLocalLead, updateLocalLeadStatus } from "@/lib/localLeadStore";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { LeadStatus, UploadedLeadPhoto } from "@/lib/types";

const leadPhotoBucket = "lead-photos";

const updateLeadSchema = z.object({
  status: z.enum(leadStatusOptions.map((option) => option.value) as [LeadStatus, ...LeadStatus[]]),
});

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

function photoPathsFromPayload(rawPayload: unknown) {
  const uploadedPhotos = (rawPayload as { uploadedPhotos?: UploadedLeadPhoto[] } | null)?.uploadedPhotos ?? [];
  return uploadedPhotos.map((photo) => photo.path).filter(Boolean);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

  const { leadId } = await context.params;
  const parsed = updateLeadSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid funnel stage." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const updated = updateLocalLeadStatus(leadId, parsed.data.status);
    return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Lead not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select("id,status")
    .single();

  if (error || !data) {
    const needsMigration = error?.message.includes("invalid input value for enum");
    return NextResponse.json(
      {
        message: needsMigration
          ? "Run the funnel status migration in Supabase before using this stage."
          : "Could not update lead status.",
      },
      { status: needsMigration ? 409 : 500 },
    );
  }

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event_type: "lead_status_updated",
    payload: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

  const { leadId } = await context.params;

  if (!isSupabaseConfigured()) {
    return deleteLocalLead(leadId)
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: "Lead not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: lead, error: loadError } = await supabase.from("leads").select("id,raw_payload").eq("id", leadId).single();

  if (loadError || !lead) {
    return NextResponse.json({ message: "Lead not found." }, { status: 404 });
  }

  const photoPaths = photoPathsFromPayload(lead.raw_payload);

  if (photoPaths.length) {
    await supabase.storage.from(leadPhotoBucket).remove(photoPaths);
  }

  const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId);

  if (deleteError) {
    return NextResponse.json({ message: "Could not remove this lead." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
