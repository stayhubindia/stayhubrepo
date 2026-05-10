"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "Using StayHub",
    body: "StayHub is built to help tenants and owners connect directly. Please use the platform honestly and avoid misleading listings, spam, or abusive behavior.",
  },
  {
    title: "Accounts and Access",
    body: "You are responsible for the accuracy of your account information and for keeping your login methods and devices secure.",
  },
  {
    title: "Listings and Communication",
    body: "Property details, pricing, and availability are provided by users. StayHub may moderate, limit, or remove content that appears unsafe, fraudulent, or incomplete.",
  },
  {
    title: "Service Changes",
    body: "We may improve, pause, or update features over time in order to keep the platform stable, secure, and useful for renters and owners.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#f5f1e7_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-[#1f2937] text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.2),transparent_28%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <FileText className="h-3.5 w-3.5" />
              Terms
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Use</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              These terms describe the basic rules for using StayHub, publishing listings, and communicating through the platform.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-amber-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Questions about the rules?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            If you need clarification about acceptable use, listings, or account access, contact the StayHub team and we&apos;ll help you out.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Contact StayHub
            </Link>
            <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
