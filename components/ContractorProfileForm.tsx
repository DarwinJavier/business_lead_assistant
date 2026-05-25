"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { adminAuthHeader } from "@/lib/adminAuth";
import {
  canadianProvinceOptions,
  ontarioRegionOptions,
  serviceRadiusOptions,
  strongLeadFactorOptions,
} from "@/lib/businessProfileOptions";
import { defaultProjectTypes } from "@/lib/projectOptions";
import type { ClientConfig } from "@/lib/types";

const defaultCriteria =
  "A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.";

type FormState = {
  businessName: string;
  businessRegion: string;
  businessCity: string;
  businessProvince: string;
  businessPostalCode: string;
  serviceRadiusKm: string;
  serviceArea: string;
  notificationEmail: string;
  phone: string;
  websiteUrl: string;
  businessPreferences: string;
  preferredProjectTypes: string[];
  strongLeadFactors: string[];
  leadFitCriteria: string;
};

type FieldErrors = Partial<Record<keyof FormState, string[]>>;

function stateFromClient(client: ClientConfig): FormState {
  return {
    businessName: client.businessName,
    businessRegion: client.businessRegion ?? "greater-toronto-area",
    businessCity: client.businessCity ?? "",
    businessProvince: client.businessProvince ?? "ON",
    businessPostalCode: client.businessPostalCode ?? "",
    serviceRadiusKm: String(client.serviceRadiusKm ?? 75),
    serviceArea: client.serviceArea,
    notificationEmail: client.notificationEmail,
    phone: client.phone ?? "",
    websiteUrl: client.websiteUrl ?? "",
    businessPreferences: client.businessPreferences ?? "",
    preferredProjectTypes: client.preferredProjectTypes?.length ? client.preferredProjectTypes : client.projectTypes.slice(0, 4),
    strongLeadFactors: client.strongLeadFactors?.length
      ? client.strongLeadFactors
      : ["Clear project description", "Realistic budget", "Matches preferred work", "Useful timeline context"],
    leadFitCriteria: client.leadFitCriteria || defaultCriteria,
  };
}

function emptyForm(): FormState {
  return {
    businessName: "",
    businessRegion: "greater-toronto-area",
    businessCity: "",
    businessProvince: "ON",
    businessPostalCode: "",
    serviceRadiusKm: "75",
    serviceArea: "",
    notificationEmail: "",
    phone: "",
    websiteUrl: "",
    businessPreferences: "",
    preferredProjectTypes: [],
    strongLeadFactors: ["Clear project description", "Realistic budget", "Matches preferred work"],
    leadFitCriteria: "",
  };
}

function toggleItem(items: string[], item: string) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

