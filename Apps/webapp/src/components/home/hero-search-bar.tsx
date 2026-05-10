"use client";

import { useState, useCallback } from "react";
import { Search, MapPin, Building2, Filter, Loader2, IndianRupee, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PROPERTY_TYPES = [
  { value: "", label: "All types" },
  { value: "PG", label: "PG / Hostel" },
  { value: "1RK", label: "1 RK" },
  { value: "1BHK", label: "1 BHK" },
  { value: "2BHK", label: "2 BHK" },
  { value: "3BHK", label: "3 BHK" },
  { value: "HOUSE", label: "House / Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const QUICK_BUDGETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: "Under 10k", max: 10000 },
  { label: "10k - 20k", min: 10000, max: 20000 },
  { label: "20k - 35k", min: 20000, max: 35000 },
  { label: "35k+", min: 35000 },
];

export function HeroSearchBar() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const buildSearchPath = useCallback(() => {
    const params = new URLSearchParams();
    const trimmedCity = city.trim();

    if (trimmedCity) params.set("city", trimmedCity);
    if (type) params.set("property_type", type);
    if (minRent) params.set("min_rent", minRent);
    if (maxRent) params.set("max_rent", maxRent);

    const queryString = params.toString();
    return queryString ? `/properties?${queryString}` : "/properties";
  }, [city, maxRent, minRent, type]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      setIsSearching(true);
      router.push(buildSearchPath());
      setIsSearching(false);
    },
    [buildSearchPath, router]
  );

  return (
    <motion.div
      whileHover={{ scale: 1.01, boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl p-2 cursor-pointer group"
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-2">
        {/* Location */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 hover:border-emerald-300 transition-colors">
          <MapPin size={18} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Location
            </div>
            <input
              type="text"
              placeholder="Bengaluru, Mumbai, Delhi..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 hover:border-emerald-300 transition-colors">
          <Building2 size={18} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Property Type
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm outline-none bg-transparent text-slate-900"
            >
              {PROPERTY_TYPES.map((propertyType) => (
                <option key={propertyType.value} value={propertyType.value}>
                  {propertyType.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 hover:border-emerald-300 transition-colors">
          <IndianRupee size={18} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Max Rent
            </div>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Any budget"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="w-full text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <>
                <Search size={18} />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
          <Link
            href={buildSearchPath()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          >
            <Filter size={18} />
            <span className="hidden sm:inline text-sm">Filters</span>
          </Link>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 px-1 pb-1 pt-2">
        {QUICK_BUDGETS.map((budget) => {
          const nextMin = budget.min ? String(budget.min) : "";
          const nextMax = budget.max ? String(budget.max) : "";
          const active = minRent === nextMin && maxRent === nextMax;

          return (
            <button
              key={budget.label}
              type="button"
              onClick={() => {
                setMinRent(nextMin);
                setMaxRent(nextMax);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {budget.label}
            </button>
          );
        })}
        {(city || type || minRent || maxRent) && (
          <button
            type="button"
            onClick={() => {
              setCity("");
              setType("");
              setMinRent("");
              setMaxRent("");
            }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>
    </motion.div>
  );
}
