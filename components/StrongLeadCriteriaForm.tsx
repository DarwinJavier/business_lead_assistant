"use client";

import { useMemo, useState } from "react";
import { adminAuthHeader } from "@/lib/adminAuth";
import type { ClientConfig } from "@/lib/types";

const defaultCriteria =
  "A strong lead has a clear project description, realistic budget for the requested work, useful timeline context, at least one reliable contact method, and enough detail to decide whether to follow up.";

export function StrongLeadCriteriaForm({ clients, adminKey }: { clients: ClientConfig[]; adminKey?: string }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId],
  );
  const [criteria, setCriteria] = useState(selectedClient?.leadFitCriteria || defaultCriteria);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function selectClient(clientId: string) {
    const nextClient = clients.find((client) => client.id === clientId);
    setSelectedClientId(clientId);
    setCriteria(nextClient?.leadFitCriteria || defaultCriteria);
    setStatus("idle");
    setMessage("");
  }

  async function saveCriteria() {
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/clients/fit-criteria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey ? { [adminAuthHeader]: adminKey } : {}),
      },
      body: JSON.stringify({
        clientId: selectedClient?.id,
        leadFitCriteria: criteria,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.message ?? "Could not save criteria.");
      return;
    }

    setStatus("saved");
    setMessage("Strong lead criteria saved. New submissions will use this guidance.");
  }

  if (!clients.length) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Contractor
          <select
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

        <label className="grid gap-2 text-sm font-medium text-ink">
          What makes a lead strong?
          <textarea
            value={criteria}
            onChange={(event) => setCriteria(event.target.value)}
            className="min-h-24 rounded-md border border-line px-3 py-3 text-base"
            placeholder={defaultCriteria}
          />
        </label>

        <button
          type="button"
          onClick={saveCriteria}
          disabled={status === "saving"}
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "saving" ? "Saving..." : "Save criteria"}
        </button>
      </div>
      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-rose-700" : "text-moss"}`}>{message}</p>
      ) : null}
      <p className="mt-3 text-sm text-slate-600">
        This criteria is included in the AI scoring prompt for new leads. Location and service area are not used to decide fit.
      </p>
    </section>
  );
}
