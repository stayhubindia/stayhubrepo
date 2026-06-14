"use client";

import { Bell, Building2, CheckCheck, Heart, LoaderCircle, Menu, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { getApiErrorMessage } from "@/lib/api-error";
import { useNotificationMutations, useNotifications, useUnreadNotificationCount } from "@/modules/notifications/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const { user, isAllowed } = useRequireAuth();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const notificationsQuery = useNotifications(page, unreadOnly, Boolean(user));
  const unreadCountQuery = useUnreadNotificationCount(Boolean(user));
  const { markReadMutation, markAllReadMutation } = useNotificationMutations();
  const { runOnce, isInFlight } = useIdempotentAction();

  if (!isAllowed || !user) {
    return null;
  }

  const totalCount = notificationsQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

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
          <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-[var(--muted)]">Unread: {unreadCountQuery.data?.unread_count ?? 0}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="gb-btn-ghost px-4 py-2 text-sm">
              Dashboard
            </Link>
            <Link href="/properties" className="gb-btn-ghost px-4 py-2 text-sm">
              Properties
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`gb-btn-ghost px-4 py-2 text-sm ${unreadOnly ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
            onClick={() => {
              setUnreadOnly((prev) => !prev);
              setPage(1);
            }}
          >
            {unreadOnly ? "Showing Unread" : "Show Unread Only"}
          </button>

          <button
            type="button"
            className="gb-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            disabled={markAllReadMutation.isPending || isInFlight("notification:mark-all-read")}
            onClick={() => {
              runOnce("notification:mark-all-read", async () => {
                await markAllReadMutation.mutateAsync();
              });
            }}
          >
            {markAllReadMutation.isPending || isInFlight("notification:mark-all-read") ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark All Read
          </button>
        </div>

        {notificationsQuery.isLoading ? <LoadingState message="Loading notifications..." className="py-6" /> : null}

        {notificationsQuery.isError ? <ErrorState message={getApiErrorMessage(notificationsQuery.error)} className="p-4" /> : null}

        <div className="space-y-3">
          {notificationsQuery.data?.results.map((notification) => (
            <article
              key={notification.id}
              className={`gb-card p-4 ${notification.is_read ? "opacity-80" : "border-[var(--accent)]/45 bg-[#f2fbf9]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 inline-flex items-center gap-1 text-sm font-semibold">
                    <Bell className="h-4 w-4 text-[var(--accent)]" />
                    {notification.title}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{notification.message}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                {!notification.is_read ? (
                  <button
                    type="button"
                    className="gb-btn-ghost px-3 py-1.5 text-xs"
                    disabled={markReadMutation.isPending || isInFlight(`notification:mark-read:${notification.id}`)}
                    onClick={() => {
                      runOnce(`notification:mark-read:${notification.id}`, async () => {
                        await markReadMutation.mutateAsync(notification.id);
                      });
                    }}
                  >
                    Mark Read
                  </button>
                ) : (
                  <span className="rounded-full bg-[#eef5f8] px-2.5 py-1 text-[11px] text-[var(--muted)]">Read</span>
                )}
              </div>
            </article>
          ))}
        </div>

        {notificationsQuery.data && notificationsQuery.data.results.length === 0 ? (
          <div className="gb-card mt-3 p-4">
            <EmptyState title="No notifications found" description="You're all caught up." className="py-6" />
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            Page {page} of {totalPages} ({totalCount} results)
          </p>
          <div className="flex gap-2">
            <button
              className="gb-btn-ghost px-4 py-2 text-sm disabled:opacity-40"
              disabled={!canGoPrev || notificationsQuery.isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className="gb-btn-ghost px-4 py-2 text-sm disabled:opacity-40"
              disabled={!canGoNext || notificationsQuery.isFetching}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
          </section>
        </div>
      </main>
    </div>
  );
}
