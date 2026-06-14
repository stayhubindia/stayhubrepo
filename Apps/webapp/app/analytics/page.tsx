"use client";

import { useMemo } from "react";
import {
  BarChart3,
  Building2,
  Eye,
  Heart,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { getApiErrorMessage } from "@/lib/api-error";
import { useHeatmap, useOwnerDashboard, usePropertyDaily } from "@/modules/analytics/hooks";
import { useAuthStore } from "@/store/auth-store";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

const formatNumber = (value: number) => value.toLocaleString("en-IN");
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const canViewOwnerAnalytics = user?.role === "OWNER" || user?.role === "ADMIN";
  const canViewHeatmap = user?.role === "ADMIN";
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const { data, isLoading, isError, error } = useOwnerDashboard();
  const {
    data: demandData,
    isLoading: demandLoading,
    isError: isDemandError,
    error: demandError,
  } = usePropertyDaily(undefined, undefined, undefined, canViewOwnerAnalytics);
  const {
    data: heatmap,
    isLoading: heatmapLoading,
    isError: isHeatmapError,
    error: heatmapError,
  } = useHeatmap(undefined, undefined, canViewHeatmap);

  const latest = data?.[0] ?? { total_views: 0, total_favorites: 0, total_contacts: 0 };

  const demandTrend = useMemo(() => {
    if (!demandData?.length) return [];

    const byDate = new Map<string, { views: number; favorites: number; contacts: number }>();
    for (const item of demandData) {
      const current = byDate.get(item.date) ?? { views: 0, favorites: 0, contacts: 0 };
      byDate.set(item.date, {
        views: current.views + item.views,
        favorites: current.favorites + item.favorites,
        contacts: current.contacts + item.contacts,
      });
    }

    return Array.from(byDate.entries())
      .map(([date, totals]) => ({
        date,
        ...totals,
        score: totals.views + totals.favorites * 2 + totals.contacts * 3,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-14);
  }, [demandData]);

  const maxTrendScore = useMemo(() => {
    if (!demandTrend.length) return 1;
    return Math.max(...demandTrend.map((point) => point.score), 1);
  }, [demandTrend]);

  const previousSnapshot = data?.[1];
  const latestEngagementScore = latest.total_views + latest.total_favorites * 2 + latest.total_contacts * 3;
  const previousEngagementScore = previousSnapshot
    ? previousSnapshot.total_views + previousSnapshot.total_favorites * 2 + previousSnapshot.total_contacts * 3
    : 0;
  const engagementDelta = latestEngagementScore - previousEngagementScore;

  const topHeatmapRows = useMemo(() => {
    if (!heatmap?.length) return [];

    return heatmap
      .slice()
      .sort((a, b) => {
        const aScore = a.views + a.favorites * 2 + a.contacts * 3;
        const bScore = b.views + b.favorites * 2 + b.contacts * 3;
        return bScore - aScore;
      })
      .slice(0, 8)
      .map((row) => ({
        ...row,
        score: row.views + row.favorites * 2 + row.contacts * 3,
      }));
  }, [heatmap]);

  const strongestDay = demandTrend.reduce<(typeof demandTrend)[number] | null>((best, point) => {
    if (!best || point.score > best.score) return point;
    return best;
  }, null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
        <DesktopSidebar />
        <main className="flex-1 flex flex-col min-w-0">
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
              <input placeholder="Search by location, property or category" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors" />
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
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
              </Link>
              <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
              <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
              <ProfileDropdown />
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
            <div className="mx-auto max-w-6xl">
              <LoadingState message="Loading analytics..." className="min-h-[50vh]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
        <DesktopSidebar />
        <main className="flex-1 flex flex-col min-w-0">
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
              <input placeholder="Search by location, property or category" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors" />
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
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
              </Link>
              <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
              <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
              <ProfileDropdown />
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
            <div className="mx-auto max-w-6xl">
              <ErrorState message={getApiErrorMessage(error)} className="p-4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!canViewOwnerAnalytics) {
    return (
      <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
        <DesktopSidebar />
        <main className="flex-1 flex flex-col min-w-0">
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
              <input placeholder="Search by location, property or category" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors" />
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
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
              </Link>
              <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
              <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
              <ProfileDropdown />
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
            <div className="mx-auto max-w-6xl">
              <EmptyState
                title="Analytics is owner-only"
                description="Switch to an owner or admin account to view dashboard metrics."
                className="min-h-[50vh]"
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          {/* mobile menu */}
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))} className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          {/* desktop search */}
          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input placeholder="Search by location, property or category" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>
          {/* right actions */}
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
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Messages</span>
            </Link>
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
            <ProfileDropdown />
          </div>
        </header>
        {/* page content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
          <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_28%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Analytics workspace
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">See what your listings are really doing.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Review visibility, engagement, and lead momentum across your portfolio with a clearer owner analytics view.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                    Engagement score {formatNumber(latestEngagementScore)}
                  </div>
                  {strongestDay && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <BarChart3 className="h-4 w-4 text-emerald-300" />
                      Strongest day {formatDate(strongestDay.date)}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current signal</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {engagementDelta >= 0 ? "+" : ""}
                  {formatNumber(engagementDelta)} trend change
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {previousSnapshot
                    ? "Compared with the previous recorded snapshot, this shows whether listing engagement is moving up or slowing down."
                    : "Your first snapshot will establish the baseline for ongoing trend comparisons."}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <Shield className="h-4 w-4" />
                  Owner metrics only
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total views" value={latest.total_views} meta="Overall visibility across listings" icon={<Eye className="h-5 w-5" />} tone="bg-sky-100 text-sky-700" />
          <MetricCard title="Total favorites" value={latest.total_favorites} meta="How often tenants save your ads" icon={<Heart className="h-5 w-5" />} tone="bg-rose-100 text-rose-700" />
          <MetricCard title="Total contacts" value={latest.total_contacts} meta="Direct lead conversations generated" icon={<MessageSquare className="h-5 w-5" />} tone="bg-emerald-100 text-emerald-700" />
          <MetricCard title="Engagement score" value={latestEngagementScore} meta="Weighted mix of views, saves, and leads" icon={<TrendingUp className="h-5 w-5" />} tone="bg-amber-100 text-amber-700" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Demand trend</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Last 14 days of activity</h2>
              </div>
            </div>

            {demandLoading ? (
              <LoadingState message="Loading demand trends..." className="min-h-[22vh]" />
            ) : isDemandError ? (
              <ErrorState message={getApiErrorMessage(demandError)} className="p-2" />
            ) : demandTrend.length === 0 ? (
              <EmptyState
                title="No trend data"
                description="Demand trends will appear after property interactions are recorded."
                className="min-h-[22vh]"
              />
            ) : (
              <div className="space-y-4">
                {demandTrend.map((point) => {
                  const width = Math.max(8, Math.round((point.score / maxTrendScore) * 100));
                  return (
                    <div key={point.date} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{formatDate(point.date)}</p>
                          <p className="text-xs text-slate-500">Demand score {formatNumber(point.score)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">Views {point.views}</span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">Favorites {point.favorites}</span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">Contacts {point.contacts}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-emerald-100">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Heatmap</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Top-performing locations</h2>
              </div>
            </div>

            {!canViewHeatmap ? (
              <EmptyState
                title="Staff-only view"
                description="Location heatmap is restricted to admin and staff accounts."
                className="min-h-[22vh]"
              />
            ) : heatmapLoading ? (
              <LoadingState message="Loading heatmap..." className="min-h-[22vh]" />
            ) : isHeatmapError ? (
              <ErrorState message={getApiErrorMessage(heatmapError)} className="p-2" />
            ) : topHeatmapRows.length === 0 ? (
              <EmptyState
                title="No heatmap data"
                description="Heatmap rows appear when location-level analytics are available."
                className="min-h-[22vh]"
              />
            ) : (
              <div className="space-y-3">
                {topHeatmapRows.map((row) => (
                  <div key={row.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {row.location.locality || row.location.city}, {row.location.state}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {row.location.city}, {row.location.country}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Score {formatNumber(row.score)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-base font-black text-slate-950">{row.views}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Views</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-base font-black text-slate-950">{row.favorites}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Favorites</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-base font-black text-slate-950">{row.contacts}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Contacts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Snapshot history</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Recorded performance over time</h2>
            </div>
          </div>

          {data && data.length > 0 ? (
            <div className="space-y-4">
              {data.map((snapshot) => {
                const score = snapshot.total_views + snapshot.total_favorites * 2 + snapshot.total_contacts * 3;
                return (
                  <div key={snapshot.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatDate(snapshot.date)}</p>
                        <p className="mt-1 text-xs text-slate-500">Engagement score {formatNumber(score)}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 lg:min-w-[360px]">
                        <MiniMetric label="Views" value={snapshot.total_views} />
                        <MiniMetric label="Favorites" value={snapshot.total_favorites} />
                        <MiniMetric label="Contacts" value={snapshot.total_contacts} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No historical snapshots"
              description="Historical owner snapshots will appear once analytics jobs generate them."
              className="min-h-[18vh]"
            />
          )}
        </section>
      </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  meta,
  icon,
  tone,
}: {
  title: string;
  value: number;
  meta: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{formatNumber(value)}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{meta}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center">
      <p className="text-base font-black text-slate-950">{formatNumber(value)}</p>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}