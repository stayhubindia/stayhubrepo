"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Search, MapPin, IndianRupee, Building2, ChevronLeft, ChevronRight, Loader2,
  Heart, MessageSquare, ChevronDown, LayoutGrid, List, SlidersHorizontal,
  Menu
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PropertyCard } from "@/components/property/property-card";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useFavoriteMutations, useFavorites } from "@/modules/favorites/hooks";
import { useProperties } from "@/modules/property/hooks";
import type { PropertyListQuery } from "@/types/property";
import { useUnreadCount } from "@/hooks/use-unread-count";

const PAGE_SIZE = 10;

const initialFilters: PropertyListQuery = {
  q: "",
  city: "",
  state: "",
  locality: "",
  property_type: "",
  furnishing: "",
  min_rent: undefined,
  max_rent: undefined,
};

const readFiltersFromSearchParams = (params: URLSearchParams): PropertyListQuery => {
  const numberParam = (key: string) => {
    const value = params.get(key);
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    ...initialFilters,
    q: params.get("q") ?? params.get("search") ?? "",
    city: params.get("city") ?? "",
    state: params.get("state") ?? "",
    locality: params.get("locality") ?? "",
    property_type: params.get("property_type") ?? params.get("type") ?? "",
    furnishing: params.get("furnishing") ?? "",
    min_rent: numberParam("min_rent"),
    max_rent: numberParam("max_rent"),
  };
};

