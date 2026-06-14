"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle,
  Eye,
  Heart,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { getApiErrorMessage } from "@/lib/api-error";
import { useMarkRented, useMyProperties } from "@/modules/properties/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { http } from "@/services/http";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "DRAFT" | "RENTED" | "INACTIVE";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  PENDING: { label: "Under Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  RENTED: { label: "Rented", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  EXPIRED: { label: "Inactive", cls: "bg-red-100 text-red-600 border-red-200" },
  REJECTED: { label: "Inactive", cls: "bg-red-100 text-red-600 border-red-200" },
};

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85",
];

function PropertyActionsMenu({ propertyId, status }: { propertyId: string; status: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { runOnce } = useIdempotentAction();
  const markRentedMutation = useMarkRented();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;
    
    await runOnce(`property:delete:${propertyId}`, async () => {
      try {
        await http.delete(`/properties/${propertyId}/`);
        toast.success("Property deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["properties"] });
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    });
    setOpen(false);
  };

  const handleDeactivate = async () => {
    if (!confirm("Mark this property as inactive?")) return;
    
    await runOnce(`property:deactivate:${propertyId}`, async () => {
      try {
        await http.post(`/properties/${propertyId}/expire/`);
        toast.success("Property marked as inactive");
        queryClient.invalidateQueries({ queryKey: ["properties"] });
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="p-1">
                <Link
                  href={`/owner/properties/${propertyId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href={`/properties/${propertyId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <Link
                  href={`/my-ads/${propertyId}/edit`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                {status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Building2 className="h-4 w-4" />
                    Deactivate
                  </button>
                )}
                {status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={markRentedMutation.isPending}
                    onClick={() => {
                      markRentedMutation.mutate(propertyId, {
                        onSuccess: () => {
                          toast.success("Property marked as rented");
                          setOpen(false);
                        },
                        onError: (err) => {
                          toast.error(getApiErrorMessage(err));
                          setOpen(false);
                        },
                      });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Rented
                  </button>
                )}
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyAdsPage() {
  const { user, isAllowed } = useRequireAuth();
  const propertiesQuery = useMyProperties();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const properties = propertiesQuery.data ?? [];
  const searchValue = searchQuery.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "INACTIVE"
          ? ["EXPIRED", "REJECTED"].includes(property.status)
          : property.status === statusFilter;

      const haystack = [
        property.title,
        property.location?.city,
        property.location?.locality,
        property.property_type,
      ]
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

  const counts = {
    all: properties.length,
    active: properties.filter((p) => p.status === "ACTIVE").length,
    pending: properties.filter((p) => p.status === "PENDING").length,
    draft: properties.filter((p) => p.status === "DRAFT").length,
    rented: properties.filter((p) => p.status === "RENTED").length,
    inactive: properties.filter((p) => ["EXPIRED", "REJECTED"].includes(p.status)).length,
  };

  const FILTERS: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All Ads", value: "ALL", count: counts.all },
    { label: "Active", value: "ACTIVE", count: counts.active },
    { label: "Pending", value: "PENDING", count: counts.pending },
    { label: "Drafts", value: "DRAFT", count: counts.draft },
    { label: "Rented", value: "RENTED", count: counts.rented },
    { label: "Inactive", value: "INACTIVE", count: counts.inactive },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DesktopSidebar />

      <main className="flex-1 flex flex-col min-h-screen">
        {/* ── Topbar ── */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-40 bg-white/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">My Ads</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown variant="icon" />
            <ProfileDropdown />
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 p-4 sm:p-6 lg:p-10 pb-28">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* ── Search & Add button ── */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <Link
                href="/my-ads/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/30 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add New</span>
              </Link>
            </div>

            {/* ── Filter tabs ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    statusFilter === filter.value
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      statusFilter === filter.value
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Properties list ── */}
            {propertiesQuery.isLoading && (
              <LoadingState message="Loading your properties..." className="py-12" />
            )}

            {propertiesQuery.isError && (
              <ErrorState message={getApiErrorMessage(propertiesQuery.error)} className="p-4" />
            )}

            {!propertiesQuery.isLoading &&
              !propertiesQuery.isError &&
              properties.length > 0 &&
              filteredProperties.length > 0 && (
                <div className="space-y-3">
                  {filteredProperties.map((property, index) => {
                    const statusBadge = STATUS_BADGE[property.status] ?? STATUS_BADGE.DRAFT;
                    const image = PROPERTY_IMAGES[index % PROPERTY_IMAGES.length];
                    const location = [property.location?.locality, property.location?.city]
                      .filter(Boolean).join(", ") || "Location not set";

                    return (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                      >
                        {/* ── Mobile layout: image top, content below ── */}
                        <div className="sm:hidden">
                          {/* Image */}
                          <Link href={`/owner/properties/${property.id}`} className="relative block h-40 bg-slate-100">
                            <img src={image} alt={property.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            {/* Status badge */}
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold border ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                            {/* Rent overlay */}
                            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                              <p className="text-white font-black text-lg leading-none">
                                ₹{Number(property.rent).toLocaleString("en-IN")}
                                <span className="text-xs font-normal text-white/80">/mo</span>
                              </p>
                              <PropertyActionsMenu propertyId={property.id} status={property.status} />
                            </div>
                          </Link>

                          {/* Content */}
                          <div className="p-3">
                            <Link href={`/owner/properties/${property.id}`}>
                              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 hover:text-emerald-700">
                                {property.title}
                              </h3>
                            </Link>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate">{location}</span>
                            </p>

                            {/* Chips + stats row */}
                            <div className="flex items-center justify-between mt-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {property.property_type}
                                </span>
                                {property.bedrooms != null && (
                                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {property.bedrooms} Bed
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{property.total_views}</span>
                                <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{property.total_favorites}</span>
                                <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{property.total_contacts}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Desktop/tablet layout: image left, content right ── */}
                        <div className="hidden sm:flex">
                          <Link href={`/owner/properties/${property.id}`} className="relative w-48 md:w-56 shrink-0 bg-slate-100 block">
                            <img src={image} alt={property.title} className="w-full h-full object-cover" />
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold border ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </Link>

                          <div className="flex-1 p-4 flex flex-col min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <Link href={`/owner/properties/${property.id}`}>
                                  <h3 className="font-bold text-slate-900 truncate hover:text-emerald-700 transition-colors">
                                    {property.title}
                                  </h3>
                                </Link>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{location}</span>
                                </p>
                              </div>
                              <PropertyActionsMenu propertyId={property.id} status={property.status} />
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                              <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Building2 className="h-3 w-3" />{property.property_type}
                              </span>
                              {property.bedrooms != null && (
                                <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {property.bedrooms} Beds
                                </span>
                              )}
                              {property.bathrooms != null && (
                                <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {property.bathrooms} Baths
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <p className="text-xl font-black text-emerald-600">
                                ₹{Number(property.rent).toLocaleString("en-IN")}
                                <span className="text-sm font-normal text-slate-500">/mo</span>
                              </p>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{property.total_views}</span>
                                <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{property.total_favorites}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{property.total_contacts}</span>
                              </div>
                            </div>

                            {property.created_at && (
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(property.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            {/* ── Empty filtered state ── */}
            {!propertiesQuery.isLoading &&
              !propertiesQuery.isError &&
              properties.length > 0 &&
              filteredProperties.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No properties match this filter</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try another status filter or search keyword.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                  >
                    Reset filters
                  </button>
                </div>
              )}

            {/* ── Empty state ── */}
            {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <Building2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No properties yet</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  Start with your first listing to connect with tenants and begin tracking performance.
                </p>
                <Link
                  href="/my-ads/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/30"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Property
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
