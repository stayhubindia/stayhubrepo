"use client";

import Link from "next/link";
import {
  Building2, Search, Shield, TrendingUp, Users, MapPin, ArrowRight, CheckCircle, MessageSquare, ChevronDown, ChevronRight, LogOut, Menu, X, Bell, Plus, BarChart2, Heart, Eye, Home, Filter, Headphones, Star, CheckCircle2, DollarSign, Calendar as CalendarIcon, UserRound, BedDouble, Bath, Maximize2, Wifi, LockKeyhole, Sparkles, AlertCircle, Bookmark, User as UserIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { getApiErrorMessage } from "@/lib/api-error";
import { useFavorites } from "@/modules/favorites/hooks";
import { useMyProperties } from "@/modules/properties/hooks";
import type { AppUser } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/services/http";
import type { PropertyListItem } from "@/types/property";
import { HeroSearchBar } from "@/components/home/hero-search-bar";
import "./animations.css";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ─── Static data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { emoji: "🏠", label: "PG / Hostel", sub: "Shared living", type: "PG", color: "blue" },
  { emoji: "🛏️", label: "Room Rent", sub: "Single rooms", type: "1RK", color: "violet" },
  { emoji: "🏢", label: "1 BHK", sub: "Studio flats", type: "1BHK", color: "rose" },
  { emoji: "🏡", label: "2–3 BHK", sub: "Family homes", type: "2BHK", color: "emerald" },
  { emoji: "🏬", label: "Commercial", sub: "Shops & offices", type: "COMMERCIAL", color: "amber" },
  { emoji: "🏰", label: "Villa", sub: "Premium rentals", type: "HOUSE", color: "teal" },
];

const HOW_IT_WORKS = [
  { num: "01", icon: Search, title: "Search homes", desc: "Choose a city, budget, and property type. Start with simple filters and narrow down only if needed." },
  { num: "02", icon: MessageSquare, title: "Talk to the owner", desc: "Ask questions, confirm rent, and plan a visit directly with the person listing the property." },
  { num: "03", icon: CheckCircle, title: "Visit and decide", desc: "Shortlist what you like, visit the place, and move ahead when it feels right." },
];

const CAT_COLORS: Record<string, { border: string; bg: string; icon: string; text: string; glow: string }> = {
  blue: { border: "hover:border-blue-400", bg: "hover:bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "group-hover:text-blue-700", glow: "group-hover:shadow-blue-100" },
  violet: { border: "hover:border-violet-400", bg: "hover:bg-violet-50", icon: "bg-violet-100 text-violet-600", text: "group-hover:text-violet-700", glow: "group-hover:shadow-violet-100" },
  rose: { border: "hover:border-rose-400", bg: "hover:bg-rose-50", icon: "bg-rose-100 text-rose-600", text: "group-hover:text-rose-700", glow: "group-hover:shadow-rose-100" },
  emerald: { border: "hover:border-emerald-400", bg: "hover:bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", text: "group-hover:text-emerald-700", glow: "group-hover:shadow-emerald-100" },
  amber: { border: "hover:border-amber-400", bg: "hover:bg-amber-50", icon: "bg-amber-100 text-amber-600", text: "group-hover:text-amber-700", glow: "group-hover:shadow-amber-100" },
  teal: { border: "hover:border-teal-400", bg: "hover:bg-teal-50", icon: "bg-teal-100 text-teal-600", text: "group-hover:text-teal-700", glow: "group-hover:shadow-teal-100" },
};

// ─── Logged-in dashboard home ────────────────────────────────────────────────

const TYPE_GRADIENTS: Record<string, string> = {
  PG: "from-blue-500 to-indigo-600",
  "1RK": "from-violet-500 to-purple-600",
  "1BHK": "from-rose-500 to-pink-600",
  "2BHK": "from-emerald-500 to-teal-600",
  "3BHK": "from-amber-500 to-orange-600",
  HOUSE: "from-teal-500 to-cyan-600",
  COMMERCIAL: "from-slate-500 to-slate-700",
};

const TYPE_ICONS: Record<string, string> = {
  PG: "🏠", "1RK": "🛏️", "1BHK": "🏢", "2BHK": "🏡", "3BHK": "🏡", HOUSE: "🏰", COMMERCIAL: "🏬",
};

const FURNISH_BADGE: Record<string, { label: string; cls: string }> = {
  FURNISHED: { label: "Furnished", cls: "bg-emerald-100 text-emerald-700" },
  SEMI: { label: "Semi-furnished", cls: "bg-amber-100 text-amber-700" },
  UNFURNISHED: { label: "Bare", cls: "bg-slate-100 text-slate-600" },
};

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
];