const PROPERTY_TYPES = [
  { value: "",           label: "All Types" },
  { value: "PG",         label: "PG / Hostel" },
  { value: "1RK",        label: "1 RK" },
  { value: "1BHK",       label: "1 BHK" },
  { value: "2BHK",       label: "2 BHK" },
  { value: "3BHK",       label: "3 BHK" },
  { value: "HOUSE",      label: "House / Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const { user, isAllowed } = useRequireAuth();

  const urlFilters = useMemo(
    () => readFiltersFromSearchParams(new URLSearchParams(searchParamString)),
    [searchParamString],
  );

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PropertyListQuery>(urlFilters);
  const [draftFilters, setDraftFilters] = useState<PropertyListQuery>(urlFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const query = useMemo(
    () => ({ ...filters, page, ordering: "-created_at" }),
    [filters, page],
  );

  const propertiesQuery = useProperties(query, Boolean(user));
  const favoritesQuery  = useFavorites(user?.role === "TENANT");
  const { addMutation, removeMutation } = useFavoriteMutations();
  const { runOnce } = useIdempotentAction();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  useEffect(() => {
    setFilters(urlFilters);
    setDraftFilters(urlFilters);
    setPage(1);
  }, [urlFilters]);

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((item) => item.property_id)),
    [favoritesQuery.data],
  );

  const totalCount  = propertiesQuery.data?.count ?? 0;
  const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  
  const visiblePages = useMemo(() => {
    const windowSize = 5;
    if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + windowSize - 1);
    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  if (!isAllowed || !user) return null;

  const canGoPrev   = page > 1;
  const canGoNext   = page < totalPages;
  const hasFilters  = !!(filters.city || filters.property_type || filters.furnishing || filters.min_rent || filters.max_rent || filters.q);

  const onApply = (event?: FormEvent) => {
    if (event) event.preventDefault();
    const normalized = { ...draftFilters };
    if (typeof normalized.min_rent === "number" && typeof normalized.max_rent === "number" && normalized.min_rent > normalized.max_rent) {
      const swap = normalized.min_rent;
      normalized.min_rent = normalized.max_rent;
      normalized.max_rent = swap;
    }
    setFilters(normalized);
    setDraftFilters(normalized);
    setPage(1);
    setShowMobileFilters(false);
  };

  const onReset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const onToggleFavorite = async (propertyId: string, nextState: boolean) => {
    await runOnce(`favorite:toggle:${propertyId}`, async () => {
      try {
        if (nextState) await addMutation.mutateAsync(propertyId);
        else await removeMutation.mutateAsync(propertyId);
      } catch (error) {
        window.alert(getApiErrorMessage(error));
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] w-full">
      <DesktopSidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[88px] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-[#FDFDFD]/90 backdrop-blur-xl">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Search by location, property or category" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
              value={draftFilters.q}
              onChange={(e) => setDraftFilters(p => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && onApply()}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Wishlist</span>
            </Link>
            <Link href="/chats" className="hidden sm:flex flex-col items-center gap-1.5 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
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

        <div className="px-6 lg:px-10 pb-20 w-full max-w-[1400px] mx-auto">
          {/* Page Header */}
          <div className="pt-4 mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Browse Properties</h1>
            <p className="text-slate-500 text-sm">Find the perfect stay that fits your lifestyle and budget.</p>
          </div>

          {/* Horizontal Quick Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-10 flex flex-col xl:flex-row xl:items-center p-2 gap-2">
            <div className="flex-1 flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Location */}
              <div className="flex-1 px-4 py-2 w-full">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Location</p>
                <div className="relative">
                  <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="w-full pl-6 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Enter city or locality"
                    value={draftFilters.city}
                    onChange={(e) => setDraftFilters(p => ({ ...p, city: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Property Type */}
              <div className="flex-1 px-4 py-2 w-full">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Property Type</p>
                <div className="relative">
                  <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-6 bg-transparent text-sm font-semibold text-slate-900 focus:outline-none appearance-none cursor-pointer"
                    value={draftFilters.property_type}
                    onChange={(e) => setDraftFilters(p => ({ ...p, property_type: e.target.value }))}
                  >
                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Max Rent */}
              <div className="flex-1 px-4 py-2 w-full">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Max Rent</p>
                <div className="relative">
                  <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number"
                    className="w-full pl-6 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Any budget"
                    value={draftFilters.max_rent || ""}
                    onChange={(e) => setDraftFilters(p => ({ ...p, max_rent: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 sm:p-0">
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="xl:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
              <button 
                className="hidden xl:flex items-center gap-2 px-6 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" /> More Filters
              </button>
              <button 
                onClick={() => onApply()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-emerald-600/20"
              >
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Vertical Filters (Desktop) */}
            <div className={`lg:w-[260px] shrink-0 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
              <div className="sticky top-[120px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">Filter by</h3>
                  {hasFilters && (
                    <button onClick={onReset} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Clear all</button>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Property Type Group */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex justify-between items-center mb-4 cursor-pointer">
                      Property Type <ChevronDown className="w-4 h-4 text-slate-400" />
                    </h4>
                    <div className="space-y-3">
                      {PROPERTY_TYPES.map(t => (
                        <label 
                          key={t.value} 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            const newFilters = { ...filters, property_type: t.value };
                            setDraftFilters(newFilters);
                            setFilters(newFilters);
                            setPage(1);
                          }}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${draftFilters.property_type === t.value ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white group-hover:border-emerald-500"}`}>
                            {draftFilters.property_type === t.value && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Furnishing Group */}
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex justify-between items-center mb-4 cursor-pointer">
                      Furnishing <ChevronDown className="w-4 h-4 text-slate-400" />
                    </h4>
                    <div className="space-y-3">
                      {[
                        { value: "", label: "Any" },
                        { value: "FURNISHED", label: "Fully Furnished" },
                        { value: "SEMI", label: "Semi Furnished" },
                        { value: "UNFURNISHED", label: "Unfurnished" },
                      ].map(t => (
                        <label 
                          key={t.value} 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            const newFilters = { ...filters, furnishing: t.value };
                            setDraftFilters(newFilters);
                            setFilters(newFilters);
                            setPage(1);
                          }}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${draftFilters.furnishing === t.value ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white group-hover:border-emerald-500"}`}>
                            {draftFilters.furnishing === t.value && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex justify-between items-center mb-4 cursor-pointer">
                      Price Range <ChevronDown className="w-4 h-4 text-slate-400" />
                    </h4>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input 
                          type="number"
                          value={draftFilters.min_rent || ""}
                          onChange={(e) => setDraftFilters(p => ({ ...p, min_rent: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-slate-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input 
                          type="number"
                          value={draftFilters.max_rent || ""}
                          onChange={(e) => setDraftFilters(p => ({ ...p, max_rent: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="50000+"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onApply()}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <p className="text-slate-600 font-medium text-sm">
                  <span className="text-slate-900 font-bold">{totalCount.toLocaleString()}</span> properties found
                </p>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
                    <span>Sort by:</span>
                    <button className="flex items-center gap-2 font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors">
                      Newest First <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg">
                    <button className="p-1.5 bg-white rounded shadow-sm text-emerald-600"><LayoutGrid className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600"><List className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {propertiesQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-sm text-slate-500 font-medium">Finding properties…</p>
                </div>
              ) : propertiesQuery.isError ? (
                <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center text-red-600">
                  <p className="font-bold mb-2">Something went wrong</p>
                  <p className="text-sm">{getApiErrorMessage(propertiesQuery.error)}</p>
                </div>
              ) : totalCount === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-sm text-slate-500 mb-6">Try adjusting your filters or search criteria.</p>
                  <button onClick={onReset} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Clear Filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {propertiesQuery.data?.results.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      canFavorite={user.role === "TENANT"}
                      isFavorite={favoriteIds.has(property.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalCount > PAGE_SIZE && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!canGoPrev || propertiesQuery.isFetching}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {visiblePages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                          p === page
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      disabled={!canGoNext || propertiesQuery.isFetching}
                      onClick={() => setPage((prev) => prev + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
