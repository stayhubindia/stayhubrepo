"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Building2,
  CheckCheck,
  Heart,
  MessageCircle,
  Settings,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from "@/modules/notifications/hooks";
import { useAuthStore } from "@/store/auth-store";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import type { NotificationItem } from "@/types/notification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Icon + colour per notification_type ─────────────────────────────────────

const TYPE_META: Record<
  NotificationItem["notification_type"],
  { icon: React.ElementType; bg: string; iconCls: string; label: string }
> = {
  PROPERTY_APPROVED: {
    icon: ShieldCheck,
    bg: "bg-emerald-100",
    iconCls: "text-emerald-600",
    label: "Property approved",
  },
  PROPERTY_REJECTED: {
    icon: ShieldX,
    bg: "bg-red-100",
    iconCls: "text-red-500",
    label: "Property rejected",
  },
  NEW_CONTACT: {
    icon: UserPlus,
    bg: "bg-violet-100",
    iconCls: "text-violet-600",
    label: "New contact",
  },
  NEW_FAVORITE: {
    icon: Heart,
    bg: "bg-rose-100",
    iconCls: "text-rose-500",
    label: "New favourite",
  },
  NEW_MESSAGE: {
    icon: MessageCircle,
    bg: "bg-sky-100",
    iconCls: "text-sky-600",
    label: "New message",
  },
  SYSTEM: {
    icon: Sparkles,
    bg: "bg-amber-100",
    iconCls: "text-amber-600",
    label: "System",
  },
};

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
  item,
  onMarkRead,
  isMarkingRead,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  const meta = TYPE_META[item.notification_type] ?? TYPE_META.SYSTEM;
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
      className={`group relative flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-150 cursor-default
        ${item.is_read
          ? "hover:bg-slate-50"
          : "bg-emerald-50/60 hover:bg-emerald-50"
        }`}
    >
      {/* Unread dot */}
      {!item.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      )}

      {/* Icon bubble */}
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}
      >
        <Icon className={`h-4 w-4 ${meta.iconCls}`} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            item.is_read ? "font-medium text-slate-600" : "font-semibold text-slate-900"
          }`}
        >
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-relaxed">
          {item.message}
        </p>
        <p className="mt-1.5 text-[10px] font-medium text-slate-400">
          {timeAgo(item.created_at)}
        </p>
      </div>

      {/* Mark-read button — appears on hover */}
      {!item.is_read && (
        <button
          type="button"
          aria-label="Mark as read"
          disabled={isMarkingRead}
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(item.id);
          }}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-emerald-100 hover:text-emerald-600 disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <BellOff className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">You&apos;re all caught up</p>
      <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
        No new notifications right now. Check back later.
      </p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-3/4 rounded-full bg-slate-100" />
        <div className="h-2.5 w-full rounded-full bg-slate-100" />
        <div className="h-2 w-1/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Unread badge ─────────────────────────────────────────────────────────────

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-sm shadow-emerald-500/40 ring-2 ring-white"
    >
      {count > 9 ? "9+" : count}
    </motion.span>
  );
}

// ─── Main dropdown component ──────────────────────────────────────────────────

interface NotificationDropdownProps {
  /** Extra class on the trigger button wrapper */
  className?: string;
  /** Render the trigger as a compact icon-only button, with a label, or as a full sidebar row */
  variant?: "icon" | "icon-label" | "sidebar";
}

export function NotificationDropdown({
  className = "",
  variant = "icon",
}: NotificationDropdownProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  const isEnabled = Boolean(user);

  const unreadCountQuery = useUnreadNotificationCount(isEnabled);
  const notificationsQuery = useNotifications(1, unreadOnly, isEnabled && open);
  const { markReadMutation, markAllReadMutation } = useNotificationMutations();
  const { runOnce, isInFlight } = useIdempotentAction();

  const unreadCount = unreadCountQuery.data?.unread_count ?? 0;
  const notifications = notificationsQuery.data?.results ?? [];
  const isLoading = notificationsQuery.isLoading;

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // ── Refresh unread count when panel opens ─────────────────────────────────
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
  }, [open, queryClient]);

  const handleMarkRead = useCallback(
    (id: string) => {
      runOnce(`notification:mark-read:${id}`, async () => {
        await markReadMutation.mutateAsync(id);
      });
    },
    [runOnce, markReadMutation],
  );

  const handleMarkAllRead = useCallback(() => {
    runOnce("notification:mark-all-read", async () => {
      await markAllReadMutation.mutateAsync();
    });
  }, [runOnce, markAllReadMutation]);

  if (!user) return null;

  // ── Panel animation variants ──────────────────────────────────────────────
  const panelVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 380, damping: 28 },
    },
    exit: {
      opacity: 0,
      y: -6,
      scale: 0.97,
      transition: { duration: 0.15, ease: "easeIn" as const },
    },
  };

  // Mobile drawer variants
  const drawerVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 320, damping: 32 },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: { duration: 0.22, ease: "easeIn" as const },
    },
  };

  // ── Trigger button styles per variant ────────────────────────────────────
  const renderTrigger = () => {
    if (variant === "sidebar") {
      return (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Notifications"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
            ${open
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
        >
          <div className="flex items-center gap-3">
            <Bell className={`w-[18px] h-[18px] shrink-0 ${open ? "text-emerald-500" : ""}`} />
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>
      );
    }

    return (
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center justify-center rounded-xl transition-all duration-150
          ${open
            ? "bg-emerald-50 text-emerald-600"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          }
          ${variant === "icon-label" ? "flex-col gap-0.5 px-2 py-1.5" : "h-9 w-9"}
        `}
      >
        <Bell className={variant === "icon-label" ? "h-5 w-5" : "h-[18px] w-[18px]"} />
        {variant === "icon-label" && (
          <span className="text-[10px] font-semibold">Alerts</span>
        )}
        <UnreadBadge count={unreadCount} />
      </button>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {renderTrigger()}

      {/* ── Desktop dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Desktop panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label="Notifications panel"
              key="desktop-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-[calc(100%+10px)] z-[9999] hidden w-[380px] origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 sm:block"
              style={{ maxHeight: "min(520px, calc(100vh - 80px))" }}
            >
              {/* Glass top edge */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

              {/* ── Header ── */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[15px] font-bold text-slate-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      disabled={markAllReadMutation.isPending || isInFlight("notification:mark-all-read")}
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Filter tabs ── */}
              <div className="flex items-center gap-1 border-b border-slate-100 px-4 py-2">
                {[
                  { label: "All", value: false },
                  { label: "Unread", value: true },
                ].map((tab) => (
                  <button
                    key={String(tab.value)}
                    type="button"
                    onClick={() => setUnreadOnly(tab.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      unreadOnly === tab.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Body ── */}
              <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
                {isLoading ? (
                  <div className="divide-y divide-slate-50">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <EmptyNotifications />
                ) : (
                  <div className="divide-y divide-slate-50/80 py-1">
                    <AnimatePresence initial={false}>
                      {notifications.map((item) => (
                        <NotificationRow
                          key={item.id}
                          item={item}
                          onMarkRead={handleMarkRead}
                          isMarkingRead={
                            markReadMutation.isPending ||
                            isInFlight(`notification:mark-read:${item.id}`)
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <p className="text-center text-xs text-slate-400">
                    Showing latest {notifications.length} notification
                    {notifications.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </motion.div>

            {/* ── Mobile: backdrop + bottom drawer ── */}
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-sm sm:hidden"
                onClick={() => setOpen(false)}
              />

              {/* Drawer */}
              <motion.div
                key="mobile-drawer"
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:hidden"
                style={{ maxHeight: "85dvh" }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="h-1 w-10 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[15px] font-bold text-slate-900">Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        disabled={markAllReadMutation.isPending || isInFlight("notification:mark-all-read")}
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 px-4 py-2">
                  {[
                    { label: "All", value: false },
                    { label: "Unread", value: true },
                  ].map((tab) => (
                    <button
                      key={String(tab.value)}
                      type="button"
                      onClick={() => setUnreadOnly(tab.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        unreadOnly === tab.value
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {isLoading ? (
                    <div className="divide-y divide-slate-50">
                      {[1, 2, 3, 4].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <EmptyNotifications />
                  ) : (
                    <div className="divide-y divide-slate-50/80 py-1 pb-safe">
                      <AnimatePresence initial={false}>
                        {notifications.map((item) => (
                          <NotificationRow
                            key={item.id}
                            item={item}
                            onMarkRead={handleMarkRead}
                            isMarkingRead={
                              markReadMutation.isPending ||
                              isInFlight(`notification:mark-read:${item.id}`)
                            }
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                    <p className="text-center text-xs text-slate-400">
                      Showing latest {notifications.length} notification
                      {notifications.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </motion.div>
            </>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
