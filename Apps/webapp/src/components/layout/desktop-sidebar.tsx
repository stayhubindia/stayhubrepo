"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Search,
  CalendarCheck,
  Heart,
  MessageSquare,
  LayoutDashboard,
  ArrowRight,
  FileText,
  BarChart2,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isOwner = user?.role === "OWNER";

  // ── Tenant-only nav ───────────────────────────────────────────────────────
  const TENANT_ITEMS = [
    { icon: Building2,      label: "Home",        href: "/",           active: pathname === "/" },
    { icon: Search,         label: "Browse",      href: "/properties", active: pathname.startsWith("/properties") },
    { icon: CalendarCheck,  label: "My Bookings", href: "/my-bookings", active: pathname.startsWith("/my-bookings") },
    { icon: Heart,          label: "Wishlist",    href: "/favorites",  active: pathname.startsWith("/favorites") },
    { icon: MessageSquare,  label: "Messages",    href: "/chats",      active: pathname.startsWith("/chats") },
  ];

  // ── Owner-only nav ────────────────────────────────────────────────────────
  const OWNER_ITEMS = [
    { icon: Building2,      label: "Home",        href: "/",           active: pathname === "/" },
    { icon: Search,         label: "Browse",      href: "/properties", active: pathname.startsWith("/properties") },
    { icon: FileText,       label: "My Ads",      href: "/my-ads",     active: pathname.startsWith("/my-ads") },
    { icon: MessageSquare,  label: "Messages",    href: "/chats",      active: pathname.startsWith("/chats") },
    { icon: LayoutDashboard,label: "Dashboard",   href: "/dashboard",  active: pathname.startsWith("/dashboard") },
    { icon: BarChart2,      label: "Analytics",   href: "/analytics",  active: pathname.startsWith("/analytics") },
  ];

  const NAV_ITEMS = isOwner ? OWNER_ITEMS : TENANT_ITEMS;

  return (
    <aside className="w-[240px] lg:w-[260px] shrink-0 border-r border-slate-200 bg-[#FDFDFD] hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">
            Stay<span className="text-emerald-500">Hub</span>
          </span>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="px-3 shrink-0">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                item.active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${item.active ? "text-emerald-500" : ""}`}
              />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom CTA card ── */}
      <div className="px-4 pb-6 shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4">
          <div className="relative z-10">
            <h4 className="text-slate-900 font-bold text-sm mb-1">
              {isOwner ? "Post a new ad" : "List your property"}
            </h4>
            <p className="text-slate-500 text-xs mb-3 leading-relaxed">
              {isOwner
                ? "Reach thousands of tenants instantly."
                : "Earn more by listing your space on StayHub."}
            </p>
            <Link
              href="/my-ads/new"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors w-full justify-center shadow-sm shadow-emerald-500/30"
            >
              {isOwner ? "Post Ad" : "Become a Host"}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

    </aside>
  );
}
