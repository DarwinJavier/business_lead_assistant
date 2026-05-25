import "server-only";
import { Resend } from "resend";
import type { ClientConfig, LeadAiSummary, UploadedLeadPhoto } from "@/lib/types";
import type { LeadSubmissionSchema } from "@/lib/validation";
import { contractorLeadEmail, homeownerConfirmationEmail } from "@/lib/emailTemplates";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function fromEmail() {
  const value = process.env.RESEND_FROM_EMAIL;

  if (!value) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return value;
}

export async function sendContractorLeadNotification({
  client,
  lead,
  aiSummary,
  photoUploads,
}: {
  client: ClientConfig;
  lead: LeadSubmissionSchema;
  aiSummary?: LeadAiSummary | null;
  photoUploads?: UploadedLeadPhoto[];
}) {
  const { subject, html } = contractorLeadEmail({
    client,
    lead,
    aiSummary,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    photoUploads,
  });

  const resend = getResend();
  return resend.emails.send({
    from: fromEmail(),
    to: client.notificationEmail,
    subject,
    html,
  });
}

export async function sendHomeownerConfirmation({
  client,
  lead,
}: {
  client: ClientConfig;
  lead: LeadSubmissionSchema;
}) {
  if (!lead.homeownerEmail) {
    return null;
  }

  const { subject, html } = homeownerConfirmationEmail({ client, lead });
  const resend = getResend();

  return resend.emails.send({
    from: fromEmail(),
    to: lead.homeownerEmail,
    subject,
    html,
  });
}
