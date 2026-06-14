"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Menu, MessageSquare, Search, Heart } from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useOwnerLeads } from "@/modules/contacts/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

export default function LeadsPage() {
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const [query, setQuery] = useState("");
  const [contactType, setContactType] = useState<"" | "PHONE" | "CHAT" | "WHATSAPP">("");
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const leadsQuery = useOwnerLeads(Boolean(user) && user?.role === "OWNER");

  const filteredLeads = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (leadsQuery.data ?? []).filter((lead) => {
      const matchesSearch =
        !search ||
        lead.property_title.toLowerCase().includes(search) ||
        (lead.tenant_name || "").toLowerCase().includes(search) ||
        (lead.message || "").toLowerCase().includes(search);
      const matchesType = !contactType || lead.contact_type === contactType;
      return matchesSearch && matchesType;
    });
  }, [leadsQuery.data, query, contactType]);

  if (!isAllowed || !user || user.role !== "OWNER") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          {/* mobile menu */}
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))} className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          {/* desktop search */}
          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input placeholder="Search by location, property or category" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>
          {/* right actions */}
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Wishlist</span>
            </Link>
            <Link href="/chats" className="hidden sm:flex flex-col items-center gap-1.5 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
                {!unreadLoading && !unreadError && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
            </Link>
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
            <ProfileDropdown />
          </div>
        </header>
        {/* page content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
          <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Owner Leads</h1>
            <p className="text-sm text-[var(--muted)]">Track tenant inquiries and engagement by property.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="gb-btn-ghost px-4 py-2 text-sm">
              Dashboard
            </Link>
            <Link href="/properties" className="gb-btn-ghost px-4 py-2 text-sm">
              Properties
            </Link>
          </div>
        </div>

        <div className="gb-card mb-4 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="gb-input md:col-span-2"
              placeholder="Search by property, tenant, or message"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="gb-input"
              value={contactType}
              onChange={(event) => setContactType(event.target.value as "" | "PHONE" | "CHAT" | "WHATSAPP")}
            >
              <option value="">All Contact Types</option>
              <option value="PHONE">PHONE</option>
              <option value="CHAT">CHAT</option>
              <option value="WHATSAPP">WHATSAPP</option>
            </select>
          </div>
        </div>

        {leadsQuery.isLoading ? <LoadingState message="Loading leads..." className="py-6" /> : null}
        {leadsQuery.isError ? <ErrorState message={getApiErrorMessage(leadsQuery.error)} className="p-4" /> : null}

        {filteredLeads.length > 0 ? (
          <div className="gb-card overflow-x-auto p-4">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                  <th className="py-2">Property</th>
                  <th className="py-2">Tenant</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Message</th>
                  <th className="py-2">IP</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[var(--line)]/70 align-top">
                    <td className="py-3 font-medium">{lead.property_title}</td>
                    <td className="py-3">{lead.tenant_name || "Tenant"}</td>
                    <td className="py-3">{lead.contact_type}</td>
                    <td className="py-3 text-[var(--muted)]">{lead.message || "-"}</td>
                    <td className="py-3 text-[var(--muted)]">{lead.ip_address || "-"}</td>
                    <td className="py-3 text-[var(--muted)]">{new Date(lead.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!leadsQuery.isLoading && !leadsQuery.isError && filteredLeads.length === 0 ? (
          <div className="gb-card p-4">
            <EmptyState
              title="No leads found"
              description="Try adjusting filters or wait for tenant inquiries."
              className="py-6"
            />
          </div>
        ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
