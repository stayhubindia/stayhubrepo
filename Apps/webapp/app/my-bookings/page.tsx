"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookMarked,
  Building2,
  Calendar,
  CircleHelp,
  Heart,
  HeartOff,
  Home,
  Menu,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";
import {
  useSavedProperties,
  useBookingConversations,
  useContactLogs,
  useRemoveSaved,
} from "@/modules/bookings/hooks";
import type { BookingTab, SavedProperty, BookingConversation, ContactLogEntry } from "@/modules/bookings/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: string | number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
};

const contactTypeLabel: Record<string, string> = {
  PHONE: "Called owner",
  CHAT: "Chat opened",
  WHATSAPP: "WhatsApp contact",
};

const contactTypeIcon: Record<string, React.ElementType> = {
  PHONE: PhoneCall,
  CHAT: MessageCircle,
  WHATSAPP: MessageCircle,
};

// ── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
          : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-700"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Saved Property Card ──────────────────────────────────────────────────────

function SavedCard({
  item,
  index,
}: {
  item: SavedProperty;
  index: number;
}) {
  const removeMutation = useRemoveSaved();
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5"
    >
      {/* Status ribbon */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
          <Heart className="h-3 w-3 fill-white" />
          Saved
        </span>
      </div>

      {/* Placeholder image area */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-emerald-300">
            <Home className="h-12 w-12" />
            <span className="text-xs font-medium text-emerald-400">Property Image</span>
          </div>
        </div>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5">
        {/* Title & location */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
            {item.property_title}
          </h3>
          {item.property_city && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {item.property_city}
            </p>
          )}
        </div>

        {/* Rent */}
        <div className="mb-4 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(item.property_rent)}
          </span>
          <span className="text-sm text-slate-500">/month</span>
        </div>

        {/* Saved date */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="text-xs text-slate-500">
            Saved {formatRelative(item.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${item.property_id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            View Property
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {confirmRemove ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  removeMutation.mutate(item.property_id);
                  setConfirmRemove(false);
                }}
                disabled={removeMutation.isPending}
                className="rounded-xl bg-red-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              title="Remove from saved"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <HeartOff className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Conversation Card ────────────────────────────────────────────────────────

function ConversationCard({
  item,
  index,
  currentUserId,
}: {
  item: BookingConversation;
  index: number;
  currentUserId: string;
}) {
  const isOwner = item.owner.id === currentUserId;
  const unreadCount = isOwner ? item.owner_unread_count : item.tenant_unread_count;
  const otherParty = isOwner ? item.tenant : item.owner;
  const otherPartyName =
    [otherParty.first_name, otherParty.last_name].filter(Boolean).join(" ") || "User";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5"
    >
      {/* Status ribbon */}
      <div className="absolute top-4 left-4 z-10">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${
            item.status === "ACTIVE"
              ? "bg-sky-600 text-white"
              : "bg-slate-500 text-white"
          }`}
        >
          <MessageCircle className="h-3 w-3 fill-white" />
          {item.status === "ACTIVE" ? "Active Chat" : "Archived"}
        </span>
      </div>

      {/* Image placeholder */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-sky-300">
            <MessageCircle className="h-12 w-12" />
            <span className="text-xs font-medium text-sky-400">Property Conversation</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
            {item.property.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
            {isOwner ? "Tenant: " : "Owner: "}
            {otherPartyName}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Messages
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">{item.message_count}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Last Activity
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatRelative(item.last_message_at)}
            </p>
          </div>
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">
              {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/chats?conversation=${item.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
          >
            Open Chat
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/properties/${item.property.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
            title="View Property"
          >
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Contact Log Card ─────────────────────────────────────────────────────────

function ContactLogCard({ item, index }: { item: ContactLogEntry; index: number }) {
  const Icon = contactTypeIcon[item.contact_type] ?? Phone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5"
    >
      {/* Status ribbon */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
          <Icon className="h-3 w-3" />
          {contactTypeLabel[item.contact_type] ?? "Contacted"}
        </span>
      </div>

      {/* Image placeholder */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-violet-300">
            <Icon className="h-12 w-12" />
            <span className="text-xs font-medium text-violet-400">Contact Record</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
            {item.property_title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
            Contact method: {contactTypeLabel[item.contact_type]}
          </p>
        </div>

        {/* Message */}
        {item.message && (
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
              Your note
            </p>
            <p className="text-sm text-slate-700 line-clamp-2">{item.message}</p>
          </div>
        )}

        {/* Date */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="text-xs text-slate-500">
            Contacted {formatRelative(item.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${item.property}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
          >
            View Property
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Need Help section ────────────────────────────────────────────────────────

function NeedHelpBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mt-10 flex flex-col items-start gap-4 rounded-[24px] border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
          <CircleHelp className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">Need help?</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Our support team is available to assist with your property inquiries and saved listings.
          </p>
        </div>
      </div>
      <a
        href="mailto:support@stayhub.in"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        Contact Support
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MyBookingsPage() {
  const { user, isAllowed } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<BookingTab>("saved");
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const savedQuery = useSavedProperties(isAllowed);
  const conversationsQuery = useBookingConversations(isAllowed);
  const contactsQuery = useContactLogs(isAllowed && user?.role === "OWNER");

  if (!isAllowed || !user) return null;

  const savedItems = savedQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];
  const contacts = contactsQuery.data ?? [];

  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: "saved", label: "Saved Properties", count: savedItems.length },
    { key: "discussions", label: "Discussions", count: conversations.length },
    ...(user.role === "OWNER"
      ? [{ key: "contacts" as BookingTab, label: "Contact Logs", count: contacts.length }]
      : []),
  ];

  const isLoadingActive =
    (activeTab === "saved" && savedQuery.isLoading) ||
    (activeTab === "discussions" && conversationsQuery.isLoading) ||
    (activeTab === "contacts" && contactsQuery.isLoading);

  const isErrorActive =
    (activeTab === "saved" && savedQuery.isError) ||
    (activeTab === "discussions" && conversationsQuery.isError) ||
    (activeTab === "contacts" && contactsQuery.isError);

  const errorMessage =
    activeTab === "saved"
      ? getApiErrorMessage(savedQuery.error)
      : activeTab === "discussions"
        ? getApiErrorMessage(conversationsQuery.error)
        : getApiErrorMessage(contactsQuery.error);

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Topbar ── */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          {/* Mobile menu + logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Desktop search */}
          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Search by location, property or category"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          {/* Right actions */}
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

        {/* ── Page Content ── */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 pb-28">
          <div className="mx-auto max-w-6xl">

            {/* ── Page Header ── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              {/* Breadcrumb */}
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">My Bookings</span>
              </div>

              {/* Hero header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    {user.role === "OWNER" ? "Owner View" : "Tenant View"}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    My Bookings
                  </h1>
                  <p className="mt-2 text-base text-slate-500">
                    {user.role === "TENANT"
                      ? "Track your saved properties and active conversations with owners."
                      : "View contact logs and manage property conversations."}
                  </p>
                </div>

                {/* Summary stats */}
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-center min-w-[80px]">
                    <p className="text-2xl font-black text-slate-900">{savedItems.length}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                      Saved
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-center min-w-[80px]">
                    <p className="text-2xl font-black text-slate-900">{conversations.length}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                      Chats
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              {tabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={activeTab === tab.key}
                  label={tab.label}
                  count={tab.count}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </motion.div>

            {/* ── Content Area ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {isLoadingActive && (
                  <LoadingState
                    message={
                      activeTab === "saved"
                        ? "Loading saved properties…"
                        : activeTab === "discussions"
                          ? "Loading conversations…"
                          : "Loading contact logs…"
                    }
                    className="py-16"
                  />
                )}

                {!isLoadingActive && isErrorActive && (
                  <ErrorState message={errorMessage} className="py-8 px-4" />
                )}

                {!isLoadingActive && !isErrorActive && activeTab === "saved" && (
                  <>
                    {savedItems.length === 0 ? (
                      <EmptyState
                        title="No saved properties yet"
                        description="Browse properties and tap the heart icon to save your favorites here."
                        action={
                          <Link
                            href="/properties"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            <Search className="h-4 w-4" />
                            Browse Properties
                          </Link>
                        }
                        className="py-20"
                      />
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {savedItems.map((item, i) => (
                          <SavedCard key={item.id} item={item} index={i} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!isLoadingActive && !isErrorActive && activeTab === "discussions" && (
                  <>
                    {conversations.length === 0 ? (
                      <EmptyState
                        title="No conversations yet"
                        description="Start a conversation by messaging an owner from a property listing."
                        action={
                          <Link
                            href="/properties"
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                          >
                            <Search className="h-4 w-4" />
                            Find Properties
                          </Link>
                        }
                        className="py-20"
                      />
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {conversations.map((item, i) => (
                          <ConversationCard
                            key={item.id}
                            item={item}
                            index={i}
                            currentUserId={user.id}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!isLoadingActive && !isErrorActive && activeTab === "contacts" && (
                  <>
                    {contacts.length === 0 ? (
                      <EmptyState
                        title="No contact records found"
                        description="Contact logs from tenants will appear here once they reach out."
                        className="py-20"
                      />
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {contacts.map((item, i) => (
                          <ContactLogCard key={item.id} item={item} index={i} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ── Need Help Banner ── */}
            <NeedHelpBanner />

          </div>
        </div>
      </main>
    </div>
  );
}
