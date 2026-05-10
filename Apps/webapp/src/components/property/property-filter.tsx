"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, MapPin, Banknote, Building2, Wind } from "lucide-react";
import { useState, useCallback } from "react";
import type { PropertyListQuery } from "@/types/property";

interface PropertyFilterProps {
  filters: PropertyListQuery;
  onFiltersChange: (filters: PropertyListQuery) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

const PROPERTY_TYPES = [
  { value: "PG", label: "PG / Hostel" },
  { value: "1RK", label: "1 RK" },
  { value: "1BHK", label: "1 BHK" },
  { value: "2BHK", label: "2 BHK" },
  { value: "3BHK", label: "3 BHK" },
  { value: "HOUSE", label: "House / Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const FURNISHING = [
  { value: "FURNISHED", label: "Furnished" },
  { value: "SEMI", label: "Semi-Furnished" },
  { value: "UNFURNISHED", label: "Unfurnished" },
];

const BUDGET_PRESETS = [
  { label: "Under 10k", min: 0, max: 10000 },
  { label: "10k - 20k", min: 10000, max: 20000 },
  { label: "20k - 35k", min: 20000, max: 35000 },
  { label: "35k - 50k", min: 35000, max: 50000 },
  { label: "50k - 75k", min: 50000, max: 75000 },
  { label: "75k+", min: 75000, max: null },
];

export function PropertyFilter({
  filters,
  onFiltersChange,
  onClose,
  isMobile,
}: PropertyFilterProps) {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    budget: true,
    type: true,
    furnishing: false,
  });

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleCityChange = useCallback(
    (city: string) => {
      onFiltersChange({ ...filters, city, page: 1 });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        property_type: filters.property_type === type ? "" : type,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleFurnishingChange = useCallback(
    (furnishing: string) => {
      onFiltersChange({
        ...filters,
        furnishing: filters.furnishing === furnishing ? "" : furnishing,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleBudgetPreset = useCallback(
    (preset: { label: string; min: number; max: number | null }) => {
      onFiltersChange({
        ...filters,
        min_rent: preset.min,
        max_rent: preset.max ?? undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleMinRentChange = useCallback(
    (value: string) => {
      const num = value ? parseInt(value, 10) : undefined;
      onFiltersChange({
        ...filters,
        min_rent: num,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleMaxRentChange = useCallback(
    (value: string) => {
      const num = value ? parseInt(value, 10) : undefined;
      onFiltersChange({
        ...filters,
        max_rent: num,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      q: "",
      city: "",
      state: "",
      locality: "",
      property_type: "",
      furnishing: "",
      min_rent: undefined,
      max_rent: undefined,
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.city ||
    filters.property_type ||
    filters.furnishing ||
    filters.min_rent ||
    filters.max_rent;

  return (
    <motion.div
      initial={isMobile ? { x: -400 } : { opacity: 0, y: -20 }}
      animate={isMobile ? { x: 0 } : { opacity: 1, y: 0 }}
      exit={isMobile ? { x: -400 } : { opacity: 0, y: -20 }}
      className={`${
        isMobile
          ? "fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto"
          : "bg-white border border-slate-200 rounded-2xl p-6"
      } space-y-4`}
    >
      {/* Header for mobile */}
      {isMobile && (
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Filters</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>
      )}

      <div className={isMobile ? "p-6" : ""}>
        {/* Location Section */}
        <motion.div
          className="border-b border-slate-200 pb-4"
          layout
        >
          <button
            onClick={() => toggleSection("location")}
            className="w-full flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Location</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.location ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.location && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-3"
              >
                <input
                  type="text"
                  placeholder="Search city..."
                  value={filters.city || ""}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Budget Section */}
        <motion.div
          className="border-b border-slate-200 py-4"
          layout
        >
          <button
            onClick={() => toggleSection("budget")}
            className="w-full flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Budget</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.budget ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.budget && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-3"
              >
                {/* Budget Presets */}
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleBudgetPreset(preset)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.min_rent === preset.min &&
                        filters.max_rent === (preset.max ?? undefined)
                          ? "bg-emerald-600 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Range */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Min Rent
                    </label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_rent || ""}
                      onChange={(e) => handleMinRentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Max Rent
                    </label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_rent || ""}
                      onChange={(e) => handleMaxRentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Property Type Section */}
        <motion.div
          className="border-b border-slate-200 py-4"
          layout
        >
          <button
            onClick={() => toggleSection("type")}
            className="w-full flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Property Type</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.type ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 mt-3"
              >
                {PROPERTY_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.property_type === type.value}
                      onChange={() => handleTypeChange(type.value)}
                      className="w-4 h-4 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700">{type.label}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Furnishing Section */}
        <motion.div
          className="py-4"
          layout
        >
          <button
            onClick={() => toggleSection("furnishing")}
            className="w-full flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Furnishing</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.furnishing ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.furnishing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 mt-3"
              >
                {FURNISHING.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.furnishing === item.value}
                      onChange={() => handleFurnishingChange(item.value)}
                      className="w-4 h-4 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={clearFilters}
            className="w-full mt-6 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Clear All Filters
          </motion.button>
        )}

        {/* Close Button for Mobile */}
        {isMobile && onClose && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
            className="w-full mt-6 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Apply Filters
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
