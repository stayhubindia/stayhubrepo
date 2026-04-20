"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { getApiErrorMessage } from "@/lib/api-error";
import { useMarkRented, useMyProperties } from "@/modules/properties/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";

type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "DRAFT" | "RENTED" | "REJECTED" | "EXPIRED";

const formatCurrency = (value: string | number | null | undefined) =>
  `Rs. ${Number(value ?? 0).toLocaleString("en-IN")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
  DRAFT: "bg-slate-100 text-slate-600 border border-slate-200",
  RENTED: "bg-sky-50 text-sky-700 border border-sky-100",
  EXPIRED: "bg-red-50 text-red-700 border border-red-100",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-100",
};

export default function MyPropertiesPage() {
  const { user, isAllowed } = useRequireAuth();
  const propertiesQuery = useMyProperties();
  const markRentedMutation = useMarkRented();
  const { runOnce, isInFlight } = useIdempotentAction();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const properties = propertiesQuery.data ?? [];
  const searchValue = searchQuery.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesStatus = statusFilter === "ALL" ? true : property.status === statusFilter;
      const haystack = [property.title, property.location?.city, property.location?.locality, property.property_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchValue ? haystack.includes(searchValue) : true;
      return matchesStatus && matchesSearch;
    });
  }, [properties, searchValue, statusFilter]);

  if (!isAllowed || !user || user.role !== "OWNER") {
    return null;
  }

  const activeCount = properties.filter((property) => property.status === "ACTIVE").length;
  const pendingCount = properties.filter((property) => property.status === "PENDING").length;
  const draftCount = properties.filter((property) => property.status === "DRAFT").length;
  const totalViews = properties.reduce((sum, property) => sum + (property.total_views ?? 0), 0);
  const totalFavorites = properties.reduce((sum, property) => sum + (property.total_favorites ?? 0), 0);
  const totalContacts = properties.reduce((sum, property) => sum + (property.total_contacts ?? 0), 0);

  const filters: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All", value: "ALL", count: properties.length },
    { label: "Active", value: "ACTIVE", count: activeCount },
    { label: "Pending", value: "PENDING", count: pendingCount },
    { label: "Drafts", value: "DRAFT", count: draftCount },
    { label: "Rented", value: "RENTED", count: properties.filter((property) => property.status === "RENTED").length },
  ];

  const handleMarkRented = async (id: string) => {
    if (confirm("Mark this property as rented?")) {
      await runOnce(`property:mark-rented:${id}`, async () => {
        try {
          await markRentedMutation.mutateAsync(id);
        } catch (err) {
          alert(getApiErrorMessage(err));
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f3_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-28">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_28%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Property workspace
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manage your listings with confidence.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Track inventory status, monitor reach, and take action on every property from one organized owner workspace.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <Building2 className="h-4 w-4 text-emerald-300" />
                    {properties.length} total listings
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {activeCount} currently active
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recommended focus</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {draftCount > 0 ? `${draftCount} draft${draftCount > 1 ? "s" : ""} need attention` : "Portfolio is in motion"}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {draftCount > 0
                    ? "Review your incomplete or rejected properties and submit them so they can start reaching tenants."
                    : "Your published inventory is ready. Keep an eye on performance and mark closed deals promptly."}
                </p>
                <Link
                  href={draftCount > 0 ? "/dashboard/properties" : "/dashboard/properties/add"}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  {draftCount > 0 ? "Review portfolio" : "Add a new property"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live listings</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{activeCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Listings currently visible to potential tenants.</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio views</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{totalViews.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">How many times tenants have viewed your listings.</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved by tenants</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{totalFavorites.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Bookmark activity across your full rental portfolio.</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lead conversations</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{totalContacts.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Direct interest generated from your active listings.</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Listing controls</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Filter, search, and manage your properties</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, city, locality..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </div>
              <Link
                href="/dashboard/properties/add"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Property
              </Link>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  statusFilter === filter.value
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                }`}
              >
                {filter.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusFilter === filter.value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {propertiesQuery.isLoading && <LoadingState message="Loading your properties..." className="py-12" />}
          {propertiesQuery.isError && <ErrorState message={getApiErrorMessage(propertiesQuery.error)} className="p-4" />}

          {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length > 0 && filteredProperties.length > 0 && (
            <div className="space-y-4">
              {filteredProperties.map((property) => {
                const canEdit = property.status === "DRAFT" || property.status === "REJECTED";
                const markRentedKey = `property:mark-rented:${property.id}`;
                return (
                  <div key={property.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-md">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950">{property.title}</h3>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[property.status] ?? statusTone.DRAFT}`}>
                            {property.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {[property.location?.city, property.location?.locality, property.property_type].filter(Boolean).join(" • ")}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                            {property.location?.city || "City not set"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                            Listed on {formatDate(property.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="lg:text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly rent</p>
                        <p className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(property.rent)}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                          <Eye className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-slate-950">{property.total_views}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Views</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                          <Heart className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-slate-950">{property.total_favorites}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Favorites</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-slate-950">{property.total_contacts}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Contacts</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/properties/${property.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                      >
                        View listing <ArrowRight className="h-4 w-4" />
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/dashboard/properties/${property.id}/edit`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit & Submit
                        </Link>
                      )}

                      {property.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkRented(property.id)}
                          disabled={markRentedMutation.isPending || isInFlight(markRentedKey)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark as Rented
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length > 0 && filteredProperties.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No properties match this view</h3>
              <p className="mt-2 text-sm text-slate-500">Try another status filter or search keyword.</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
              >
                Reset filters
              </button>
            </div>
          )}

          {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length === 0 && (
            <EmptyState
              title="No properties yet"
              description="Start with your first listing to connect with tenants and begin tracking performance."
              action={
                <Link
                  href="/dashboard/properties/add"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Property
                </Link>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}