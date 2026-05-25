import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  }

  const { clientId } = await context.params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) {
    return NextResponse.json({ message: "Could not delete this business profile." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
