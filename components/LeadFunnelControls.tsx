"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { adminAuthHeader } from "@/lib/adminAuth";
import { getLeadStatusLabel, leadStatusOptions } from "@/lib/leadStatuses";
import type { LeadStatus } from "@/lib/types";

export function LeadFunnelControls({
  leadId,
  currentStatus,
  adminKey,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  adminKey?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "deleting" | "error">("idle");

  async function updateStatus(nextStatus = status) {
    setState("saving");
    setMessage("");

    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey ? { [adminAuthHeader]: adminKey } : {}),
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setState("error");
      setMessage(payload?.message ?? "Could not update lead status.");
      return;
    }

    setState("idle");
    setMessage(`Status updated to ${getLeadStatusLabel(nextStatus)}.`);
    router.refresh();
  }

  async function deleteLead() {
    const confirmed = window.confirm("Remove this lead from the dashboard? This also removes its saved intake details.");

    if (!confirmed) {
      return;
    }

    setState("deleting");
    setMessage("");

    const response = await fetch(`/api/leads/${leadId}`, {
      method: "DELETE",
      headers: {
        ...(adminKey ? { [adminAuthHeader]: adminKey } : {}),
      },
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setState("error");
      setMessage(payload?.message ?? "Could not remove this lead.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-md border border-line p-4">
      <p className="text-sm font-semibold text-ink">Lead funnel</p>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Current stage
          <select
            suppressHydrationWarning
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus)}
            className="rounded-md border border-line px-3 py-2"
          >
            {leadStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => updateStatus()}
          disabled={state === "saving" || state === "deleting" || status === currentStatus}
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "saving" ? "Saving..." : "Update stage"}
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={deleteLead}
          disabled={state === "saving" || state === "deleting"}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
        >
          <Trash2 aria-hidden size={16} />
          {state === "deleting" ? "Removing..." : "Remove"}
        </button>
      </div>
      {message ? <p className={`mt-3 text-sm ${state === "error" ? "text-rose-700" : "text-moss"}`}>{message}</p> : null}
    </div>
  );
}
