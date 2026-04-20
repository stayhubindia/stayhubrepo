"use client";

import Link from "next/link";
import {
  Building2, Search, Shield, TrendingUp, Users, MapPin,
  ArrowRight, CheckCircle, MessageSquare, ChevronDown,
  LogOut, Menu, X, Bell, Plus, BarChart2, Heart, Eye, Home, Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import type { AppUser } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/services/http";
import type { PropertyListItem } from "@/types/property";
import "./animations.css";
import { motion, AnimatePresence } from "framer-motion";

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// ─── Static data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { emoji: "🏠", label: "PG / Hostel",  sub: "Shared living",   type: "PG",         color: "blue"    },
  { emoji: "🛏️", label: "Room Rent",    sub: "Single rooms",    type: "1RK",        color: "violet"  },
  { emoji: "🏢", label: "1 BHK",        sub: "Studio flats",    type: "1BHK",       color: "rose"    },
  { emoji: "🏡", label: "2–3 BHK",      sub: "Family homes",    type: "2BHK",       color: "emerald" },
  { emoji: "🏬", label: "Commercial",   sub: "Shops & offices", type: "COMMERCIAL", color: "amber"   },
  { emoji: "🏰", label: "Villa",        sub: "Premium rentals", type: "HOUSE",      color: "teal"    },
];

const STATS = [
  { value: "10,000+", label: "Properties" },
  { value: "50+",     label: "Cities"     },
  { value: "25K+",    label: "Tenants"    },
  { value: "₹0",      label: "Brokerage"  },
];

const HOW_IT_WORKS = [
  { num: "01", icon: Search,        title: "Search homes", desc: "Choose a city, budget, and property type. Start with simple filters and narrow down only if needed." },
  { num: "02", icon: MessageSquare, title: "Talk to the owner", desc: "Ask questions, confirm rent, and plan a visit directly with the person listing the property." },
  { num: "03", icon: CheckCircle,   title: "Visit and decide", desc: "Shortlist what you like, visit the place, and move ahead when it feels right." },
];

const POPULAR_CITIES = ["Mumbai", "Bangalore", "Delhi", "Pune", "Hyderabad", "Chennai", "Ahmedabad", "Jaipur"];

const CAT_COLORS: Record<string, { border: string; bg: string; icon: string; text: string; glow: string }> = {
  blue:    { border: "hover:border-blue-400",    bg: "hover:bg-blue-50",    icon: "bg-blue-100 text-blue-600",     text: "group-hover:text-blue-700",    glow: "group-hover:shadow-blue-100"    },
  violet:  { border: "hover:border-violet-400",  bg: "hover:bg-violet-50",  icon: "bg-violet-100 text-violet-600", text: "group-hover:text-violet-700",  glow: "group-hover:shadow-violet-100"  },
  rose:    { border: "hover:border-rose-400",    bg: "hover:bg-rose-50",    icon: "bg-rose-100 text-rose-600",     text: "group-hover:text-rose-700",    glow: "group-hover:shadow-rose-100"    },
  emerald: { border: "hover:border-emerald-400", bg: "hover:bg-emerald-50", icon: "bg-emerald-100 text-emerald-600",text:"group-hover:text-emerald-700", glow: "group-hover:shadow-emerald-100" },
  amber:   { border: "hover:border-amber-400",   bg: "hover:bg-amber-50",   icon: "bg-amber-100 text-amber-600",   text: "group-hover:text-amber-700",  glow: "group-hover:shadow-amber-100"   },
  teal:    { border: "hover:border-teal-400",    bg: "hover:bg-teal-50",    icon: "bg-teal-100 text-teal-600",     text: "group-hover:text-teal-700",   glow: "group-hover:shadow-teal-100"    },
};

// ─── Logged-in dashboard home ────────────────────────────────────────────────

const TYPE_GRADIENTS: Record<string, string> = {
  PG:         "from-blue-500 to-indigo-600",
  "1RK":      "from-violet-500 to-purple-600",
  "1BHK":     "from-rose-500 to-pink-600",
  "2BHK":     "from-emerald-500 to-teal-600",
  "3BHK":     "from-amber-500 to-orange-600",
  HOUSE:      "from-teal-500 to-cyan-600",
  COMMERCIAL: "from-slate-500 to-slate-700",
};

const TYPE_ICONS: Record<string, string> = {
  PG: "🏠", "1RK": "🛏️", "1BHK": "🏢", "2BHK": "🏡", "3BHK": "🏡", HOUSE: "🏰", COMMERCIAL: "🏬",
};

