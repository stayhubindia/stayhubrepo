"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Heart, MapPin, IndianRupee, Search, Building2,
  Menu, Bell, MessageSquare, ChevronDown, Plus,
  Clock, MoreVertical, BedDouble, Home, Trash2, Info
} from "lucide-react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useSavedSearchesStore } from "@/store/saved-searches-store";
import { useUnreadCount } from "@/hooks/use-unread-count";

export default function SavedSearchesPage() {
  const { user, isAllowed } = useRequireAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  const { searches, addSearch, removeSearch, toggleAlert } = useSavedSearchesStore();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const handleNewSearch = () => {
    // Adds a mock search to demonstrate LocalStorage functionality
    addSearch({
      title: "Luxury Villas in Goa",
      status: "Active",
      location: null,
      location_city: "Goa",
      location_state: "Goa",
      property_type: "Villa",
      furnishing: "Furnished",
      min_rent: "50000",
      max_rent: "150000",
      config: "4 BHK",
      alerts_on: true,
      results_count: 3,
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&q=80",
    });
  };

  const filteredSearches = useMemo(() => {
    return searches.filter(search => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return search.status === "Active";
      if (activeTab === "inactive") return search.status === "Inactive";
      return true;
    });
  }, [searches, activeTab]);

  const totalSearches = searches.length;
  const activeAlerts = searches.filter(s => s.alerts_on).length;
  const newProperties = searches.reduce((acc, curr) => acc + ((curr.results_count ?? 0) > 5 ? 3 : 1), 0); // Mock metric
  const matchesFound = searches.reduce((acc, curr) => acc + (curr.results_count ?? 0), 0);

  const formatAddedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatUpdatedTime = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (!isAllowed || !user) return null;

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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Wishlist</span>
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
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-1.5">Saved Searches</h1>
              <p className="text-slate-500 text-sm">Quick access to your saved search filters and alerts</p>
            </div>
            <button 
              onClick={handleNewSearch}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Search
            </button>
          </div>

          {/* localStorage Notice */}
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6">
            <Info className="w-4 h-4 shrink-0" />
            Saved searches are stored locally on this device. Clearing your browser data will remove them.
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Saved Searches</p>
                <p className="text-2xl font-black text-slate-900">{totalSearches}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Active Alerts</p>
                <p className="text-2xl font-black text-slate-900">{activeAlerts}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">New Properties</p>
                <p className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">{newProperties} <span className="text-xs font-medium text-slate-400 lowercase normal-case tracking-normal">in last 7 days</span></p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Matches Found</p>
                <p className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">{matchesFound} <span className="text-xs font-medium text-slate-400 lowercase normal-case tracking-normal">across all searches</span></p>
              </div>
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab("all")}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${activeTab === "all" ? "text-emerald-600 border-emerald-500" : "text-slate-500 border-transparent hover:text-slate-900"}`}
              >
                All Searches ({searches.length})
              </button>
              <button 
                onClick={() => setActiveTab("active")}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${activeTab === "active" ? "text-emerald-600 border-emerald-500" : "text-slate-500 border-transparent hover:text-slate-900"}`}
              >
                Active ({searches.filter(s => s.status === "Active").length})
              </button>
              <button 
                onClick={() => setActiveTab("inactive")}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${activeTab === "inactive" ? "text-emerald-600 border-emerald-500" : "text-slate-500 border-transparent hover:text-slate-900"}`}
              >
                Inactive ({searches.filter(s => s.status === "Inactive").length})
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium self-start sm:self-auto">
              Sort by: <span className="font-bold text-slate-900 flex items-center gap-1 cursor-pointer">Recently Updated <ChevronDown className="w-4 h-4" /></span>
            </div>
          </div>

          {/* Saved Searches List */}
          <div className="flex flex-col gap-4 mb-24">
            {filteredSearches.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No saved searches found</h3>
                <p className="text-slate-500 mb-6">Create a new search to track properties you care about.</p>
                <button 
                  onClick={handleNewSearch}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Search
                </button>
              </div>
            ) : (
              filteredSearches.map((search) => (
                <div key={search.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-5 hover:border-emerald-500/30 transition-all hover:shadow-md">
                  {/* Image */}
                  <div className="h-32 w-full md:w-56 shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                    <img src={search.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"} alt="Property search" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>

                  {/* Info Content */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-extrabold text-slate-900 text-[17px] truncate">{search.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        search.status === "Active" 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {search.status}
                      </span>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {search.location_city}, {search.location_state}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Home className="w-3.5 h-3.5 text-slate-400" /> {search.property_type}
                      </div>
                      {search.config && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <BedDouble className="w-3.5 h-3.5 text-slate-400" /> {search.config}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> ₹{Number(search.min_rent).toLocaleString("en-IN")} - ₹{Number(search.max_rent).toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Footnote */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      Added on {formatAddedDate(search.created_at)} <span className="text-slate-300">•</span> Updated {formatUpdatedTime(search.updated_at)}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <button 
                        onClick={() => toggleAlert(search.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${search.alerts_on ? "text-emerald-600 hover:text-emerald-700" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <Bell className={`w-3.5 h-3.5 ${search.alerts_on ? "fill-emerald-600" : ""}`} /> 
                        {search.alerts_on ? "Alerts On" : "Alerts Off"}
                      </button>
                      <button 
                        onClick={() => removeSearch(search.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors group"
                        title="Delete Search"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    
                    <button className="px-5 py-2 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm font-bold transition-colors w-full md:w-auto text-center hidden md:block">
                      View Results ({search.results_count})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Alert Bar */}
      <div className="fixed bottom-0 lg:bottom-4 left-0 lg:left-[280px] right-0 lg:right-4 z-40 p-4 lg:p-0">
        <div className="bg-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border border-emerald-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mx-auto sm:mx-0 shadow-md shadow-emerald-500/20">
              <Bell className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Get notified about new matches</p>
              <p className="text-xs text-slate-500 mt-0.5">We&apos;ll notify you when new properties match your saved search criteria.</p>
            </div>
          </div>
          <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2">
            Manage Alerts
          </button>
        </div>
      </div>
    </div>
  );
}
