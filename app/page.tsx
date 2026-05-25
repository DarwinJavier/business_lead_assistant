import Link from "next/link";
import { ClipboardList, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <nav className="border-b border-line pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">Test mode</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">AI Renovation Lead Intake Assistant</h1>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Choose your path</p>
            <h2 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight text-ink">
              Are you a homeowner or a contractor?
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
              This local test page separates the homeowner intake experience from the contractor lead review workflow.
            </p>
          </div>

          <div className="grid gap-4">
            <Link
              href="/intake/northline-design-build"
              className="group rounded-lg border border-line bg-white p-6 shadow-sm transition hover:border-moss hover:shadow-soft"
            >
              <ClipboardList className="h-7 w-7 text-moss" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-semibold text-ink">I am a homeowner</h3>
              <p className="mt-2 leading-7 text-slate-700">
                Tell the contractor about your project using a short guided intake form.
              </p>
              <p className="mt-5 text-sm font-semibold text-moss">Start project inquiry</p>
            </Link>

            <Link
              href="/dashboard"
              className="group rounded-lg border border-line bg-white p-6 shadow-sm transition hover:border-moss hover:shadow-soft"
            >
              <LayoutDashboard className="h-7 w-7 text-moss" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-semibold text-ink">I am a contractor</h3>
              <p className="mt-2 leading-7 text-slate-700">
                Review submitted leads, AI summaries, fit scores, and recommended next steps.
              </p>
              <p className="mt-5 text-sm font-semibold text-moss">Open lead dashboard</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