const FURNISH_BADGE: Record<string, { label: string; cls: string }> = {
  FURNISHED:   { label: "Furnished",      cls: "bg-emerald-100 text-emerald-700" },
  SEMI:        { label: "Semi-furnished", cls: "bg-amber-100 text-amber-700"    },
  UNFURNISHED: { label: "Bare",           cls: "bg-slate-100 text-slate-600"    },
};

function PropertyCard({ p }: { p: PropertyListItem }) {
  const grad = TYPE_GRADIENTS[p.property_type] ?? "from-slate-400 to-slate-500";
  const icon = TYPE_ICONS[p.property_type] ?? "🏠";
  const fb   = FURNISH_BADGE[p.furnishing];

  return (
    <Link href={`/properties/${p.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 hover:shadow-xl shadow-sm transition-all duration-300">
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
          <div className="flex items-center gap-2">
            {fb && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fb.cls}`}>{fb.label}</span>}
            {p.is_featured && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Featured</span>}
          </div>
          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.total_views} views</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{p.total_favorites}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p.total_contacts}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoggedInHome({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  const [showMenu, setShowMenu]   = useState(false);
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

  const isOwner   = user.role === "OWNER";
  const initials  = ((user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  const firstName = user.first_name ?? user.email?.split("@")[0] ?? "there";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const fallback = [user.location?.locality, user.location?.city, user.location?.state]
      .filter(Boolean)
      .join(", ");

    if (fallback) {
      setCurrentLocationLabel(fallback);
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!response.ok) {
            setCurrentLocationLabel(fallback || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            return;
          }

          const data = (await response.json()) as {
            address?: {
              road?: string;
              suburb?: string;
              neighbourhood?: string;
              city?: string;
              town?: string;
              village?: string;
              state?: string;
            };
          };

          const address = data.address;
          const precise = [
            address?.road,
            address?.suburb ?? address?.neighbourhood,
            address?.city ?? address?.town ?? address?.village,
            address?.state,
          ]
            .filter(Boolean)
            .join(", ");

          setCurrentLocationLabel(precise || fallback || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setCurrentLocationLabel(fallback || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      () => {
        setCurrentLocationLabel((prev) => prev || fallback || "Location unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 10 * 60 * 1000,
      },
    );
  }, [user.location?.city, user.location?.locality, user.location?.state]);

  const TYPE_FILTERS = ["ALL", "PG", "1RK", "1BHK", "2BHK", "HOUSE", "COMMERCIAL"];
  const filtered = activeType === "ALL" ? (properties ?? []) : (properties ?? []).filter(p => p.property_type === activeType);

  const OWNER_ACTIONS = [
    { icon: Plus,         label: "Add Listing",   sub: "Post a property",     href: "/my-ads",    color: "emerald" },
    { icon: BarChart2,    label: "Analytics",     sub: "Views & leads",       href: "/analytics", color: "blue"    },
    { icon: MessageSquare,label: "Messages",      sub: "Tenant inquiries",    href: "/messages",  color: "violet"  },
    { icon: TrendingUp,   label: "My Listings",   sub: "Manage your ads",     href: "/my-ads",    color: "amber"   },
  ];
  const TENANT_ACTIONS = [
    { icon: Search,       label: "Find a Home",   sub: "Browse properties",   href: "/properties",color: "emerald" },
    { icon: Heart,        label: "Saved",          sub: "Your shortlist",      href: "/favorites", color: "rose"    },
    { icon: MessageSquare,label: "Messages",      sub: "Talk to owners",       href: "/messages",  color: "violet"  },
    { icon: MapPin,       label: "Cities",         sub: "Explore locations",   href: "/properties",color: "amber"   },
  ];
  const actions = isOwner ? OWNER_ACTIONS : TENANT_ACTIONS;

  const ACTION_COLORS: Record<string, { icon: string; ring: string; text: string }> = {
    emerald: { icon: "bg-emerald-100 text-emerald-600", ring: "ring-emerald-200", text: "text-emerald-600" },
    blue:    { icon: "bg-blue-100 text-blue-600",       ring: "ring-blue-200",    text: "text-blue-600"    },
    violet:  { icon: "bg-violet-100 text-violet-600",   ring: "ring-violet-200",  text: "text-violet-600"  },
    amber:   { icon: "bg-amber-100 text-amber-600",     ring: "ring-amber-200",   text: "text-amber-600"   },
    rose:    { icon: "bg-rose-100 text-rose-600",       ring: "ring-rose-200",    text: "text-rose-600"    },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <motion.div whileHover={{ rotate: -8, scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}
              className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Building2 className="w-4 h-4 text-white" />
            </motion.div>
            <span className="font-bold text-slate-900 text-lg">StayHub</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 max-w-sm">
            {(isOwner
              ? [["Dashboard", "/dashboard"], ["My Listings", "/my-ads"], ["Analytics", "/analytics"]]
              : [["Browse", "/properties"], ["Saved", "/favorites"], ["Messages", "/messages"]]
            ).map(([label, href]) => (
              <Link key={label} href={href}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >{label}</Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/notifications"
              className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <Bell className="w-4.5 h-4.5 text-slate-500" />
            </Link>

            {/* Avatar menu */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{firstName}</p>
                  <p className="text-xs text-slate-400 leading-tight capitalize">{user.role?.toLowerCase()}</p>
                </div>
                <motion.span animate={{ rotate: showMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-sm origin-top-right"
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">{user.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">{isOwner ? "Property Owner" : "Tenant"}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/profile"   onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"><Home className="w-3.5 h-3.5 text-slate-400" />Profile</Link>
                        <Link href="/dashboard" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"><BarChart2 className="w-3.5 h-3.5 text-slate-400" />Dashboard</Link>
                        <Link href="/messages"  onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"><MessageSquare className="w-3.5 h-3.5 text-slate-400" />Messages</Link>
                      </div>
                      <div className="border-t border-slate-100 pt-1">
                        <button onClick={onSignOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-28 space-y-10">

        {/* ── Welcome banner ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-10"
        >
          {/* Background decoration */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-emerald-400 font-medium mb-1">{greeting},</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 capitalize">{firstName} 👋</h1>
              <p className="text-slate-400 text-sm max-w-sm">
                {isOwner
                  ? "Manage your listings, track leads, and grow your rental business."
                  : "Discover verified rentals across India — zero brokerage, direct from owners."}
              </p>
              <p className="mt-3 inline-flex max-w-lg items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                <span className="truncate">Current location: {currentLocationLabel || "Detecting precise location..."}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={isOwner ? "/my-ads" : "/properties"}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/30"
              >
                {isOwner ? <Plus className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {isOwner ? "Add Property" : "Find a Home"}
              </Link>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Quick actions ──────────────────────────────────────────── */}
        <motion.div variants={staggerFast} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {actions.map((a) => {
            const c = ACTION_COLORS[a.color] ?? ACTION_COLORS.emerald;
            return (
              <motion.div key={a.label} variants={fadeUp}>
                <Link href={a.href}
                  className="group flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-4 ${c.icon} ${c.ring}`}>
                    <a.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${c.text} truncate`}>{a.label}</p>
                    <p className="text-xs text-slate-400 truncate">{a.sub}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Search bar ─────────────────────────────────────────────── */}
        <div className="relative">
          <Link href="/properties">
            <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
              className="flex items-center gap-3 bg-white border-2 border-slate-200 hover:border-emerald-400 transition-colors rounded-2xl px-5 py-4 shadow-sm cursor-pointer group"
            >
              <Search className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              <span className="text-slate-400 group-hover:text-slate-600 transition-colors text-sm">Search PG, room, flat, commercial space…</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                <Filter className="w-3 h-3" /> Filters
              </span>
            </motion.div>
          </Link>
        </div>

        {/* ── Properties section ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Featured Properties</h2>
              <p className="text-sm text-slate-500 mt-0.5">Verified listings across India</p>
            </div>
            <Link href="/properties"
              className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1 group"
            >
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Error banner */}
          {isError && (
            <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 text-center">
              Couldn&apos;t load properties.{" "}
              <Link href="/properties" className="underline font-semibold">
                Browse all properties →
              </Link>
            </div>
          )}

          {/* Type filter pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {TYPE_FILTERS.map((t) => (
              <motion.button key={t} whileTap={{ scale: 0.95 }}
                onClick={() => setActiveType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeType === t
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {t === "ALL" ? "All Types" : t}
              </motion.button>
            ))}
          </div>

          {/* Cards grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
                  <div className="h-44 bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((p) => (
                <motion.div key={p.id} variants={fadeUp}>
                  <PropertyCard p={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">
                {activeType === "ALL" ? "No properties yet" : `No ${activeType} listings found`}
              </p>
              <p className="text-sm text-slate-400 mb-6">Check back soon or explore all property types</p>
              <div className="flex items-center justify-center gap-3">
                {activeType !== "ALL" && (
                  <button onClick={() => setActiveType("ALL")}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >Clear filter</button>
                )}
                <Link href="/properties"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Search className="w-4 h-4" /> Browse All
                </Link>
              </div>
            </motion.div>
          )}
        </section>

        {/* ── Categories quick-browse ────────────────────────────────── */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Browse by Type</h2>
          </div>
          <motion.div variants={staggerFast} initial="hidden" animate="show"
            className="grid grid-cols-3 sm:grid-cols-6 gap-3"
          >
            {CATEGORIES.map((cat) => {
              const c = CAT_COLORS[cat.color];
              return (
                <motion.div key={cat.type} variants={fadeUp}>
                  <Link href={`/properties?type=${cat.type}`}
                    className={`group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 ${c.border} ${c.bg} ${c.glow} hover:shadow-lg transition-all duration-200 block`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.icon}`}>{cat.emoji}</div>
                    <span className={`text-xs font-semibold text-slate-700 text-center leading-tight ${c.text} transition-colors`}>{cat.label}</span>
                    <span className="text-xs text-slate-400 hidden sm:block">{cat.sub}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">StayHub</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} StayHub Technologies. India&apos;s zero-brokerage rental platform.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-emerald-600 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </motion.div>
  );
}

// ─── Scroll-aware Navbar ─────────────────────────────────────────────────────

function Navbar({ showSignInMenu, setShowSignInMenu }: { showSignInMenu: boolean; setShowSignInMenu: (v: boolean) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <motion.div whileHover={{ rotate: -8, scale: 1.12 }} transition={{ type: "spring", stiffness: 400 }}
              className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-emerald-500/40 shadow-lg"
            >
              <Building2 className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-slate-900">StayHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[["Browse Homes", "/properties"], ["How it Works", "#how-it-works"], ["For Owners", "#for-owners"]].map(([label, href]) => (
              <motion.a key={label} href={href}
                whileHover={{ y: -1 }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 rounded-lg transition-colors relative group"
              >
                {label}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </motion.a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.a href="/auth"
              whileHover={{ scale: 1.03 }}
              className="hidden sm:block px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 rounded-lg transition-colors"
            >
              Sign In
            </motion.a>
            <div className="relative">
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04 }}
                onClick={() => setShowSignInMenu(!showSignInMenu)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-600/25"
              >
                Get Started
                <motion.span animate={{ rotate: showSignInMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {showSignInMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSignInMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 origin-top-right overflow-hidden"
                    >
                      <Link href="/auth?role=TENANT" onClick={() => setShowSignInMenu(false)} className="block px-4 py-3.5 hover:bg-emerald-50 transition-colors">
                        <p className="text-sm font-semibold text-slate-900">I&apos;m a Tenant</p>
                        <p className="text-xs text-slate-500 mt-0.5">Find my next home</p>
                      </Link>
                      <div className="mx-4 border-t border-slate-100" />
                      <Link href="/auth?role=OWNER" onClick={() => setShowSignInMenu(false)} className="block px-4 py-3.5 hover:bg-emerald-50 transition-colors">
                        <p className="text-sm font-semibold text-slate-900">I&apos;m an Owner</p>
                        <p className="text-xs text-slate-500 mt-0.5">List my property</p>
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            {/* Mobile hamburger */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-emerald-600 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden bg-white border-t border-slate-200"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {[["Browse Homes", "/properties"], ["How it Works", "#how-it-works"], ["For Owners", "#for-owners"], ["Sign In", "/auth"]].map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-slate-700 hover:text-emerald-600 py-2.5 border-b border-slate-100 transition-colors"
                  >{label}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

// ─── Improved Footer ─────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">StayHub</span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              A simple rental platform for people who want to find a home or list a property without dealing with a broker.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Use StayHub</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {[["Browse homes", "/properties"], ["List a property", "/auth?role=OWNER"], ["Sign in", "/auth"], ["Saved homes", "/favorites"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-emerald-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {[["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-emerald-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} StayHub. Direct rentals with clear steps.</p>
          <p>Designed to be easy for first-time renters and owners.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Public landing page ─────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [showSignInMenu, setShowSignInMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = () => { clearSession(); router.push("/"); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/properties?search=${encodeURIComponent(searchQuery.trim())}` : "/properties");
  };

  if (user) return <LoggedInHome user={user} onSignOut={handleSignOut} />;

  return (
    <div className="min-h-screen bg-[#f5f8f6] font-sans text-slate-900">
      <Navbar showSignInMenu={showSignInMenu} setShowSignInMenu={setShowSignInMenu} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f7fcf8_0%,#eef7f2_100%)]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_40%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Easy rental search for tenants and owners
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
              Find a home or list a property without the usual confusion.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              StayHub helps people search homes, speak to owners directly, and understand the next step clearly. No technical language, no broker pressure, and no unnecessary clutter.
            </p>

            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city, area, or property type"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Search homes
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>Popular cities:</span>
              {POPULAR_CITIES.slice(0, 6).map((city) => (
                <Link
                  key={city}
                  href={`/properties?city=${city}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/properties" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Browse all homes
              </Link>
              <Link href="/auth?role=OWNER" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
                List your property
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="rounded-3xl bg-slate-900 p-6 text-white">
                <p className="text-sm font-medium text-emerald-300">Why people choose StayHub</p>
                <div className="mt-5 space-y-4">
                  {[
                    "See rental options in simple language.",
                    "Talk directly to the owner.",
                    "Save brokerage and avoid middlemen.",
                    "Use one place for search, shortlist, and contact.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-[#f7fbf8] p-4">
                  <p className="text-sm font-semibold text-slate-900">For tenants</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Search verified homes, compare options, and contact owners directly.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#fbfaf6] p-4">
                  <p className="text-sm font-semibold text-slate-900">For owners</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Post your property, receive genuine leads, and manage conversations in one place.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="relative mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-8 sm:px-8 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
              <p className="text-2xl font-black text-slate-900 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-18 bg-[#f5f8f6]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-18">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Simple steps</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How to use StayHub</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              The homepage now focuses on one clear path: search, talk, and decide. This is easier for people who just want to get started quickly.
            </p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {HOW_IT_WORKS.map((step) => (
              <motion.div key={step.num} variants={fadeUp}>
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-4xl font-black text-slate-100">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Browse by type ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-18 sm:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Start from something familiar</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Browse by property type</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Instead of showing too many options at once, the homepage gives quick entry points based on the kind of place people usually look for first.
          </p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {CATEGORIES.map((cat) => {
            const c = CAT_COLORS[cat.color];
            return (
              <motion.div key={cat.type} variants={fadeUp}>
                <Link
                  href={`/properties?type=${cat.type}`}
                  className={`group block rounded-3xl border border-slate-200 bg-white p-5 text-center transition-all hover:shadow-lg ${c.border} ${c.bg}`}
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${c.icon}`}>{cat.emoji}</div>
                  <p className={`mt-4 text-sm font-semibold text-slate-900 ${c.text}`}>{cat.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{cat.sub}</p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Why people use it ───────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-18">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">Why it feels easier</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Built for normal users, not just heavy app users</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: "Direct contact", desc: "You speak with the owner directly instead of passing through multiple people." },
              { icon: Shield, title: "Clear information", desc: "The homepage now uses simpler wording so the first step is obvious." },
              { icon: MessageSquare, title: "Fewer decisions at once", desc: "Search, categories, and actions are grouped in a more readable order." },
              { icon: TrendingUp, title: "Useful for owners too", desc: "Owners can quickly move from the homepage to listing and lead-management actions." },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="rounded-3xl border border-slate-200 bg-[#f8fbf9] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Dual CTA ────────────────────────────────────────────────────── */}
      <section id="for-owners" className="py-18">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Tenant */}
            <motion.div variants={fadeUp}>
              <div className="h-full rounded-[30px] bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white shadow-[0_24px_80px_rgba(5,150,105,0.22)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">Looking for a home?</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-emerald-50">
                  Start with a city or area, check the type of property you want, and contact the owner when a listing feels right.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-emerald-50">
                  {[
                    "Easy search from the homepage",
                    "Direct owner contact",
                    "No brokerage middle step",
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
                <Link href="/properties" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                  Browse homes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Owner */}
            <motion.div variants={fadeUp}>
              <div className="h-full rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Want to list your property?</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Add your listing, receive enquiries from interested tenants, and manage your leads in one place without extra complexity.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {[
                    "Simple first step for owners",
                    "Quick path to add a listing",
                    "Built-in messages and analytics",
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                      {line}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?role=OWNER" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Start listing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Closing message ─────────────────────────────────────────────── */}
      <section className="bg-[#eef7f2] py-18">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">A clearer homepage for first-time users</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              The homepage now explains what StayHub does in plain language, gives one main search action, and keeps the owner path visible without making the page feel crowded.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/properties" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Start searching</Link>
              <Link href="/auth" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Sign in or create account</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
