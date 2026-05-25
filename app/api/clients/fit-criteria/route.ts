import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const fitCriteriaSchema = z.object({
  clientId: z.string().uuid(),
  leadFitCriteria: z.string().trim().min(20).max(1200),
});

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  }

  const parsed = fitCriteriaSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Add at least one clear sentence describing a strong lead." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("clients")
    .update({ lead_fit_criteria: parsed.data.leadFitCriteria })
    .eq("id", parsed.data.clientId);

  if (error) {
    const needsMigration = error.message.includes("lead_fit_criteria");
    return NextResponse.json(
      {
        message: needsMigration
          ? "The database needs the lead_fit_criteria migration before criteria can be saved."
          : "Could not save strong lead criteria.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
