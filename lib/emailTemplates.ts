import type { ClientConfig, LeadAiSummary, UploadedLeadPhoto } from "@/lib/types";
import type { LeadSubmissionSchema } from "@/lib/validation";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function detailRow(label: string, value: string | undefined) {
  return `<tr><td style="padding:8px 12px;color:#56616a;width:180px;">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#1d252c;font-weight:600;">${escapeHtml(value || "Not provided")}</td></tr>`;
}

export function contractorLeadEmail({
  client,
  lead,
  aiSummary,
  appUrl,
  photoUploads = [],
}: {
  client: ClientConfig;
  lead: LeadSubmissionSchema;
  aiSummary?: LeadAiSummary | null;
  appUrl?: string;
  photoUploads?: UploadedLeadPhoto[];
}) {
  const subject = `New ${aiSummary?.fitScore ?? "unscored"} lead: ${lead.projectType}`;
  const missingInfo = aiSummary?.missingInfo.length ? aiSummary.missingInfo.join(", ") : "No major gaps flagged";
  const photoSummary = photoUploads.length ? `${photoUploads.length} uploaded` : "None uploaded";
  const photoLinks = photoUploads
    .filter((photo) => photo.signedUrl)
    .map(
      (photo) =>
        `<li><a href="${escapeHtml(photo.signedUrl ?? "")}" style="color:#4d6b58;">${escapeHtml(photo.fileName)}</a></li>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1d252c;">
      <h1 style="font-size:22px;margin:0 0 8px;">New project inquiry for ${escapeHtml(client.businessName)}</h1>
      <p style="margin:0 0 20px;color:#56616a;">A homeowner submitted a structured intake form.</p>
      <h2 style="font-size:16px;margin:24px 0 8px;">AI lead readout</h2>
      <p><strong>Fit:</strong> ${escapeHtml(aiSummary?.fitScore ?? "AI unavailable")}</p>
      <p><strong>Summary:</strong> ${escapeHtml(aiSummary?.summary ?? "AI summary could not be generated. Review the raw intake details below.")}</p>
      <p><strong>Missing info:</strong> ${escapeHtml(missingInfo)}</p>
      <p><strong>Recommended next step:</strong> ${escapeHtml(aiSummary?.recommendedNextStep ?? "Review the inquiry and decide whether to follow up.")}</p>
      <h2 style="font-size:16px;margin:24px 0 8px;">Homeowner details</h2>
      <table style="border-collapse:collapse;border:1px solid #d9e0e4;width:100%;max-width:720px;">
        ${detailRow("Name", lead.homeownerName)}
        ${detailRow("Email", lead.homeownerEmail)}
        ${detailRow("Phone", lead.homeownerPhone)}
        ${detailRow("Preferred contact", lead.contactPreference)}
        ${detailRow("ZIP / postal code", lead.projectPostalCode)}
      </table>
      <h2 style="font-size:16px;margin:24px 0 8px;">Project details</h2>
      <table style="border-collapse:collapse;border:1px solid #d9e0e4;width:100%;max-width:720px;">
        ${detailRow("Project type", lead.projectType)}
        ${detailRow("Timeline", lead.timeline)}
        ${detailRow("Budget range", lead.budgetRange)}
        ${detailRow("Photos/drawings", photoSummary)}
      </table>
      ${photoLinks ? `<h2 style="font-size:16px;margin:24px 0 8px;">Uploaded photos</h2><ul>${photoLinks}</ul>` : ""}
      <p style="white-space:pre-line;margin-top:16px;">${escapeHtml(lead.projectDescription)}</p>
      ${lead.projectGoals ? `<p style="white-space:pre-line;"><strong>Goals:</strong> ${escapeHtml(lead.projectGoals)}</p>` : ""}
      ${appUrl ? `<p style="margin-top:24px;"><a href="${escapeHtml(appUrl)}/dashboard" style="color:#4d6b58;">Open dashboard</a></p>` : ""}
    </div>
  `;

  return { subject, html };
}

export function homeownerConfirmationEmail({ client, lead }: { client: ClientConfig; lead: LeadSubmissionSchema }) {
  const subject = `We received your project inquiry for ${client.businessName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d252c;">
      <h1 style="font-size:22px;margin:0 0 12px;">Thanks, ${escapeHtml(lead.homeownerName)}.</h1>
      <p>Your project inquiry has been received by ${escapeHtml(client.businessName)}.</p>
      <p>The team will review your details and decide the best next step. They may ask for photos, drawings, or a few clarifying details before discussing the project further.</p>
      <p>This confirmation is not a quote, availability promise, timeline commitment, permit opinion, or construction-code advice.</p>
      <p style="margin-top:24px;color:#56616a;">Project type: ${escapeHtml(lead.projectType)}</p>
    </div>
  `;

  return { subject, html };
}