const POPULAR_SEARCHES = [
  { label: "Mumbai", params: { city: "Mumbai" } },
  { label: "Bangalore", params: { city: "Bengaluru" } },
  { label: "Delhi NCR", params: { city: "Delhi NCR" } },
  { label: "PG / Hostel", params: { property_type: "PG" } },
  { label: "Under ₹20K", params: { max_rent: "20000" } },
];

const POPULAR_LOCATIONS = [
  {
    city: "Mumbai",
    copy: "Skyline apartments and compact city homes",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=85",
  },
  {
    city: "Bengaluru",
    copy: "Work-friendly stays close to tech corridors",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=85",
  },
  {
    city: "Delhi NCR",
    copy: "Connected homes around metro-led neighborhoods",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=85",
  },
  {
    city: "Pune",
    copy: "Calm apartments near offices and campuses",
    image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, title: "Clear listings", desc: "Useful details before you visit" },
  { icon: DollarSign, title: "Rent clarity", desc: "Budget-first discovery" },
  { icon: Headphones, title: "Guided support", desc: "Help when you need it" },
  { icon: LockKeyhole, title: "Private by design", desc: "Your shortlist stays yours" },
];

const PENDING_SEARCH_STORAGE_KEY = "stayhub:pending-search-path";

function PropertyCard({ p }: { p: PropertyListItem }) {
  const grad = TYPE_GRADIENTS[p.property_type] ?? "from-slate-400 to-slate-500";
  const icon = TYPE_ICONS[p.property_type] ?? "🏠";
  const fb = FURNISH_BADGE[p.furnishing];

  return (
    <Link href={`/properties/${p.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 hover:shadow-xl shadow-sm transition-all duration-300 hover:-translate-y-1">
        {/* Image / placeholder */}
        <div className={`h-44 bg-gradient-to-br ${grad} relative flex flex-col justify-between p-4`}>
          {/* Top badges */}
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {p.property_type}
            </span>
            <button
              onClick={(e) => e.preventDefault()}
              className="w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            >
              <Heart className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* Central icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 text-7xl select-none pointer-events-none">{icon}</div>
          {/* Bottom: rent */}
          <div>
            <p className="text-white font-black text-2xl leading-none">
              ₹{Number(p.rent).toLocaleString("en-IN")}
              <span className="text-sm font-normal text-white/80 ml-1">/mo</span>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors mb-1">{p.title}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{p.locality}, {p.city}</span>
          </p>
          <div className="flex items-center gap-2 mb-3">
            {fb && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fb.cls}`}>{fb.label}</span>}
            {p.is_featured && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Featured</span>}
          </div>
          {/* Stats row */}
          <div className="flex items-center gap-4 mb-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.total_views}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{p.total_favorites}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p.total_contacts}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={(e) => e.preventDefault()}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Details
            </button>
            <button
              onClick={(e) => e.preventDefault()}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PublicPropertyCard({ p, index = 0, onAuthRequired }: { p: PropertyListItem; index?: number; onAuthRequired?: () => void }) {
  const location = [p.locality, p.city].filter(Boolean).join(", ") || "Location available after sign in";
  const image = PROPERTY_IMAGES[index % PROPERTY_IMAGES.length];
  const rent = Number(p.rent);
  const beds = p.property_type === "PG" || p.property_type === "1RK" ? 1 : p.property_type === "3BHK" ? 3 : p.property_type === "2BHK" ? 2 : 1;

  return (
    <motion.article
      onClick={() => onAuthRequired?.()}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group overflow-hidden rounded-3xl border border-white/5 bg-[#111614]/80 shadow-2xl backdrop-blur-xl relative cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative h-56 overflow-hidden sm:h-64 lg:h-60 xl:h-64 rounded-t-3xl">
        <img
          src={image}
          alt={p.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111614] via-black/10 to-transparent opacity-90" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {index % 2 === 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wide backdrop-blur-md">
              Verified
            </span>
          )}
          {index % 3 === 0 && (
            <span className="px-2.5 py-1 rounded-full bg-violet-500/90 text-white text-[10px] font-bold uppercase tracking-wide backdrop-blur-md">
              Premium
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Save property"
          onClick={(e) => { e.stopPropagation(); onAuthRequired?.(); }}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="flex -space-x-2">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}1`} alt="viewer" className="w-6 h-6 rounded-full border border-[#111614] bg-emerald-100" />
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}2`} alt="viewer" className="w-6 h-6 rounded-full border border-[#111614] bg-emerald-200" />
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}3`} alt="viewer" className="w-6 h-6 rounded-full border border-[#111614] bg-emerald-300" />
          </div>
          <span className="text-[11px] font-medium text-white/80 drop-shadow-md">{Math.max(24, p.total_views)}+ viewed today</span>
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="mb-3">
          <h3 className="line-clamp-1 text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">{p.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5 text-[11px] font-medium text-white/50">
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full"><BedDouble className="h-3 w-3 text-emerald-400" />{beds} Beds</span>
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full"><Bath className="h-3 w-3 text-emerald-400" />{beds > 1 ? 2 : 1} Baths</span>
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full"><Maximize2 className="h-3 w-3 text-emerald-400" />{beds * 420 + 280} sqft</span>
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full"><Wifi className="h-3 w-3 text-emerald-400" />Free WiFi</span>
        </div>

        <div className="flex items-end justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5 font-medium">Monthly Rent</p>
            <p className="text-xl font-black text-emerald-400 flex items-baseline gap-1">
              ₹{Number.isFinite(rent) ? rent.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : p.rent}
              <span className="text-[11px] font-medium text-white/40">/ mo</span>
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">Inclusive of maintenance</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAuthRequired?.(); }}
            className="group/btn flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}


function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  const router = useRouter();
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      router.push(`/properties?city=${encodeURIComponent(searchCity.trim())}`);
    } else {
      router.push(`/properties`);
    }
  };
  const [activeType, setActiveType] = useState("ALL");
  const [currentLocationLabel, setCurrentLocationLabel] = useState<string>("");

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async () => {
      const res = await http.get("/properties/?limit=9");
      return (res.data.results ?? res.data) as PropertyListItem[];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const isOwner = user.role === "OWNER";
  const firstName = user.first_name ?? user.email?.split("@")[0] ?? "there";

  const SIDEBAR_ITEMS = [
    { icon: Home, label: "Home", href: "/", active: true },
    { icon: Search, label: "Browse Properties", href: "/properties" },
    { icon: CalendarIcon, label: "My Bookings", href: "/bookings" },
    { icon: Heart, label: "Wishlist", href: "/favorites" },
    { icon: Bookmark, label: "Saved Searches", href: "/saved" },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: 3 },
    { icon: Star, label: "Reviews", href: "/reviews" },
    { icon: DollarSign, label: "Payments", href: "/payments" },
    { icon: Users, label: "Refer & Earn", href: "/refer" },
  ];

  return (
    <div className="flex min-h-screen bg-[#090e0c]">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#090e0c] hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">Stay<span className="text-emerald-400">Hub</span></span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {SIDEBAR_ITEMS.map((item, i) => (
            <Link key={i} href={item.href} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${item.active ? "bg-white/5 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <div className="flex items-center gap-3">
                <item.icon className={`w-4.5 h-4.5 ${item.active ? "text-emerald-400" : ""}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          {isOwner && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <Link href="/dashboard" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4.5 h-4.5" />
                  <span className="text-sm font-medium">Host Dashboard</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">New</span>
              </Link>
            </div>
          )}
        </nav>

        {/* List Property Ad */}
        <div className="p-5 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-5">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80')] opacity-20 mix-blend-overlay object-cover" />
            <div className="relative z-10">
              <h4 className="text-white font-bold text-sm mb-1">List your property</h4>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">Earn more by listing your space on StayHub.</p>
              <Link href="/my-ads" className="inline-flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/5 w-full justify-center">
                Become a Host <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-[#090e0c]/80 backdrop-blur-xl">
          {/* Mobile menu button & logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-white/70 hover:text-white p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="hidden lg:block w-full max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
            <input 
              placeholder="Search by location, property or category" 
              className="w-full bg-[#15191C] border border-white/5 rounded-xl py-2.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono border border-white/10 rounded px-1.5 py-0.5 bg-white/5">⌘K</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1 group">
              <Heart className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white">Wishlist</span>
            </Link>
            <Link href="/messages" className="hidden sm:flex flex-col items-center gap-1 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#090e0c] flex items-center justify-center text-[8px] font-bold text-white">3</span>
              </div>
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white mt-1">Messages</span>
            </Link>
            <Link href="/notifications" className="hidden sm:flex flex-col items-center gap-1 group relative">
              <div className="relative">
                <Bell className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#090e0c] flex items-center justify-center text-[8px] font-bold text-white">6</span>
              </div>
              <span className="text-[10px] font-medium text-white/50 group-hover:text-white mt-1">Notifications</span>
            </Link>
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/10 mx-2" />

            {/* Profile Dropdown Trigger */}
            <div className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-white/5 transition-colors" onClick={onSignOut}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden border border-white/10">
                <span className="text-sm font-bold text-white">
                  {user.first_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white leading-tight group-hover:text-emerald-400 transition-colors">{firstName}</p>
                <p className="text-[10px] text-white/50 leading-tight">View profile</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 pb-32 max-w-7xl mx-auto w-full space-y-12">
          
          {/* ── Hero Section ── */}
          <section className="relative z-10">
            <p className="text-emerald-400 text-sm font-semibold mb-3 flex items-center gap-2">
              Welcome back, {firstName} <span className="text-lg">👋</span>
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white mb-4 tracking-tight leading-[1.1]">
              Find your perfect <br className="hidden sm:block" />stay, <span className="text-emerald-400">your way</span>
            </h1>
            <p className="text-white/50 mb-10 max-w-md text-base leading-relaxed">
              Explore handpicked properties that match your lifestyle and comfort.
            </p>

            {/* Advanced Search Bar matching image */}
            <div className="bg-[#15191C] border border-white/5 rounded-[2rem] sm:rounded-full flex flex-col sm:flex-row items-center p-2 sm:divide-x divide-white/10 shadow-2xl shadow-black/50">
              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 sm:rounded-l-full cursor-pointer transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Where</p>
                    <p className="text-sm text-white font-medium truncate mt-0.5">Search location</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </div>
              
              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check in</p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="hidden md:flex px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Check out</p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">Select date</p>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 w-full hover:bg-white/5 cursor-pointer transition-colors group">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Guests</p>
                    <p className="text-sm text-white font-medium truncate mt-0.5">Add guests</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </div>

              <div className="p-2 shrink-0 w-full sm:w-auto">
                <button className="bg-emerald-500 hover:bg-emerald-400 text-white w-full sm:w-auto rounded-full px-8 py-4 sm:py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
          </section>

          {/* ── Featured Properties Grid ── */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1.5">Featured for you</h2>
                <p className="text-white/40 text-sm">Handpicked properties based on your preferences</p>
              </div>
              <Link href="/properties" className="hidden sm:flex text-white/60 hover:text-white text-sm items-center gap-1 transition-colors group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-[#15191C] border border-white/5 rounded-3xl h-[400px] animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-sm text-center">
                Failed to load featured properties.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {(properties || []).slice(0, 4).map((p, i) => (
                  <PremiumPropertyCard p={p} index={i} key={p.id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function PremiumPropertyCard({ p, index }: { p: PropertyListItem; index: number }) {
  const rent = Number(p.rent);
  
  // Real stats from the backend instead of dummy data
  const views = p.total_views || 0;
  const favorites = p.total_favorites || 0;
  const contacts = p.total_contacts || 0;
  
  // Create a nice gradient placeholder since backend doesn't return `images` yet
  const TYPE_GRADIENTS: Record<string, string> = {
    PG: "from-blue-500 to-indigo-600",
    "1RK": "from-violet-500 to-purple-600",
    "1BHK": "from-rose-500 to-pink-600",
    "2BHK": "from-emerald-500 to-teal-600",
    "3BHK": "from-amber-500 to-orange-600",
    HOUSE: "from-cyan-500 to-blue-600",
    COMMERCIAL: "from-slate-500 to-slate-700",
  };
  const grad = TYPE_GRADIENTS[p.property_type] ?? "from-slate-600 to-slate-800";

  return (
    <Link href={`/properties/${p.id}`} className="group block">
      <div className="bg-[#15191C] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 h-full flex flex-col">
        
        {/* Image / Gradient Half */}
        <div className={`relative h-48 w-full overflow-hidden shrink-0 bg-gradient-to-br ${grad}`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-transform duration-700 group-hover:scale-110">
             <Building2 className="w-16 h-16 text-white" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#15191C] via-transparent to-transparent opacity-80" />
          
          {p.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-lg uppercase tracking-wide bg-amber-500">
                Featured
              </span>
            </div>
          )}

          <button onClick={(e) => e.preventDefault()} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-emerald-500/80 transition-colors border border-white/10 shadow-lg">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Content Half */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-white text-[15px] line-clamp-1 group-hover:text-emerald-400 transition-colors mb-1.5">
            {p.title}
          </h3>
          <p className="text-white/40 text-xs flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{p.locality}, {p.city}</span>
          </p>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-400">₹{rent.toLocaleString("en-IN")}</span>
            <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">/ month</span>
          </div>

          <div className="flex items-center gap-3 text-white/50 text-[11px] mb-4 mt-auto font-medium">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-emerald-400/80"><Building2 className="w-3 h-3" /> {p.property_type}</div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-emerald-400/80"><Home className="w-3 h-3" /> {p.furnishing}</div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-white/30 text-xs font-medium">
             <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {views}</span>
             <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {favorites}</span>
             <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {contacts}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
// ─── Scroll-aware Navbar ─────────────────────────────────────────────────────

function Navbar({ onOpenAuth }: { onOpenAuth: (role: "TENANT" | "OWNER") => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#090e0c]/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-5"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:bg-emerald-500/20 transition-all">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Stay<span className="text-emerald-400">Hub</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          {[
            ["Home", "#top"],
            ["Browse", "#featured"],
            ["Categories", "#categories"],
            ["How it works", "#how-it-works"],
            ["About us", "#about"],
          ].map(([label, href]) => (
            <a key={label} href={href} className="transition-colors hover:text-white relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-emerald-400 hover:after:w-full after:transition-all after:duration-300">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/favorites"
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 lg:inline-flex"
          >
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
          <button
            onClick={() => onOpenAuth("TENANT")}
            className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] sm:inline-flex"
          >
            <UserRound className="h-4 w-4" />
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>



      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-[#090e0c]/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {[
                ["Home", "#top"],
                ["Browse", "#featured"],
                ["Categories", "#categories"],
                ["How it works", "#how-it-works"],
                ["About us", "#about"],
              ].map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
                  {label}
                </a>
              ))}
              <div className="pt-4 pb-2">
                <button onClick={() => { setMobileOpen(false); onOpenAuth("TENANT"); }} className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  Sign in / Sign up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Improved Footer ─────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#090e0c]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Home className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">Stay<span className="text-emerald-400">Hub</span></span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-white/50 mb-6">
              Discover handpicked properties for rent that match your lifestyle. A cinematic property discovery platform for renters who want clarity, calm, and better spaces.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60"><Building2 size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60"><Users size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60"><MessageSquare size={18} /></div>
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-4 text-sm text-white/50">
              {[["Browse homes", "/properties"], ["List a property", "/auth?role=OWNER"], ["Sign in", "/auth"], ["Saved homes", "/favorites"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-emerald-400">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold text-white uppercase tracking-wider">Support</h4>
            <ul className="space-y-4 text-sm text-white/50">
              {[["Contact Us", "/contact"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["FAQ", "#"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-emerald-400">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} StayHub Technologies. India&apos;s zero-brokerage rental platform.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Public landing page ─────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<"TENANT" | "OWNER">("TENANT");
  const [searchQuery, setSearchQuery] = useState("");
  const [publicPropertyType, setPublicPropertyType] = useState("");
  const [publicMaxRent, setPublicMaxRent] = useState("");
  const [pendingSearchPath, setPendingSearchPath] = useState<string | undefined>();
  const {
    data: publicProperties,
    isLoading: isPublicPropertiesLoading,
    isError: isPublicPropertiesError,
  } = useQuery({
    queryKey: ["properties", "public-home"],
    queryFn: async () => {
      const res = await http.get("/properties/search/?limit=6&ordering=-created_at");
      return (res.data.results ?? res.data) as PropertyListItem[];
    },
    enabled: !user,
    retry: 1,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedSearchPath = window.localStorage.getItem(PENDING_SEARCH_STORAGE_KEY);
    if (savedSearchPath) setPendingSearchPath(savedSearchPath);
  }, []);

  const handleSignOut = () => { clearSession(); router.push("/"); };
  const buildPropertySearchPath = (next?: { city?: string; property_type?: string; max_rent?: string }) => {
    const params = new URLSearchParams();
    const city = next?.city ?? searchQuery.trim();
    const propertyType = next?.property_type ?? publicPropertyType;
    const maxRent = next?.max_rent ?? publicMaxRent;

    if (city) params.set("city", city);
    if (propertyType) params.set("property_type", propertyType);
    if (maxRent) params.set("max_rent", maxRent);

    const queryString = params.toString();
    return queryString ? `/properties?${queryString}` : "/properties";
  };
  const requestSearchAuth = (path: string) => {
    setPendingSearchPath(path);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PENDING_SEARCH_STORAGE_KEY, path);
    }
    setAuthRole("TENANT");
    setAuthModalOpen(true);
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    requestSearchAuth(buildPropertySearchPath());
  };

  if (user) return <LoggedInHome user={user} onSignOut={handleSignOut} />;

  return (
    <div className="min-h-screen bg-[#090e0c] font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar onOpenAuth={(role) => { setAuthRole(role); setAuthModalOpen(true); }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden" id="top">
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
          {/* Dark overlay base */}
          <div className="absolute inset-0 bg-[#090e0c]" />
          {/* Ambient glowing orbs */}
          <div className="absolute top-0 right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
          {/* Background Image */}
          <div className="absolute inset-x-0 top-0 h-[85vh] opacity-30 mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80" alt="Luxury home interior" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#090e0c]/50 via-[#090e0c]/80 to-[#090e0c]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] font-bold text-white tracking-tight mb-6"
            >
              Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">stay anywhere</span> <Sparkles className="inline-block w-10 h-10 sm:w-12 sm:h-12 text-emerald-400/80 -mt-6" />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
              className="text-lg sm:text-xl text-white/60 max-w-xl font-medium leading-relaxed"
            >
              Discover handpicked properties for rent that match your lifestyle. Zero brokerage, verified listings, seamless experience.
            </motion.p>
          </div>

          {/* Search Floating Glass Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <form
              onSubmit={handleSearch}
              className="relative rounded-3xl sm:rounded-full bg-[#151c19]/60 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center gap-2 max-w-5xl"
            >
              {/* Where */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors cursor-text group relative after:hidden sm:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:bg-white/10">
                <label htmlFor="hero-search" className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 cursor-text">Where</label>
                <div className="flex items-center gap-2">
                  <input
                    id="hero-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city, locality..."
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-medium"
                  />
                  <ChevronDown className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Property Type */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors relative after:hidden sm:after:block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-8 after:bg-white/10">
                <label className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1">Property Type</label>
                <div className="flex items-center gap-2">
                  <select
                    value={publicPropertyType}
                    onChange={(e) => setPublicPropertyType(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-white outline-none font-medium appearance-none cursor-pointer [&>option]:bg-[#111614] [&>option]:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="PG">PG / Hostel</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Budget */}
              <div className="flex-1 w-full sm:w-auto px-5 py-3 sm:py-2 hover:bg-white/5 rounded-2xl sm:rounded-full transition-colors relative">
                <label className="block text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1">Max Budget</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={publicMaxRent}
                    onChange={(e) => setPublicMaxRent(e.target.value)}
                    placeholder="Any budget"
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-medium"
                  />
                  <ChevronDown className="w-4 h-4 text-white/40 opacity-0 transition-opacity" />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto mt-2 sm:mt-0 px-8 py-4 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl sm:rounded-full font-bold text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 shrink-0"
              >
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>

            {/* Popular Searches Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-white/50 mr-2">Popular searches:</span>
              {[
                { label: "Mumbai", params: { city: "Mumbai" } },
                { label: "Bangalore", params: { city: "Bengaluru" } },
                { label: "Delhi", params: { city: "Delhi NCR" } },
                { label: "Hyderabad", params: { city: "Hyderabad" } },
                { label: "Noida", params: { city: "Noida" } },
                { label: "PG / Hostel", params: { property_type: "PG" } },
                { label: "Under ₹20K", params: { max_rent: "20000" } },
                { label: "Fully Furnished", params: {} },
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => {
                    requestSearchAuth(buildPropertySearchPath(filter.params));
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all hover:text-white"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────────────────────── */}
      <section className="py-20 relative z-10" id="featured">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">Featured Properties <Sparkles className="w-6 h-6 text-emerald-400" /></h2>
              <p className="mt-2 text-white/50 font-medium">Handpicked stays for you</p>
            </div>
            <Link
              href="/properties"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              View all properties
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {isPublicPropertiesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 rounded-3xl border border-white/5 bg-[#111614] animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              ))}
            </div>
          ) : isPublicPropertiesError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm font-medium text-red-400">
              Could not load properties right now.
            </div>
          ) : (publicProperties?.length ?? 0) > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {publicProperties?.map((property, idx) => (
                <motion.div key={property.id} variants={fadeUp}>
                  <PublicPropertyCard p={property} index={idx} onAuthRequired={() => requestSearchAuth("/properties")} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-white/20" />
              <p className="font-semibold text-white">No properties are listed yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust / Features ───────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/10 bg-[#111614]/50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Verified & Trusted", desc: "All properties are verified" },
              { icon: CheckCircle2, title: "Best Price Guarantee", desc: "Get the best deals" },
              { icon: Headphones, title: "24/7 Support", desc: "We&apos;re here to help" },
              { icon: LockKeyhole, title: "Secure & Easy", desc: "Hassle-free experience" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                  <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by type ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-20 sm:px-8" id="categories">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Browse by property type</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
            Find exactly what you are looking for.
          </p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {CATEGORIES.map((cat) => {
            return (
              <motion.div key={cat.type} variants={fadeUp}>
                <Link
                  href={`/properties?property_type=${cat.type}`}
                  className={`group block rounded-3xl border border-white/10 bg-[#111614] p-5 text-center transition-all hover:bg-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1`}
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl bg-white/5 group-hover:scale-110 transition-transform`}>{cat.emoji}</div>
                  <p className={`mt-4 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors`}>{cat.label}</p>
                  <p className="mt-1 text-[11px] text-white/40">{cat.sub}</p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#111614] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">What Our Users Say</h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                rating: 5,
                text: "Found my perfect apartment in just 3 days. The direct contact with the owner made everything so easy. Highly recommend!",
                name: "Priya Sharma",
                role: "Student",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
              },
              {
                rating: 5,
                text: "Zero brokerage is a game changer. Saved so much money compared to traditional portals. The verification process gave me peace of mind.",
                name: "Rajesh Kumar",
                role: "Young Professional",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh",
              },
              {
                rating: 5,
                text: "The support team was incredibly helpful. They answered all my questions and even helped me negotiate with the owner. Great experience!",
                name: "Ananya Patel",
                role: "Working Mom",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya",
              },
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="rounded-3xl p-6 transition-all hover:bg-white/[0.04] bg-[#090e0c] border border-white/10 hover:border-emerald-500/20 group hover:-translate-y-1 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array(testimonial.rating).fill(0).map((_, j) => (
                      <Star key={j} size={14} className="fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>

                  <p className="text-sm leading-relaxed mb-6 text-white/70 italic flex-1">
                    &quot;{testimonial.text}&quot;
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white/5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-[11px] text-white/40">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authRole}
        redirectTo={pendingSearchPath}
        onAuthenticated={() => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(PENDING_SEARCH_STORAGE_KEY);
          }
        }}
      />
    </div>

  );
}
