"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "What We Collect",
    body: "We collect the account details, profile information, and property activity needed to help tenants and owners use StayHub safely and effectively.",
  },
  {
    title: "How We Use It",
    body: "Your information is used to create your account, personalize listings, power saved properties and chats, and protect the platform from abuse.",
  },
  {
    title: "When We Share Data",
    body: "We only share information when it is needed to complete a feature you requested, comply with legal obligations, or support trusted infrastructure providers.",
  },
  {
    title: "Your Choices",
    body: "You can update profile details from your account, request help from support, and contact us if you need a correction or deletion review.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fcf8_0%,#eef6f1_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_30%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              This page explains, in plain language, how StayHub handles account data, listing activity, and communication details across the platform.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Reach out through our contact page if you need support related to data access, account corrections, or platform safety concerns.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
              Contact StayHub
            </Link>
            <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
