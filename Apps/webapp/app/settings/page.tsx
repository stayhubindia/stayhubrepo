"use client";

import Link from "next/link";
import { Bell, Settings2, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "Notifications",
    body: "Open the notifications center to review updates, message activity, and listing alerts in one place.",
    href: "/notifications",
    cta: "Open notifications",
    icon: Bell,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Privacy",
    body: "Review how StayHub handles account data, platform activity, and support requests.",
    href: "/privacy",
    cta: "Review privacy",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf6f2_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.24),transparent_30%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">StayHub settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Quick links for account preferences, privacy information, and notification review.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${section.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
                <Link href={section.href} className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  {section.cta}
                </Link>
              </article>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Need something else?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            You can return to your account center anytime to manage profile details, chats, and role-based tools.
          </p>
          <div className="mt-5">
            <Link href="/account" className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
              Back to account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
