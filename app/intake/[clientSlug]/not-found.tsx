import Link from "next/link";

export default function IntakeNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-6">
      <div className="max-w-lg rounded-lg border border-line bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">We could not find that intake page.</h1>
        <p className="mt-3 leading-7 text-slate-700">
          The link may be outdated or the contractor page may not be active yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
