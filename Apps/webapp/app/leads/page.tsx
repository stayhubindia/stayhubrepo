"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useOwnerLeads } from "@/modules/contacts/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";

export default function LeadsPage() {
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const [query, setQuery] = useState("");
  const [contactType, setContactType] = useState<"" | "PHONE" | "CHAT" | "WHATSAPP">("");

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
    <main className="gb-shell min-h-screen px-4 py-8 md:px-8">
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
    </main>
  );
}
