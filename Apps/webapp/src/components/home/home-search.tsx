"use client";

import { useState, useCallback } from "react";
import { Search, MapPin, IndianRupee, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PropertyListQuery } from "@/types/property";

interface HomeSearchProps {
  onSearch?: (filters: PropertyListQuery) => void;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: "PG", label: "PG / Hostel", emoji: "🏠" },
  { value: "1RK", label: "1 RK", emoji: "🛏️" },
  { value: "1BHK", label: "1 BHK", emoji: "🏢" },
  { value: "2BHK", label: "2 BHK", emoji: "🏡" },
  { value: "3BHK", label: "3 BHK", emoji: "🏡" },
  { value: "HOUSE", label: "House", emoji: "🏰" },
  { value: "COMMERCIAL", label: "Commercial", emoji: "🏬" },
];

const QUICK_BUDGETS = [
  { label: "Under 10k", min: 0, max: 10000 },
  { label: "10k - 20k", min: 10000, max: 20000 },
  { label: "20k - 35k", min: 20000, max: 35000 },
  { label: "35k - 50k", min: 35000, max: 50000 },
  { label: "50k+", min: 50000, max: null },
];

const POPULAR_CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Jaipur",
];

export function HomeSearch({ onSearch, className }: HomeSearchProps) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minRent, setMinRent] = useState<number | null>(null);
  const [maxRent, setMaxRent] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>(POPULAR_CITIES);

  const handleCityChange = useCallback((value: string) => {
    setCity(value);
    if (value.trim()) {
      const filtered = POPULAR_CITIES.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered.length > 0 ? filtered : POPULAR_CITIES);
    } else {
      setFilteredCities(POPULAR_CITIES);
    }
    setShowCityDropdown(true);
  }, []);

  const selectCity = useCallback((selectedCity: string) => {
    setCity(selectedCity);
    setShowCityDropdown(false);
    setFilteredCities(POPULAR_CITIES);
  }, []);

  const handleSearch = useCallback(() => {
    if (!city.trim()) {
      alert("Please select a city");
      return;
    }

    setIsSearching(true);
    const filters: PropertyListQuery = {
      city: city.trim(),
      property_type: selectedType || "",
      min_rent: minRent || undefined,
      max_rent: maxRent || undefined,
    };

    if (onSearch) {
      onSearch(filters);
    } else {
      // Navigate to properties page with filters
      const params = new URLSearchParams();
      if (city.trim()) params.append("city", city.trim());
      if (selectedType) params.append("property_type", selectedType);
      if (minRent) params.append("min_rent", String(minRent));
      if (maxRent) params.append("max_rent", String(maxRent));

      router.push(`/properties?${params.toString()}`);
    }

    setIsSearching(false);
  }, [city, selectedType, minRent, maxRent, onSearch, router]);

  const handleBudgetSelect = useCallback(
    (budget: { label: string; min: number; max: number | null }) => {
      setMinRent(budget.min);
      setMaxRent(budget.max);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setCity("");
    setSelectedType(null);
    setMinRent(null);
    setMaxRent(null);
    setFilteredCities(POPULAR_CITIES);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full ${className}`}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Find Your Perfect Home</h2>

        {/* Main search row */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          {/* City search */}
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              City
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter city name"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() => setShowCityDropdown(true)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              {/* City dropdown */}
              {showCityDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10"
                >
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => selectCity(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <MapPin className="w-4 h-4 inline mr-2 text-slate-400" />
                      {c}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Property type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select
              value={selectedType || ""}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <div className="flex-1 flex flex-col justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Budget quick select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <IndianRupee className="w-4 h-4 inline mr-1" />
            Budget (Monthly Rent)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {QUICK_BUDGETS.map((budget, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBudgetSelect(budget)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  minRent === budget.min && maxRent === budget.max
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {budget.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Property type chips */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Or choose a type:
          </label>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <motion.button
                key={type.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSelectedType(selectedType === type.value ? null : type.value)
                }
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  selectedType === type.value
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                }`}
              >
                <span className="mr-1">{type.emoji}</span>
                {type.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {(city || selectedType || minRent || maxRent) && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </motion.div>
  );
}
