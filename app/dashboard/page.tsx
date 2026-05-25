import Link from "next/link";
import { ContractorProfileForm } from "@/components/ContractorProfileForm";
import { DashboardTable } from "@/components/DashboardTable";
import { getClients } from "@/lib/clients";
import type { DashboardLeadRow } from "@/lib/leadRows";
import { leadStatusOptions } from "@/lib/leadStatuses";
import { getLocalLeads } from "@/lib/localLeadStore";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type SearchParams = {
  admin_key?: string;
  client?: string;
  fit?: string;
  status?: string;
  tab?: string;
};

function dashboardTabHref(params: SearchParams, tab: "leads" | "profile") {
  const search = new URLSearchParams({ tab });

  if (params.admin_key) {
    search.set("admin_key", params.admin_key);
  }

  return `/dashboard?${search.toString()}`;
}

async function getLeads(filters: SearchParams) {
  if (!isSupabaseConfigured()) {
    return getLocalLeads({
      clientSlug: filters.client,
      fit: filters.fit,
      status: filters.status,
    });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("leads")
    .select(
      "id,created_at,status,ai_status,project_type,project_location,project_description,timeline,budget_range,has_photos,contact_preference,homeowner_name,homeowner_email,homeowner_phone,ai_summary,fit_score,raw_payload,clients(business_name,slug)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.client) {
    query = query.eq("client_id", filters.client);
  }

  if (filters.fit) {
    query = query.eq("fit_score", filters.fit);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load leads: ${error.message}`);
  }

  const rows = (data as unknown as Array<Omit<DashboardLeadRow, "clients"> & { clients: DashboardLeadRow["clients"] | DashboardLeadRow["clients"][] }>).map(
    (lead): DashboardLeadRow => ({
      ...lead,
      clients: Array.isArray(lead.clients) ? (lead.clients[0] ?? null) : lead.clients,
    }),
  );

  return Promise.all(
    rows.map(async (lead) => {
      const uploadedPhotos = lead.raw_payload?.uploadedPhotos ?? [];

      if (!uploadedPhotos.length) {
        return lead;
      }

      const photosWithSignedUrls = await Promise.all(
        uploadedPhotos.map(async (photo) => {
          const { data: signedUrlData } = await supabase.storage.from("lead-photos").createSignedUrl(photo.path, 60 * 60);
          return {
            ...photo,
            signedUrl: signedUrlData?.signedUrl,
          };
        }),
      );

      return {
        ...lead,
        raw_payload: {
          ...lead.raw_payload,
          uploadedPhotos: photosWithSignedUrls,
        },
      };
    }),
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const activeTab = params.tab === "profile" ? "profile" : "leads";
  const configuredSecret = process.env.ADMIN_DASHBOARD_SECRET;
  const isTestMode = process.env.NODE_ENV !== "production";
  const isAuthorized = isTestMode || (configuredSecret && params.admin_key === configuredSecret);

  if (!configuredSecret || !isAuthorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-mist px-6">
        <div className="max-w-lg rounded-lg border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-copper">Protected dashboard</p>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Admin access required</h1>
          <p className="mt-3 leading-7 text-slate-700">
            Set `ADMIN_DASHBOARD_SECRET`, then open `/dashboard?admin_key=YOUR_SECRET`.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const [clients, leads] = await Promise.all([getClients(), getLeads(params)]);

  return (
    <main className="min-h-screen bg-mist">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-moss">
              Back to home
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Contractor workspace</h1>
            <p className="mt-2 text-slate-600">Manage lead follow-up and contractor profile settings.</p>
          </div>
          {!isSupabaseConfigured() ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Local demo mode is active. Leads are stored in memory until the dev server restarts.
            </p>
          ) : null}
        </div>

        <nav className="mt-6 flex gap-2 border-b border-line" aria-label="Workspace tabs">
          <Link
            href={dashboardTabHref(params, "leads")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "leads" ? "border-moss text-ink" : "border-transparent text-slate-600 hover:text-ink"
            }`}
          >
            Lead dashboard
          </Link>
          <Link
            href={dashboardTabHref(params, "profile")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "profile" ? "border-moss text-ink" : "border-transparent text-slate-600 hover:text-ink"
            }`}
          >
            Business profile
          </Link>
        </nav>

        {activeTab === "leads" ? (
          <>
            <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-sm md:grid-cols-4">
              <input suppressHydrationWarning type="hidden" name="admin_key" value={params.admin_key ?? ""} />
              <input suppressHydrationWarning type="hidden" name="tab" value="leads" />
              <label className="grid gap-2 text-sm font-medium text-ink">
                Client
                <select
                  suppressHydrationWarning
                  name="client"
                  defaultValue={params.client ?? ""}
                  className="rounded-md border border-line px-3 py-2"
                >
                  <option value="">All clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={isSupabaseConfigured() ? client.id : client.slug}>
                      {client.businessName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Fit score
                <select
                  suppressHydrationWarning
                  name="fit"
                  defaultValue={params.fit ?? ""}
                  className="rounded-md border border-line px-3 py-2"
                >
                  <option value="">All scores</option>
                  <option value="strong">Strong</option>
                  <option value="medium">Medium</option>
                  <option value="weak">Weak</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Status
                <select
                  suppressHydrationWarning
                  name="status"
                  defaultValue={params.status ?? ""}
                  className="rounded-md border border-line px-3 py-2"
                >
                  <option value="">All statuses</option>
                  {leadStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <button suppressHydrationWarning className="self-end rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
                Apply filters
              </button>
            </form>

            <div className="mt-6">
              <DashboardTable leads={leads} adminKey={params.admin_key} />
            </div>
          </>
        ) : (
          <div className="mt-6">
            <ContractorProfileForm clients={clients} adminKey={params.admin_key} />
          </div>
        )}
      </section>
    </main>
  );
}