function buildCriteria(form: FormState) {
  const factors = form.strongLeadFactors.length ? form.strongLeadFactors.join(", ") : "clear enough to qualify";
  const preferredWork = form.preferredProjectTypes.length ? form.preferredProjectTypes.join(", ") : "the contractor's preferred work";
  const extraNotes = form.leadFitCriteria.trim();

  return [
    `A strong lead should show ${factors}.`,
    `Preferred work includes: ${preferredWork}.`,
    extraNotes ? `Additional scoring notes: ${extraNotes}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ContractorProfileForm({ clients, adminKey }: { clients: ClientConfig[]; adminKey?: string }) {
  const router = useRouter();
  const [profileMode, setProfileMode] = useState<"edit" | "create">(clients.length ? "edit" : "create");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId],
  );
  const [form, setForm] = useState<FormState>(() => (selectedClient ? stateFromClient(selectedClient) : emptyForm()));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const cityOptions = useMemo(
    () => ontarioRegionOptions.find((region) => region.value === form.businessRegion)?.cities ?? ["Other"],
    [form.businessRegion],
  );

  function switchMode(mode: "edit" | "create") {
    setProfileMode(mode);
    setStatus("idle");
    setMessage("");
    setFieldErrors({});

    if (mode === "create") {
      setForm(emptyForm());
      return;
    }

    if (selectedClient) {
      setForm(stateFromClient(selectedClient));
    }
  }

  function selectClient(clientId: string) {
    const nextClient = clients.find((client) => client.id === clientId);
    setSelectedClientId(clientId);
    if (nextClient) {
      setForm(stateFromClient(nextClient));
    }
    setStatus("idle");
    setMessage("");
    setFieldErrors({});
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus("idle");
    setMessage("");
    setFieldErrors({});
  }

  function updateRegion(regionValue: string) {
    const nextRegion = ontarioRegionOptions.find((region) => region.value === regionValue);
    setForm((current) => ({
      ...current,
      businessRegion: regionValue,
      businessCity: nextRegion?.cities[0] ?? "",
    }));
    setStatus("idle");
    setMessage("");
    setFieldErrors({});
  }

  function toggleFieldItem(field: "preferredProjectTypes" | "strongLeadFactors", value: string) {
    setForm((current) => ({ ...current, [field]: toggleItem(current[field], value) }));
    setStatus("idle");
    setMessage("");
    setFieldErrors({});
  }

  function fieldError(field: keyof FormState) {
    return fieldErrors[field]?.[0] ? <p className="text-sm font-normal text-rose-700">{fieldErrors[field]?.[0]}</p> : null;
  }

  async function saveProfile() {
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/clients/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey ? { [adminAuthHeader]: adminKey } : {}),
      },
      body: JSON.stringify({
        clientId: profileMode === "edit" ? selectedClient?.id : undefined,
        mode: profileMode,
        ...form,
        leadFitCriteria: buildCriteria(form),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string; fieldErrors?: FieldErrors } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.message ?? "Could not save the contractor profile.");
      setFieldErrors(payload?.fieldErrors ?? {});
      return;
    }

    setStatus("saved");
    setMessage(profileMode === "create" ? "Business profile created." : "Contractor profile saved. New AI summaries will use these preferences.");
    router.refresh();
  }

  async function deleteBusinessProfile() {
    if (!selectedClient || profileMode !== "edit") {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedClient.businessName}? This also removes its leads because leads belong to the business.`);

    if (!confirmed) {
      return;
    }

    setStatus("saving");
    setMessage("");

    const response = await fetch(`/api/clients/${selectedClient.id}`, {
      method: "DELETE",
      headers: adminKey ? { [adminAuthHeader]: adminKey } : {},
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.message ?? "Could not delete this business profile.");
      return;
    }

    setStatus("saved");
    setMessage("Business profile deleted.");
    setSelectedClientId("");
    setForm(emptyForm());
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-copper">Contractor workspace</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {profileMode === "create" ? "Create business profile" : "Edit business profile"}
          </h2>
        </div>
        <div className="grid gap-3 md:min-w-96">
          <div className="grid grid-cols-2 rounded-md border border-line bg-slate-50 p-1">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => switchMode("edit")}
              disabled={!clients.length}
              className={`rounded px-3 py-2 text-sm font-semibold ${
                profileMode === "edit" ? "bg-white text-ink shadow-sm" : "text-slate-600 disabled:opacity-50"
              }`}
            >
              Edit existing
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => switchMode("create")}
              className={`rounded px-3 py-2 text-sm font-semibold ${
                profileMode === "create" ? "bg-white text-ink shadow-sm" : "text-slate-600"
              }`}
            >
              Create new
            </button>
          </div>
          {profileMode === "edit" ? (
            <label className="grid gap-2 text-sm font-medium text-ink">
              Business
              <select
                suppressHydrationWarning
                value={selectedClient?.id ?? ""}
                onChange={(event) => selectClient(event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Business name
            <input
              suppressHydrationWarning
              value={form.businessName}
              onChange={(event) => updateField("businessName", event.target.value)}
              className="rounded-md border border-line px-3 py-2"
            />
            {fieldError("businessName")}
          </label>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_180px_180px]">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Region
              <select
                suppressHydrationWarning
                value={form.businessRegion}
                onChange={(event) => updateRegion(event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              >
                {ontarioRegionOptions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              {fieldError("businessRegion")}
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              City
              <select
                suppressHydrationWarning
                value={form.businessCity}
                onChange={(event) => updateField("businessCity", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              >
                <option value="">Select city</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {fieldError("businessCity")}
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Province
              <select
                suppressHydrationWarning
                value={form.businessProvince}
                onChange={(event) => updateField("businessProvince", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              >
                {canadianProvinceOptions.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </select>
              {fieldError("businessProvince")}
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Postal code
              <input
                suppressHydrationWarning
                value={form.businessPostalCode}
                onChange={(event) => updateField("businessPostalCode", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
                placeholder="M6P"
              />
              {fieldError("businessPostalCode")}
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Service area notes
            <input
              suppressHydrationWarning
              value={form.serviceArea}
              onChange={(event) => updateField("serviceArea", event.target.value)}
              className="rounded-md border border-line px-3 py-2"
              placeholder="Toronto west end, Etobicoke, nearby areas"
            />
            {fieldError("serviceArea")}
          </label>
          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink">Typical travel radius</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceRadiusOptions.map((radius) => (
                <label
                  key={radius}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                    form.serviceRadiusKm === String(radius)
                      ? "border-moss bg-moss/10 text-ink"
                      : "border-line text-slate-700"
                  }`}
                >
                  <input
                    suppressHydrationWarning
                    type="radio"
                    name="serviceRadiusKm"
                    value={radius}
                    checked={form.serviceRadiusKm === String(radius)}
                    onChange={(event) => updateField("serviceRadiusKm", event.target.value)}
                    className="h-4 w-4"
                  />
                  {radius} km
                </label>
              ))}
            </div>
            {fieldError("serviceRadiusKm")}
          </fieldset>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Notification email
              <input
                suppressHydrationWarning
                value={form.notificationEmail}
                onChange={(event) => updateField("notificationEmail", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              />
              {fieldError("notificationEmail")}
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Phone
              <input
                suppressHydrationWarning
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
              />
              {fieldError("phone")}
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Website
              <input
                suppressHydrationWarning
                value={form.websiteUrl}
                onChange={(event) => updateField("websiteUrl", event.target.value)}
                className="rounded-md border border-line px-3 py-2"
                placeholder="https://example.com"
              />
              {fieldError("websiteUrl")}
            </label>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink">Preferred project types</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {defaultProjectTypes.map((projectType) => (
                <label key={projectType} className="flex min-h-11 items-center gap-3 rounded-md border border-line px-3 py-2 text-sm text-slate-700">
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    checked={form.preferredProjectTypes.includes(projectType)}
                    onChange={() => toggleFieldItem("preferredProjectTypes", projectType)}
                    className="h-4 w-4"
                  />
                  {projectType}
                </label>
              ))}
            </div>
            {fieldError("preferredProjectTypes")}
          </fieldset>

          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink">What makes a lead strong?</legend>
            <div className="mt-3 grid gap-2">
              {strongLeadFactorOptions.map((factor) => (
                <label key={factor} className="flex min-h-11 items-center gap-3 rounded-md border border-line px-3 py-2 text-sm text-slate-700">
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    checked={form.strongLeadFactors.includes(factor)}
                    onChange={() => toggleFieldItem("strongLeadFactors", factor)}
                    className="h-4 w-4"
                  />
                  {factor}
                </label>
              ))}
            </div>
            {fieldError("strongLeadFactors")}
          </fieldset>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Additional specialization notes
            <textarea
              suppressHydrationWarning
              value={form.businessPreferences}
              onChange={(event) => updateField("businessPreferences", event.target.value)}
              className="min-h-28 rounded-md border border-line px-3 py-3 text-base"
              placeholder="Example: prefers kitchens and bathrooms, will consider patios, avoids very small repair-only jobs."
            />
            {fieldError("businessPreferences")}
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Additional scoring notes
            <textarea
              suppressHydrationWarning
              value={form.leadFitCriteria}
              onChange={(event) => updateField("leadFitCriteria", event.target.value)}
              className="min-h-28 rounded-md border border-line px-3 py-3 text-base"
              placeholder="Optional notes to add nuance to the checklist."
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          These settings guide new AI summaries and scoring. Radius is stored for future geography matching, not used to reject leads yet.
        </p>
        <div className="flex flex-wrap gap-3">
          {profileMode === "edit" && selectedClient ? (
            <button
              suppressHydrationWarning
              type="button"
              onClick={deleteBusinessProfile}
              disabled={status === "saving"}
              className="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-70"
            >
              Delete business
            </button>
          ) : null}
          <button
            suppressHydrationWarning
            type="button"
            onClick={saveProfile}
            disabled={status === "saving"}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          >
            <Save aria-hidden size={16} />
            {status === "saving" ? "Saving..." : profileMode === "create" ? "Create business" : "Save profile"}
          </button>
        </div>
      </div>
      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-rose-700" : "text-moss"}`}>{message}</p>
      ) : null}
    </section>
  );
}
