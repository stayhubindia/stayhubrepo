"use client";

import Link from "next/link";
import { Star, Zap, MessageSquareText } from "lucide-react";

const benefits = [
  {
    title: "Priority discovery",
    body: "Surface high-fit listings faster and reduce the time it takes to shortlist homes worth contacting.",
    icon: Zap,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Faster follow-up",
    body: "Keep your favorite homes, owner chats, and next actions organized in one premium workspace.",
    icon: MessageSquareText,
    tone: "bg-sky-50 text-sky-700",
  },
];

export default function PremiumBuyerPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f5efe1_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_26%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <Star className="h-3.5 w-3.5" />
              Premium buyer
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Upgrade your rental search flow</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              This page is ready for premium buyer details, plan pricing, and feature rollout. For now it gives users a real destination instead of a broken route.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-[24px] border border-amber-100 bg-white p-6 shadow-sm">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${benefit.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{benefit.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{benefit.body}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Where to go next</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Continue browsing homes or jump back to your account center while the premium offer details are finalized.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/properties" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Browse properties
            </Link>
            <Link href="/account" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700">
              Back to account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
