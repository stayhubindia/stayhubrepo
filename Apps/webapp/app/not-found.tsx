import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="gb-shell flex min-h-screen items-center justify-center px-4">
      <section className="gb-card w-full max-w-xl p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">The route you requested does not exist.</p>
        <div className="flex justify-center gap-2">
          <Link href="/" className="gb-btn-ghost px-4 py-2 text-sm">
            Home
          </Link>
          <Link href="/dashboard" className="gb-btn-primary px-4 py-2 text-sm">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
