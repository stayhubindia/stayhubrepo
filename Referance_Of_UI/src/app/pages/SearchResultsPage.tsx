import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search, SlidersHorizontal, MapPin, X, ChevronDown, Star,
  ShieldCheck, Zap, Heart, Map, Grid3X3, List, ArrowLeft
} from "lucide-react";
import { PropertyCard } from "../components/PropertyCard";
import { properties, trendingProperties } from "../data/mockData";

const ALL_PROPERTIES = [...properties, ...trendingProperties].filter(
  (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
);

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([3000, 20000]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [foodIncluded, setFoodIncluded] = useState(false);
  const [nearMetro, setNearMetro] = useState(false);
  const [sortBy, setSortBy] = useState("Recommended");
  const [searchQuery, setSearchQuery] = useState("Bengaluru");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const amenities = ["WiFi", "AC", "Laundry", "Parking", "Gym", "CCTV"];
  const propertyTypes = ["PG for Boys", "PG for Girls", "Hostel", "Flat", "Co-living"];
  const sortOptions = ["Recommended", "Price: Low to High", "Price: High to Low", "Highest Rated"];

  const toggleFilter = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const filtered = useMemo(() => {
    return ALL_PROPERTIES.filter((p) => {
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (foodIncluded && !p.tags.includes("Food Included")) return false;
      if (nearMetro && !p.tags.includes("Near Metro")) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => p.tags.includes(a))) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.price - b.price;
      if (sortBy === "Price: High to Low") return b.price - a.price;
      if (sortBy === "Highest Rated") return b.rating - a.rating;
      return 0;
    });
  }, [priceRange, foodIncluded, nearMetro, selectedAmenities, selectedTypes, sortBy]);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="text-sm mb-4" style={{ color: "#0F172A", fontWeight: 700 }}>Price Range / Month</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg flex-1 text-center" style={{ backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: 600 }}>
              ₹{priceRange[0].toLocaleString("en-IN")}
            </span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>—</span>
            <span className="text-xs px-3 py-1.5 rounded-lg flex-1 text-center" style={{ backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: 600 }}>
              ₹{priceRange[1].toLocaleString("en-IN")}
            </span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min={3000}
              max={30000}
              step={500}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              className="w-full accent-blue-700"
            />
            <input
              type="range"
              min={3000}
              max={30000}
              step={500}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-blue-700"
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: "#94A3B8" }}>
            <span>₹3,000</span>
            <span>₹30,000</span>
          </div>
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: "#F1F5F9" }} />

      {/* Property Type */}
      <div>
        <h3 className="text-sm mb-3" style={{ color: "#0F172A", fontWeight: 700 }}>Property Type</h3>
        <div className="space-y-2">
          {propertyTypes.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div
                className="w-4 h-4 rounded flex items-center justify-center border transition-all"
                style={{
                  borderColor: selectedTypes.includes(type) ? "#1D4ED8" : "#CBD5E1",
                  backgroundColor: selectedTypes.includes(type) ? "#1D4ED8" : "white",
                }}
                onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
              >
                {selectedTypes.includes(type) && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm" style={{ color: "#334155" }}>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: "#F1F5F9" }} />

      {/* Food */}
      <div>
        <h3 className="text-sm mb-3" style={{ color: "#0F172A", fontWeight: 700 }}>Meals</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm" style={{ color: "#334155" }}>Food Included 🍱</span>
          <div
            className="w-10 h-6 rounded-full transition-all relative cursor-pointer"
            style={{ backgroundColor: foodIncluded ? "#1D4ED8" : "#E2E8F0" }}
            onClick={() => setFoodIncluded(!foodIncluded)}
          >
            <div
              className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
              style={{ left: foodIncluded ? "22px" : "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
            />
          </div>
        </label>
      </div>

      <div className="h-px" style={{ backgroundColor: "#F1F5F9" }} />

      {/* Near Metro */}
      <div>
        <h3 className="text-sm mb-3" style={{ color: "#0F172A", fontWeight: 700 }}>Location</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm" style={{ color: "#334155" }}>Near Metro 🚇</span>
          <div
            className="w-10 h-6 rounded-full transition-all relative cursor-pointer"
            style={{ backgroundColor: nearMetro ? "#1D4ED8" : "#E2E8F0" }}
            onClick={() => setNearMetro(!nearMetro)}
          >
            <div
              className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
              style={{ left: nearMetro ? "22px" : "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
            />
          </div>
        </label>
      </div>

      <div className="h-px" style={{ backgroundColor: "#F1F5F9" }} />

      {/* Amenities */}
      <div>
        <h3 className="text-sm mb-3" style={{ color: "#0F172A", fontWeight: 700 }}>Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => (
            <button
              key={a}
              onClick={() => toggleFilter(selectedAmenities, setSelectedAmenities, a)}
              className="px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                backgroundColor: selectedAmenities.includes(a) ? "#EFF6FF" : "#F1F5F9",
                color: selectedAmenities.includes(a) ? "#1D4ED8" : "#64748B",
                border: `1.5px solid ${selectedAmenities.includes(a) ? "#1D4ED8" : "transparent"}`,
                fontWeight: selectedAmenities.includes(a) ? 600 : 400,
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          setPriceRange([3000, 20000]);
          setSelectedGender([]);
          setSelectedAmenities([]);
          setSelectedTypes([]);
          setFoodIncluded(false);
          setNearMetro(false);
        }}
        className="w-full py-2.5 rounded-xl text-sm transition-all hover:bg-red-50"
        style={{ color: "#EF4444", border: "1.5px solid #FEE2E2", fontWeight: 600 }}
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Top Search Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <ArrowLeft size={18} style={{ color: "#0F172A" }} />
          </button>

          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
            <Search size={16} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "#0F172A" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} style={{ color: "#94A3B8" }} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white cursor-pointer">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm outline-none bg-transparent cursor-pointer"
              style={{ color: "#0F172A", fontWeight: 500 }}
            >
              {sortOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            className="lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            style={{ color: "#0F172A", fontWeight: 500 }}
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:block">Filters</span>
          </button>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F1F5F9" }}>
            {([["grid", Grid3X3], ["list", List]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="p-2 rounded-lg transition-all"
                style={{ backgroundColor: viewMode === mode ? "white" : "transparent", boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}
              >
                <Icon size={16} style={{ color: viewMode === mode ? "#1D4ED8" : "#94A3B8" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className="hidden lg:block flex-shrink-0 bg-white rounded-2xl p-6 h-fit sticky"
            style={{ width: "280px", top: "128px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base" style={{ color: "#0F172A", fontWeight: 700 }}>Filters</h2>
              <div
                className="text-xs px-2 py-1 rounded-lg"
                style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}
              >
                {filtered.length} results
              </div>
            </div>
            <FilterPanel />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-base" style={{ color: "#0F172A", fontWeight: 700 }}>
                  {filtered.length} Stays in{" "}
                  <span style={{ color: "#1D4ED8" }}>{searchQuery || "Your City"}</span>
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Based on your filters</p>
              </div>
              {/* Active filter chips */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {nearMetro && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                    Near Metro <X size={10} className="cursor-pointer" onClick={() => setNearMetro(false)} />
                  </span>
                )}
                {foodIncluded && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                    Food Included <X size={10} className="cursor-pointer" onClick={() => setFoodIncluded(false)} />
                  </span>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 style={{ color: "#0F172A", fontWeight: 700 }}>No stays found</h3>
                <p className="text-sm mt-2" style={{ color: "#94A3B8" }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
              }>
                {filtered.map((property) =>
                  viewMode === "grid" ? (
                    <PropertyCard key={property.id} property={property} />
                  ) : (
                    /* List view */
                    <div
                      key={property.id}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer flex flex-col sm:flex-row hover:-translate-y-0.5 transition-all"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <div className="sm:w-60 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                        {property.verified && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white" style={{ backgroundColor: "rgba(29,78,216,0.85)" }}>
                            <ShieldCheck size={11} /> Verified
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>{property.type}</span>
                            <div className="flex items-center gap-1">
                              <Star size={14} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                              <span className="text-sm" style={{ fontWeight: 600 }}>{property.rating}</span>
                              <span className="text-xs" style={{ color: "#94A3B8" }}>({property.reviews})</span>
                            </div>
                          </div>
                          <h3 className="mb-1" style={{ color: "#0F172A", fontWeight: 600, fontSize: "0.95rem" }}>{property.title}</h3>
                          <div className="flex items-center gap-1 mb-3">
                            <MapPin size={12} style={{ color: "#94A3B8" }} />
                            <span className="text-xs" style={{ color: "#64748B" }}>{property.location}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {property.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                          <div>
                            <span className="text-xl" style={{ color: "#0F172A", fontWeight: 700 }}>₹{property.price.toLocaleString("en-IN")}</span>
                            <span className="text-xs ml-1" style={{ color: "#94A3B8" }}>/month</span>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                              <Heart size={16} style={{ color: "#94A3B8" }} />
                            </button>
                            <button
                              className="px-5 py-2 text-sm text-white rounded-xl hover:opacity-90"
                              style={{ backgroundColor: "#1D4ED8", fontWeight: 600 }}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 overflow-y-auto"
            style={{ maxHeight: "85vh" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base" style={{ fontWeight: 700, color: "#0F172A" }}>Filter Stays</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <X size={18} style={{ color: "#64748B" }} />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-4 mt-6 text-white rounded-2xl"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 700 }}
            >
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
