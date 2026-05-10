"use client";

import Link from "next/link";
import { Mail, MessageSquareMore } from "lucide-react";

const contactMethods = [
  {
    title: "General Support",
    detail: "hello@stayhubindia.com",
    body: "Use this for account help, listing questions, and platform support.",
  },
  {
    title: "Safety and Verification",
    detail: "safety@stayhubindia.com",
    body: "Reach out if you need help with suspicious activity, abusive behavior, or trust concerns.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf6ff_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-sky-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_30%)] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-sky-300">
              <MessageSquareMore className="h-3.5 w-3.5" />
              Contact
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Get in Touch</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              If something feels unclear or broken, you can reach the StayHub team through the support channels below.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {contactMethods.map((method) => (
            <article key={method.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{method.title}</h2>
              <p className="mt-2 text-sm font-medium text-sky-700">{method.detail}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{method.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Looking for the basics?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            You can also review how we handle platform data and the rules for using StayHub from the pages below.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/privacy" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500">
              Privacy
            </Link>
            <Link href="/terms" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
              Terms
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
