import { Fragment } from "react";
import { LeadSummaryCard } from "@/components/LeadSummaryCard";
import { LeadFunnelControls } from "@/components/LeadFunnelControls";
import type { DashboardLeadRow } from "@/lib/leadRows";
import { getLeadStatusLabel } from "@/lib/leadStatuses";
import { formatDateTime } from "@/lib/utils";

export function DashboardTable({ leads, adminKey }: { leads: DashboardLeadRow[]; adminKey?: string }) {
  if (!leads.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center text-slate-600">
        No leads match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            <tr>
              <th className="border-b border-line px-4 py-3">Homeowner</th>
              <th className="border-b border-line px-4 py-3">Project</th>
              <th className="border-b border-line px-4 py-3">Rating</th>
              <th className="border-b border-line px-4 py-3">Stage</th>
              <th className="border-b border-line px-4 py-3">Created</th>
              <th className="border-b border-line px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
      {leads.map((lead) => (
        <Fragment key={lead.id}>
          <tr className="align-top text-sm">
            <td className="border-b border-line px-4 py-4">
              <p className="font-semibold text-ink">{lead.homeowner_name}</p>
              <p className="mt-1 text-slate-600">{lead.homeowner_email || lead.homeowner_phone || "No contact shown"}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{lead.contact_preference}</p>
            </td>
            <td className="border-b border-line px-4 py-4">
              <p className="font-semibold text-ink">{lead.project_type}</p>
              <p className="mt-1 max-w-md text-slate-600 line-clamp-2">{lead.project_description}</p>
              <p className="mt-2 text-xs text-slate-500">{lead.clients?.business_name ?? "Unknown client"}</p>
            </td>
            <td className="border-b border-line px-4 py-4">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-ink">
                {lead.ai_summary?.fitScore ?? lead.ai_status}
              </span>
            </td>
            <td className="border-b border-line px-4 py-4 text-slate-700">{getLeadStatusLabel(lead.status)}</td>
            <td className="border-b border-line px-4 py-4 text-slate-600">{formatDateTime(lead.created_at)}</td>
            <td className="border-b border-line px-4 py-4">
              <details>
                <summary className="cursor-pointer rounded-md border border-line px-3 py-2 text-center text-sm font-semibold text-ink">
                  Open
                </summary>
                <div className="fixed inset-x-4 top-20 z-20 mx-auto max-h-[80vh] max-w-4xl overflow-y-auto rounded-lg border border-line bg-white p-5 shadow-2xl">
                  <div className="grid gap-5">
                    <LeadSummaryCard summary={lead.ai_summary} />
                    <LeadFunnelControls leadId={lead.id} currentStatus={lead.status} adminKey={adminKey} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-md border border-line p-4">
                        <p className="text-sm font-semibold text-ink">Homeowner</p>
                        <dl className="mt-3 space-y-2 text-sm text-slate-700">
                          <div>Name: {lead.homeowner_name}</div>
                          <div>Email: {lead.homeowner_email || "Not provided"}</div>
                          <div>Phone: {lead.homeowner_phone || "Not provided"}</div>
                          <div>Preferred contact: {lead.contact_preference}</div>
                        </dl>
                      </div>
                      <div className="rounded-md border border-line p-4">
                        <p className="text-sm font-semibold text-ink">Project context</p>
                        <dl className="mt-3 space-y-2 text-sm text-slate-700">
                          <div>Timeline: {lead.timeline}</div>
                          <div>Budget: {lead.budget_range}</div>
                          <div>Photos/drawings: {lead.has_photos}</div>
                          {lead.raw_payload?.projectPostalCode ? <div>ZIP/postal: {lead.raw_payload.projectPostalCode}</div> : null}
                          <div>Status: {getLeadStatusLabel(lead.status)}</div>
                        </dl>
                      </div>
                    </div>
                    {lead.raw_payload?.uploadedPhotos?.length ? (
                      <div className="rounded-md border border-line p-4">
                        <p className="text-sm font-semibold text-ink">Uploaded pictures</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {lead.raw_payload.uploadedPhotos.map((photo) => (
                            <a
                              key={photo.path}
                              href={photo.signedUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-moss transition hover:border-moss"
                            >
                              {photo.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-line p-4">
                      <p className="text-sm font-semibold text-ink">Project description</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{lead.project_description}</p>
                    </div>
                  </div>
                </div>
              </details>
            </td>
          </tr>
        </Fragment>
      ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

