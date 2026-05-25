import type { ClientConfig } from "@/lib/types";

export function ClientBrandHeader({ client }: { client: ClientConfig }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: client.brandColor }}
            aria-hidden="true"
          >
            {client.businessName
              .split(" ")
              .slice(0, 2)
              .map((word) => word[0])
              .join("")}
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{client.businessName}</p>
            <p className="text-sm text-slate-600">{client.serviceArea}</p>
          </div>
        </div>
        {client.websiteUrl ? (
          <a
            href={client.websiteUrl}
            className="hidden rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-moss sm:inline-flex"
          >
            Website
          </a>
        ) : null}
      </div>
    </header>
  );
}
