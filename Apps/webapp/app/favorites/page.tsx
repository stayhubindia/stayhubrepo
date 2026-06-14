"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MapPin, IndianRupee, Trash2, Search, Building2,
  Grid, List as ListIcon, ChevronDown, Menu, Bell, MessageSquare,
  Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useFavorites, useFavoriteMutations } from "@/modules/favorites/hooks";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "apartment", label: "Apartments" },
  { id: "house", label: "Independent House" },
  { id: "villa", label: "Villa" },
  { id: "pg", label: "PG / Hostel" },
];

// Helper to roughly categorize based on title
const guessCategory = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("pg") || t.includes("hostel")) return "pg";
  if (t.includes("villa")) return "villa";
  if (t.includes("house") || t.includes("independent")) return "house";
  if (t.includes("apartment") || t.includes("bhk") || t.includes("rk") || t.includes("flat")) return "apartment";
  return "apartment"; // default fallback
};

export default function FavoritesPage() {
  const { user, isAllowed } = useRequireAuth();
  const favoritesQuery = useFavorites(!!user);
  const { removeMutation } = useFavoriteMutations();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const favorites = useMemo(() => favoritesQuery.data ?? [], [favoritesQuery.data]);

  const filtered = useMemo(() => {
    let result = favorites;
    
    // Filter by search
    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter(f => 
        f.property_title.toLowerCase().includes(q) ||
        f.property_city?.toLowerCase().includes(q)
      );
    }

    // Filter by tab
    if (activeTab !== "all") {
      result = result.filter(f => guessCategory(f.property_title) === activeTab);
    }

    return result;
  }, [favorites, searchQuery, activeTab]);

  const handleRemove = async (propertyId: string) => {
    setRemoving(propertyId);
    try {
      await removeMutation.mutateAsync(propertyId);
    } finally {
      setRemoving(null);
    }
  };

  if (!isAllowed || !user) return null;

  // Counts for tabs
  const getCount = (catId: string) => {
    if (catId === "all") return favorites.length;
    return favorites.filter(f => guessCategory(f.property_title) === catId).length;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))} className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Search by location, property or category" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-emerald-500 transition-colors" />
              <span className="text-[10px] font-semibold text-emerald-600">Wishlist</span>
            </Link>
            <Link href="/chats" className="hidden sm:flex flex-col items-center gap-1.5 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
                {!unreadLoading && !unreadError && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-900 mt-1">Messages</span>
            </Link>
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            
            <div className="hidden sm:block w-px h-8 bg-slate-100 mx-2" />
            <ProfileDropdown />
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          
          {/* Header Title */}
          <div className="flex items-center gap-4 mb-2">
            <Heart className="w-8 h-8 text-emerald-500 stroke-[2.5]" />
            <h1 className="text-3xl font-black text-slate-900">My Wishlist</h1>
          </div>
          <p className="text-slate-500 mb-8 ml-12">Properties you&apos;ve saved for later</p>

          {/* Filters & Actions Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
              {CATEGORIES.map(cat => {
                const count = getCount(cat.id);
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      isActive 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 self-start xl:self-auto shrink-0">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                Sort by: <span className="font-bold text-slate-900 flex items-center gap-1 cursor-pointer">Recently Added <ChevronDown className="w-4 h-4" /></span>
              </div>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                <button className="p-1.5 rounded bg-emerald-50 text-emerald-600"><Grid className="w-4 h-4" /></button>
                <button className="p-1.5 rounded text-slate-400 hover:text-slate-600"><ListIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {favoritesQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[300px] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!favoritesQuery.isLoading && filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">No properties found</h2>
              <p className="text-slate-500 mb-6">You haven&apos;t saved any properties that match your filters.</p>
              <button 
                onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
            <AnimatePresence>
              {filtered.map((fav) => {
                const isRemoving = removing === fav.property_id;
                
                return (
                  <motion.div
                    key={fav.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {/* Image Placeholder */}
                    <div className="relative h-48 w-full bg-slate-100 shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" 
                        alt="Property"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-lg uppercase tracking-wide bg-emerald-500">
                          Saved
                        </span>
                      </div>
                      
                      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-md">
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-extrabold text-slate-900 text-[15px] line-clamp-1 mb-1.5">
                        {fav.property_title}
                      </h3>
                      <p className="text-slate-400 text-xs flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{fav.property_city || "Location details upon request"}</span>
                      </p>

                      <div className="mb-6 flex items-baseline gap-1">
                        <span className="text-xl font-black text-emerald-500 tracking-tight">₹{Number(fav.property_rent).toLocaleString("en-IN")}</span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">/month</span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                           <Sparkles className="w-3 h-3 text-amber-500" /> 
                           Added {new Date(fav.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemove(fav.property_id);
                          }}
                          disabled={isRemoving}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 lg:bottom-4 left-0 lg:left-[280px] right-0 lg:right-4 z-40 p-4 lg:p-0">
        <div className="bg-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{favorites.length} properties in your wishlist</p>
              <p className="text-xs text-slate-500 mt-0.5">Keep exploring and find the perfect place to stay.</p>
            </div>
          </div>
          <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-emerald-200 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Clear Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
