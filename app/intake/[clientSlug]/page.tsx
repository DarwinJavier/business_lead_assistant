import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientBrandHeader } from "@/components/ClientBrandHeader";
import { IntakeForm } from "@/components/IntakeForm";
import { getClientBySlug } from "@/lib/clients";

export default async function IntakePage({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params;
  const client = await getClientBySlug(clientSlug);

  if (!client) {
    notFound();
  }

  if (!client.isActive) {
    return (
      <main className="min-h-screen bg-mist">
        <ClientBrandHeader client={client} />
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
            <h1 className="text-2xl font-semibold text-ink">This intake page is not active.</h1>
            <p className="mt-3 leading-7 text-slate-700">
              Please contact {client.businessName} directly for project inquiries.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mist">
      <ClientBrandHeader client={client} />
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="lg:pt-6">
          <Link href="/" className="text-sm font-semibold text-moss">
            Back to pilot home
          </Link>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink">Tell us about your project.</h1>
          <p className="mt-4 leading-7 text-slate-700">
            This guided intake helps {client.businessName} understand the project before the first conversation.
            Share what you know now. If something is uncertain, choose the closest answer.
          </p>
          <div className="mt-6 rounded-lg border border-line bg-white p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-ink">A quick note</p>
            <p className="mt-2">
              This form does not provide quotes, permit opinions, code advice, warranty advice, or availability
              promises. The contractor reviews every inquiry.
            </p>
          </div>
        </aside>
        <IntakeForm client={client} />
      </section>
    </main>
  );
}
