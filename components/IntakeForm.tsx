"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Send, X } from "lucide-react";
import { defaultProjectTypes } from "@/lib/projectOptions";
import type { ClientConfig, LeadSubmissionInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const budgetRanges = [
  "Under $1,000",
  "$1,000 - $2,000",
  "$2,000 - $3,000",
  "$3,000 - $5,000",
  "$5,000 - $7,500",
  "$7,500 - $10,000",
  "$10,000 - $15,000",
  "$15,000 - $20,000",
  "$20,000+",
];

const timelines = [
  "As soon as possible",
  "Within 1-3 months",
  "Within 3-6 months",
  "6+ months",
  "Just planning",
];

type FormState = LeadSubmissionInput;
type FieldErrors = Partial<Record<keyof FormState, string[]>>;

export function IntakeForm({ client }: { client: ClientConfig }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [projectPhotos, setProjectPhotos] = useState<File[]>([]);
  const [form, setForm] = useState<FormState>({
    clientSlug: client.slug,
    projectType: defaultProjectTypes[0],
    projectDescription: "",
    projectGoals: "",
    projectLocation: "",
    projectPostalCode: "",
    timeline: timelines[1],
    budgetRange: budgetRanges[budgetRanges.length - 1],
    hasPhotos: "not_sure",
    contactPreference: "either",
    homeownerName: "",
    homeownerEmail: "",
    homeownerPhone: "",
    company: "",
  });

  const steps = useMemo(
    () => [
      {
        label: "Project",
        isValid: form.projectType && form.projectDescription.length >= 20,
      },
      {
        label: "Contact",
        isValid:
          form.homeownerName.length >= 2 &&
          form.projectPostalCode.length >= 3 &&
          ((form.contactPreference === "email" && form.homeownerEmail.includes("@")) ||
            (form.contactPreference === "phone" && form.homeownerPhone.length >= 7) ||
            (form.contactPreference === "either" && (form.homeownerEmail.includes("@") || form.homeownerPhone.length >= 7))),
      },
    ],
    [form],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function fieldError(key: keyof FormState) {
    return fieldErrors[key]?.[0];
  }

  function describedBy(key: keyof FormState) {
    return fieldError(key) ? `${key}-error` : undefined;
  }

  function updatePhotos(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).slice(0, 6);
    setProjectPhotos(selectedFiles);
    setForm((current) => ({
      ...current,
      hasPhotos: selectedFiles.length > 0 ? "yes" : "not_sure",
    }));
  }

  function removePhoto(fileName: string) {
    setProjectPhotos((current) => {
      const next = current.filter((file) => file.name !== fileName);
      setForm((formState) => ({
        ...formState,
        hasPhotos: next.length > 0 ? "yes" : "not_sure",
      }));
      return next;
    });
  }

  async function submit() {
    setStatus("submitting");
    setMessage("");
    setFieldErrors({});

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      body.append(key, value ?? "");
    });
    projectPhotos.forEach((file) => {
      body.append("projectPhotos", file);
    });

    const response = await fetch("/api/leads/submit", {
      method: "POST",
      body,
    });

    const payload = (await response.json().catch(() => null)) as { message?: string; fieldErrors?: FieldErrors } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.message ?? "Something went wrong. Please check your details and try again.");
      setFieldErrors(payload?.fieldErrors ?? {});
      return;
    }

    setStatus("success");
    setMessage("Thanks. Your project details were sent to the contractor.");
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <div
          className="grid h-12 w-12 place-items-center rounded-md text-white"
          style={{ backgroundColor: client.brandColor }}
          aria-hidden="true"
        >
          <Check className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-ink">Your inquiry has been received.</h2>
        <p className="mt-3 leading-7 text-slate-700">
          {client.businessName} will review your details and decide the best next step. They may ask for photos,
          drawings, or a few clarifying details before discussing the project further.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          This confirmation is not a quote, availability promise, timeline commitment, permit opinion, or
          construction-code advice.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="flex gap-2">
        {steps.map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setStep(index)}
            className={cn(
              "h-2 flex-1 rounded-full transition",
              index <= step ? "bg-moss" : "bg-slate-200",
              item.isValid && "bg-copper",
            )}
            aria-label={`Go to ${item.label}`}
          />
        ))}
      </div>

      <div className="mt-6">
        {step === 0 ? (
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Project details</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Tell us what you are hoping to do.</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-ink">
                Project type
                <select
                  value={form.projectType}
                  onChange={(event) => updateField("projectType", event.target.value)}
                  className="rounded-md border border-line bg-white px-3 py-3 text-base"
                >
                  {defaultProjectTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Project description
                <textarea
                  value={form.projectDescription}
                  onChange={(event) => updateField("projectDescription", event.target.value)}
                  className="min-h-36 rounded-md border border-line px-3 py-3 text-base"
                  placeholder="Example: We want to renovate our basement into a family room with a bathroom and better storage."
                  aria-invalid={Boolean(fieldError("projectDescription"))}
                  aria-describedby={describedBy("projectDescription")}
                />
                {fieldError("projectDescription") ? (
                  <span id="projectDescription-error" className="text-sm text-rose-700">
                    {fieldError("projectDescription")}
                  </span>
                ) : null}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Timeline
                  <select
                    value={form.timeline}
                    onChange={(event) => updateField("timeline", event.target.value)}
                    className="rounded-md border border-line bg-white px-3 py-3 text-base"
                  >
                    {timelines.map((timeline) => (
                      <option key={timeline}>{timeline}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Rough budget range, if known
                  <select
                    value={form.budgetRange}
                    onChange={(event) => updateField("budgetRange", event.target.value)}
                    className="rounded-md border border-line bg-white px-3 py-3 text-base"
                  >
                    {budgetRanges.map((range) => (
                      <option key={range}>{range}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Upload pictures (optional)</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Add up to 6 photos or drawings that help explain the project.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-dashed border-line bg-slate-50 px-4 py-4 transition hover:border-moss hover:bg-mist">
                  <span className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
                    <ImagePlus className="h-5 w-5 text-moss" aria-hidden="true" />
                    Choose images
                  </span>
                  <span className="text-xs text-slate-500">PNG, JPG, or WebP</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => updatePhotos(event.target.files)}
                  />
                </label>
                {projectPhotos.length ? (
                  <div className="grid gap-2">
                    {projectPhotos.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2 text-sm">
                        <span className="truncate text-slate-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePhoto(file.name)}
                          className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Anything else that would help the contractor understand the project?
                <textarea
                  value={form.projectGoals}
                  onChange={(event) => updateField("projectGoals", event.target.value)}
                  className="min-h-20 rounded-md border border-line px-3 py-3 text-base"
                  placeholder="Optional: goals, concerns, damage, layout problems, preparing to sell..."
                />
              </label>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Contact</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">How should the contractor reach you?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You only need to provide one contact method, but it should match your preferred contact choice.
            </p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-ink">
                Name
                <input
                  value={form.homeownerName}
                  onChange={(event) => updateField("homeownerName", event.target.value)}
                  className="rounded-md border border-line px-3 py-3 text-base"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldError("homeownerName"))}
                  aria-describedby={describedBy("homeownerName")}
                />
                {fieldError("homeownerName") ? (
                  <span id="homeownerName-error" className="text-sm text-rose-700">
                    {fieldError("homeownerName")}
                  </span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Project ZIP / postal code
                <input
                  value={form.projectPostalCode}
                  onChange={(event) => updateField("projectPostalCode", event.target.value)}
                  className="rounded-md border border-line px-3 py-3 text-base"
                  autoComplete="postal-code"
                  placeholder="ZIP or postal code"
                  aria-invalid={Boolean(fieldError("projectPostalCode"))}
                  aria-describedby={describedBy("projectPostalCode")}
                />
                {fieldError("projectPostalCode") ? (
                  <span id="projectPostalCode-error" className="text-sm text-rose-700">
                    {fieldError("projectPostalCode")}
                  </span>
                ) : null}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Email
                  <input
                    type="email"
                    value={form.homeownerEmail}
                    onChange={(event) => updateField("homeownerEmail", event.target.value)}
                    className="rounded-md border border-line px-3 py-3 text-base"
                    autoComplete="email"
                    placeholder="Needed if you prefer email"
                    aria-invalid={Boolean(fieldError("homeownerEmail"))}
                    aria-describedby={describedBy("homeownerEmail")}
                  />
                  {fieldError("homeownerEmail") ? (
                    <span id="homeownerEmail-error" className="text-sm text-rose-700">
                      {fieldError("homeownerEmail")}
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Phone
                  <input
                    value={form.homeownerPhone}
                    onChange={(event) => updateField("homeownerPhone", event.target.value)}
                    className="rounded-md border border-line px-3 py-3 text-base"
                    autoComplete="tel"
                    placeholder="Needed if you prefer phone"
                    aria-invalid={Boolean(fieldError("homeownerPhone"))}
                    aria-describedby={describedBy("homeownerPhone")}
                  />
                  {fieldError("homeownerPhone") ? (
                    <span id="homeownerPhone-error" className="text-sm text-rose-700">
                      {fieldError("homeownerPhone")}
                    </span>
                  ) : null}
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Preferred contact method
                <select
                  value={form.contactPreference}
                  onChange={(event) => updateField("contactPreference", event.target.value as FormState["contactPreference"])}
                  className="rounded-md border border-line bg-white px-3 py-3 text-base"
                  aria-invalid={Boolean(fieldError("contactPreference"))}
                  aria-describedby={describedBy("contactPreference")}
                >
                  <option value="either">Either email or phone</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                {fieldError("contactPreference") ? (
                  <span id="contactPreference-error" className="text-sm text-rose-700">
                    {fieldError("contactPreference")}
                  </span>
                ) : null}
              </label>
              <label className="hidden">
                Company
                <input
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
          </section>
        ) : null}
      </div>

      {status === "error" ? (
        <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-semibold">{message}</p>
          {Object.keys(fieldErrors).length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(fieldErrors).map(([key, errors]) =>
                errors?.[0] ? <li key={key}>{errors[0]}</li> : null,
              )}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || status === "submitting"}
          className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={status === "submitting"}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {status === "submitting" ? "Sending..." : "Send inquiry"}
          </button>
        )}
      </div>
    </div>
  );
}
