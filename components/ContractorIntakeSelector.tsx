"use client";

import { useRouter } from "next/navigation";
import type { ClientConfig } from "@/lib/types";

export function ContractorIntakeSelector({
  clients,
  activeSlug,
}: {
  clients: ClientConfig[];
  activeSlug: string;
}) {
  const router = useRouter();
  const activeClients = clients.filter((client) => client.isActive);

  if (activeClients.length <= 1) {
    return null;
  }

  return (
    <label className="mt-5 grid gap-2 text-sm font-medium text-ink">
      Contractor
      <select
        value={activeSlug}
        onChange={(event) => router.push(`/intake/${event.target.value}`)}
        className="rounded-md border border-line bg-white px-3 py-3 text-base"
      >
        {activeClients.map((client) => (
          <option key={client.id} value={client.slug}>
            {client.businessName}
          </option>
        ))}
      </select>
    </label>
  );
}
