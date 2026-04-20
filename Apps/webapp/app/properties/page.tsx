"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, X, MapPin, IndianRupee,
  Building2, ChevronLeft, ChevronRight, Loader2, Crosshair,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { PropertyCard } from "@/components/property/property-card";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useFavoriteMutations, useFavorites } from "@/modules/favorites/hooks";
import { useProperties } from "@/modules/property/hooks";
import type { PropertyListQuery } from "@/types/property";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  },
);

const PAGE_SIZE = 10;

const initialFilters: PropertyListQuery = {
  q: "",
  city: "",
  state: "",
  locality: "",
  property_type: "",
  min_rent: undefined,
  max_rent: undefined,
};

const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 };

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

const QUICK_BUDGETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: "Under 10k", max: 10000 },
  { label: "10k - 20k", min: 10000, max: 20000 },
  { label: "20k - 35k", min: 20000, max: 35000 },
  { label: "35k+", min: 35000 },
];

export default function PropertiesPage() {
  const { user, isAllowed } = useRequireAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PropertyListQuery>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<PropertyListQuery>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSummary, setLocationSummary] = useState("");
  const [locationCoords, setLocationCoords] = useState(DEFAULT_MAP_CENTER);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const query = useMemo(
    () => ({ ...filters, page, ordering: "-created_at" }),
    [filters, page],
  );

  const propertiesQuery = useProperties(query, Boolean(user));
  const favoritesQuery  = useFavorites(user?.role === "TENANT");
  const { addMutation, removeMutation } = useFavoriteMutations();
  const { runOnce } = useIdempotentAction();

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((item) => item.property_id)),
    [favoritesQuery.data],
  );

  const totalCount  = propertiesQuery.data?.count ?? 0;
  const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const profileLocationText = useMemo(
    () => [
      user?.location?.address,
      user?.location?.locality,
      user?.location?.city,
      user?.location?.state,
      user?.location?.pincode,
    ]
      .filter(Boolean)
      .join(", "),
    [
      user?.location?.address,
      user?.location?.city,
      user?.location?.locality,
      user?.location?.pincode,
      user?.location?.state,
    ],
  );
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
  const hasFilters  = !!(
    filters.city ||
    filters.locality ||
    filters.state ||
    filters.property_type ||
    filters.min_rent ||
    filters.max_rent ||
    filters.q
  );
  const hasProfileLocation = Boolean(
    user.location?.address || user.location?.locality || user.location?.city || user.location?.state,
  );

  const applyLocationToFilters = (next: { city?: string; state?: string; locality?: string }) => {
    const mergedDraft = {
      ...draftFilters,
      city: next.city ?? "",
      state: next.state ?? "",
      locality: next.locality ?? "",
    };
    setDraftFilters(mergedDraft);
    setFilters((prev) => ({
      ...prev,
      city: mergedDraft.city,
      state: mergedDraft.state,
      locality: mergedDraft.locality,
    }));
    setPage(1);
  };

  const reverseGeocodeAndApply = async (lat: number, lng: number) => {
    setIsResolvingLocation(true);
    setLocationCoords({ lat, lng });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      if (!response.ok) {
        setLocationSummary(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        return;
      }

      const data = (await response.json()) as {
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          suburb?: string;
          neighbourhood?: string;
          road?: string;
        };
      };

      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "";
      const state = data.address?.state ?? "";
      const locality = data.address?.suburb ?? data.address?.neighbourhood ?? data.address?.road ?? "";
      const summary = [locality, city, state].filter(Boolean).join(", ");

      setLocationSummary(summary || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      applyLocationToFilters({ city, state, locality });
    } catch {
      setLocationSummary(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleLocationSearch = async () => {
    const q = locationQuery.trim();
    if (!q) return;
    setIsResolvingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
      );
      if (!response.ok) return;

      const rows = (await response.json()) as Array<{
        lat: string;
        lon: string;
      }>;

      const top = rows[0];
      if (!top) return;

      const lat = Number(top.lat);
      const lng = Number(top.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      await reverseGeocodeAndApply(lat, lng);
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void reverseGeocodeAndApply(coords.latitude, coords.longitude);
      },
      () => {
        setLocationSummary("Unable to access your current location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const applyProfileLocation = async () => {
    if (!hasProfileLocation) {
      setLocationSummary("Add your address in Profile first.");
      return;
    }

    const city = user.location?.city ?? "";
    const state = user.location?.state ?? "";
    const locality = user.location?.locality ?? "";

    applyLocationToFilters({ city, state, locality });
    setLocationQuery(profileLocationText);
    setLocationSummary(profileLocationText || [locality, city, state].filter(Boolean).join(", "));

    if (!profileLocationText) return;

    setIsResolvingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(profileLocationText)}`,
      );
      if (!response.ok) return;

      const rows = (await response.json()) as Array<{ lat: string; lon: string }>;
      const top = rows[0];
      if (!top) return;

      const lat = Number(top.lat);
      const lng = Number(top.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setLocationCoords({ lat, lng });
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const onApply = (event: FormEvent) => {
    event.preventDefault();
    const normalized = {
      ...draftFilters,
      min_rent: draftFilters.min_rent,
      max_rent: draftFilters.max_rent,
    };
    if (
      typeof normalized.min_rent === "number" &&
      typeof normalized.max_rent === "number" &&
      normalized.min_rent > normalized.max_rent
    ) {
      const swap = normalized.min_rent;
      normalized.min_rent = normalized.max_rent;
      normalized.max_rent = swap;
    }
    setFilters(normalized);
    setDraftFilters(normalized);
    setPage(1);
    setShowFilters(false);
  };

  const onReset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setLocationSummary("");
    setLocationQuery("");
    setLocationCoords(DEFAULT_MAP_CENTER);
    setPage(1);
  };

  const onToggleFavorite = async (propertyId: string, nextState: boolean) => {
    await runOnce(`favorite:toggle:${propertyId}`, async () => {
      try {
        if (nextState) {
          await addMutation.mutateAsync(propertyId);
        } else {
          await removeMutation.mutateAsync(propertyId);
        }
      } catch (error) {
        window.alert(getApiErrorMessage(error));
      }
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_22%,#f8fafc_100%)]">

      {/* ── Sticky search bar ───────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3">     
          <div className="flex items-center gap-2">
          {/* Search input */}
          <form
            onSubmit={onApply}
            className="flex-1 flex items-center gap-2.5 bg-slate-50 border-2 border-slate-200 focus-within:border-indigo-400 focus-within:bg-white rounded-2xl px-4 py-2.5 transition-all"
          >
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="Search by title, city, locality…"
              value={draftFilters.q ?? ""}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
            {draftFilters.q && (
              <button type="button" onClick={() => setDraftFilters((p) => ({ ...p, q: "" }))}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </form>

          {/* Filter toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              showFilters || hasFilters
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && !showFilters && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                ✓
              </span>
            )}
          </motion.button>
        </div>
        </div>

        {/* Quick type pills */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                const next = { ...filters, property_type: t.value };
                setFilters(next);
                setDraftFilters(next);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filters.property_type === t.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_BUDGETS.map((budget) => {
            const active = filters.min_rent === budget.min && filters.max_rent === budget.max;
            return (
              <button
                key={budget.label}
                type="button"
                onClick={() => {
                  const next = { ...filters, min_rent: budget.min, max_rent: budget.max };
                  setFilters(next);
                  setDraftFilters(next);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
                }`}
              >
                {budget.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden bg-white border-b border-slate-200 shadow-sm"
          >
            <form onSubmit={onApply} className="max-w-6xl mx-auto px-4 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {/* City */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition-all"
                    placeholder="City"
                    value={draftFilters.city ?? ""}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                {/* Property type */}
                <select
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition-all"
                  value={draftFilters.property_type ?? ""}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, property_type: e.target.value }))}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Min rent */}
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition-all"
                    placeholder="Min rent"
                    value={draftFilters.min_rent ?? ""}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, min_rent: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>

                {/* Max rent */}
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition-all"
                    placeholder="Max rent"
                    value={draftFilters.max_rent ?? ""}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, max_rent: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Choose Location By Map
                </p>

                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="Search area, locality, landmark..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleLocationSearch();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleLocationSearch()}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Search Place
                  </button>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Crosshair className="h-4 w-4" />
                    Use Current
                  </button>

                  <button
                    type="button"
                    onClick={() => void applyProfileLocation()}
                    disabled={!hasProfileLocation}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use Profile Address
                  </button>
                </div>

                <LocationPickerMap
                  center={locationCoords}
                  onLocationChange={(coords) => {
                    void reverseGeocodeAndApply(coords.lat, coords.lng);
                  }}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium">
                    Lat: {locationCoords.lat.toFixed(5)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium">
                    Lng: {locationCoords.lng.toFixed(5)}
                  </span>
                  {isResolvingLocation && (
                    <span className="inline-flex items-center gap-1 text-indigo-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Resolving location...
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {locationSummary || "Drag the pin or search a place to filter by location."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Apply Filters
                </motion.button>
                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Result count + active filter chips */}
        {!propertiesQuery.isLoading && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm font-semibold text-slate-700">
                {totalCount > 0
                  ? <><span className="text-indigo-600">{totalCount}</span> {totalCount === 1 ? "property" : "properties"} found</>
                  : "No properties found"}
              </p>
              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filters.q && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      &ldquo;{filters.q}&rdquo;
                      <button onClick={() => { setFilters(p => ({ ...p, q: "" })); setDraftFilters(p => ({ ...p, q: "" })); setPage(1); }} className="ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.city && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      <MapPin className="w-3 h-3" />{filters.city}
                      <button onClick={() => { setFilters(p => ({ ...p, city: "" })); setDraftFilters(p => ({ ...p, city: "" })); setPage(1); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.locality && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      {filters.locality}
                      <button onClick={() => { setFilters(p => ({ ...p, locality: "" })); setDraftFilters(p => ({ ...p, locality: "" })); setPage(1); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.state && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      {filters.state}
                      <button onClick={() => { setFilters(p => ({ ...p, state: "" })); setDraftFilters(p => ({ ...p, state: "" })); setPage(1); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.property_type && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      {filters.property_type}
                      <button onClick={() => { setFilters(p => ({ ...p, property_type: "" })); setDraftFilters(p => ({ ...p, property_type: "" })); setPage(1); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {(filters.min_rent || filters.max_rent) && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      ₹{filters.min_rent ?? 0}–{filters.max_rent ?? "∞"}
                      <button onClick={() => { setFilters(p => ({ ...p, min_rent: undefined, max_rent: undefined })); setDraftFilters(p => ({ ...p, min_rent: undefined, max_rent: undefined })); setPage(1); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
            {hasFilters && (
              <button onClick={onReset} className="text-xs text-slate-500 hover:text-red-500 transition-colors font-medium">
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {propertiesQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Finding properties…</p>
          </div>
        )}

        {/* Error */}
        {propertiesQuery.isError && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">Something went wrong</p>
            <p className="text-sm text-slate-500">{getApiErrorMessage(propertiesQuery.error)}</p>
          </div>
        )}

        {/* Empty state */}
        {propertiesQuery.data && propertiesQuery.data.results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">No properties found</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={onReset}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Cards */}
        {propertiesQuery.data && propertiesQuery.data.results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {propertiesQuery.data.results.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <PropertyCard
                  property={property}
                  canFavorite={user.role === "TENANT"}
                  isFavorite={favoriteIds.has(property.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-700">{page}</span> of <span className="font-semibold text-slate-700">{totalPages}</span>
              <span className="text-slate-400 ml-2">({totalCount} results)</span>
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={!canGoPrev || propertiesQuery.isFetching}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </motion.button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {visiblePages.map((p) => {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                        p === page
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > visiblePages[visiblePages.length - 1] && (
                  <span className="text-slate-400 text-sm px-1">…</span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={!canGoNext || propertiesQuery.isFetching}
                onClick={() => setPage((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

