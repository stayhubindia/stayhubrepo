"use client";

import Link from "next/link";
import { useEffect } from "react";

import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Global UI error boundary triggered", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main className="gb-shell flex min-h-screen items-center justify-center px-4">
      <section className="gb-card w-full max-w-xl p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          The page failed to render. You can retry or return to a safe route.
        </p>
        <div className="flex justify-center gap-2">
          <button className="gb-btn-primary px-4 py-2 text-sm" onClick={reset}>
            Retry
          </button>
          <Link href="/dashboard" className="gb-btn-ghost px-4 py-2 text-sm">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
