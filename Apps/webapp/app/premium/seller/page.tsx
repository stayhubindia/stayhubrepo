"use client";

import Link from "next/link";
import { BadgeIndianRupee, Building2, Heart, Menu, MessageSquare, Search, Star, TrendingUp } from "lucide-react";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

const benefits = [
  {
    title: "Stronger listing visibility",
    body: "Highlight priority listings, drive more qualified views, and create a cleaner owner performance funnel.",
    icon: TrendingUp,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Premium lead tools",
    body: "Prepare room for featured placement, better lead workflow, and richer listing promotion controls.",
    icon: BadgeIndianRupee,
    tone: "bg-sky-50 text-sky-700",
  },
];

export default function PremiumSellerPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fcf8_0%,#ebf6ef_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-emerald-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_26%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Star className="h-3.5 w-3.5" />
              Premium seller
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Upgrade your owner growth tools</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              This route now exists for owner accounts and can be expanded with plan pricing, featured listing tools, and lead management upgrades.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${benefit.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{benefit.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{benefit.body}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Where to go next</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Head back to your listings dashboard while the premium owner experience is being fleshed out.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/properties" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
              Open listings
            </Link>
            <Link href="/account" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
              Back to account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
