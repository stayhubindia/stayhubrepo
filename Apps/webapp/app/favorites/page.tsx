"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MapPin, IndianRupee, Trash2, Search, Home,
  ArrowRight, BedDouble, Sparkles, RefreshCw, WifiOff,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useFavorites, useFavoriteMutations } from "@/modules/favorites/hooks";
import { getApiErrorMessage } from "@/lib/api-error";

const TYPE_COLORS: Record<string, string> = {
  PG:         "from-violet-500 to-purple-600",
  "1RK":      "from-blue-500 to-indigo-600",
  "1BHK":     "from-emerald-500 to-teal-600",
  "2BHK":     "from-amber-500 to-orange-500",
  "3BHK":     "from-rose-500 to-pink-600",
  HOUSE:      "from-cyan-500 to-sky-600",
  COMMERCIAL: "from-slate-500 to-slate-700",
};

const fmtRent = (rent: string) =>
  Number(rent).toLocaleString("en-IN");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function FavoritesPage() {
  const { user, isAllowed } = useRequireAuth();
  const favoritesQuery = useFavorites(!!user);
  const { removeMutation } = useFavoriteMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const favorites = useMemo(() => favoritesQuery.data ?? [], [favoritesQuery.data]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (f) =>
        f.property_title.toLowerCase().includes(q) ||
        f.property_city?.toLowerCase().includes(q)
    );
  }, [favorites, searchQuery]);

  const handleRemove = async (propertyId: string) => {
    setRemoving(propertyId);
    try {
      await removeMutation.mutateAsync(propertyId);
    } finally {
      setRemoving(null);
    }
  };

  if (!isAllowed || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 pt-8 pb-16 px-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }}
        />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Saved Properties</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {favoritesQuery.isLoading
                  ? "Loading…"
                  : `${favorites.length} ${favorites.length === 1 ? "property" : "properties"} saved`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content card ─────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">

        {/* Search bar */}
        {favorites.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved properties…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition"
              />
            </div>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {favoritesQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-2 w-full bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-7 bg-slate-100 rounded-xl flex-1" />
                    <div className="h-7 bg-slate-100 rounded-xl flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {favoritesQuery.isError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
              <WifiOff className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Couldn&apos;t load saved properties</p>
            <p className="text-xs text-slate-500 mb-4">
              {getApiErrorMessage(favoritesQuery.error)}
            </p>
            <button
              onClick={() => favoritesQuery.refetch()}
              disabled={favoritesQuery.isFetching}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${favoritesQuery.isFetching ? "animate-spin" : ""}`} />
              {favoritesQuery.isFetching ? "Retrying…" : "Try again"}
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No saved properties yet</h3>
            <p className="text-sm text-slate-500 mb-5">Tap the heart icon on a property to save it here</p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow shadow-emerald-500/25 hover:shadow-md transition"
            >
              <Search className="w-4 h-4" /> Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* No search results */}
        {!favoritesQuery.isLoading && favorites.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center"
          >
            <p className="text-sm text-slate-500">No saved properties match &ldquo;<span className="font-medium text-slate-700">{searchQuery}</span>&rdquo;</p>
          </motion.div>
        )}

        {/* Favorites grid */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((fav, index) => {
              const isRemoving = removing === fav.property_id;
              // Derive a type label from the title as a fallback (API doesn't send type directly)
              const typeMatch = Object.keys(TYPE_COLORS).find((t) =>
                fav.property_title.toUpperCase().includes(t)
              );
              const gradient = typeMatch ? TYPE_COLORS[typeMatch] : "from-emerald-500 to-teal-600";

              return (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
                  layout
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-opacity ${isRemoving ? "opacity-50" : ""}`}
                >
                  {/* Top accent bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Property icon + title */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Home className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {fav.property_title}
                          </h3>
                          {fav.property_city && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-500 truncate">{fav.property_city}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(fav.property_id)}
                        disabled={isRemoving}
                        className="shrink-0 w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from saved"
                      >
                        {isRemoving ? (
                          <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Rent + saved date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-base font-black text-slate-900">{fmtRent(fav.property_rent)}</span>
                        <span className="text-xs text-slate-400 font-normal">/mo</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Sparkles className="w-3 h-3" />
                        Saved {fmtDate(fav.created_at)}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/properties/${fav.property_id}`}
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold transition"
                    >
                      <BedDouble className="w-4 h-4" /> View Property <ArrowRight className="w-4 h-4 ml-auto" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Browse more CTA (when there are already some saved) */}
        {!favoritesQuery.isLoading && favorites.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link
              href="/properties"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 text-sm font-medium transition"
            >
              <Search className="w-4 h-4" /> Browse more properties
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
