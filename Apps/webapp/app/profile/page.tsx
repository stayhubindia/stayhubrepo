"use client";

import {
  Building2,
  Check,
  CheckCircle2,
  Heart,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Phone,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useMe, useUpdateMe } from "@/modules/users/hooks";
import { useLinkFirebase } from "@/modules/auth/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { auth, googleProvider } from "@/config/firebase";
import { signInWithPopup } from "firebase/auth";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";

interface ProfileDraft {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function ProfilePage() {
  const { user, isAllowed } = useRequireAuth();
  const meQuery = useMe(Boolean(user));
  const updateMutation = useUpdateMe();
  const linkFirebaseMutation = useLinkFirebase();
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [linkingError, setLinkingError] = useState("");
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  useEffect(() => {
    if (!meQuery.data) return;
    setDraft({
      first_name: meQuery.data.first_name ?? "",
      last_name: meQuery.data.last_name ?? "",
      email: meQuery.data.email ?? "",
      phone: meQuery.data.phone ?? "",
      address: meQuery.data.location?.address ?? "",
      city: meQuery.data.location?.city ?? "",
      state: meQuery.data.location?.state ?? "",
      pincode: meQuery.data.location?.pincode ?? "",
    });
  }, [meQuery.data]);

  const hasChanges = useMemo(() => {
    if (!draft || !meQuery.data) return false;
    return (
      draft.first_name !== (meQuery.data.first_name ?? "") ||
      draft.last_name !== (meQuery.data.last_name ?? "") ||
      draft.email !== (meQuery.data.email ?? "") ||
      draft.phone !== (meQuery.data.phone ?? "") ||
      draft.address !== (meQuery.data.location?.address ?? "") ||
      draft.city !== (meQuery.data.location?.city ?? "") ||
      draft.state !== (meQuery.data.location?.state ?? "") ||
      draft.pincode !== (meQuery.data.location?.pincode ?? "")
    );
  }, [draft, meQuery.data]);

  if (!isAllowed || !user) {
    return null;
  }

  const onSave = async () => {
    if (!draft || !meQuery.data) return;
    setNotice("");

    const payload: Record<string, unknown> = {};
    if (draft.first_name !== (meQuery.data.first_name ?? "")) payload.first_name = draft.first_name;
    if (draft.last_name !== (meQuery.data.last_name ?? "")) payload.last_name = draft.last_name;
    if (draft.email !== (meQuery.data.email ?? "")) payload.email = draft.email.trim() || null;
    if (draft.phone !== (meQuery.data.phone ?? "")) payload.phone = draft.phone.trim() || null;

    const locationChanged = 
      draft.address !== (meQuery.data.location?.address ?? "") ||
      draft.city !== (meQuery.data.location?.city ?? "") ||
      draft.state !== (meQuery.data.location?.state ?? "") ||
      draft.pincode !== (meQuery.data.location?.pincode ?? "");

    if (locationChanged) {
      payload.address = draft.address.trim();
      payload.city = draft.city.trim();
      payload.state = draft.state.trim();
      payload.pincode = draft.pincode.trim();
    }

    if (!Object.keys(payload).length) {
      setNotice("No changes to save.");
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      await meQuery.refetch();
      setNotice("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    }
  };

  const onCancel = () => {
    if (meQuery.data) {
      setDraft({
        first_name: meQuery.data.first_name ?? "",
        last_name: meQuery.data.last_name ?? "",
        email: meQuery.data.email ?? "",
        phone: meQuery.data.phone ?? "",
        address: meQuery.data.location?.address ?? "",
        city: meQuery.data.location?.city ?? "",
        state: meQuery.data.location?.state ?? "",
        pincode: meQuery.data.location?.pincode ?? "",
      });
    }
    setIsEditing(false);
    setNotice("");
  };

  const onLinkGoogle = async () => {
    if (!auth) {
      setLinkingError("Google authentication not available");
      return;
    }
    setLinkingError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await linkFirebaseMutation.mutateAsync(idToken);
      await meQuery.refetch();
      setLinkingError("");
      setNotice("Google account linked successfully!");
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      setLinkingError(err?.response?.data?.detail || getApiErrorMessage(error));
    }
  };

  /* ── helpers ── */
  const fullName = [meQuery.data?.first_name, meQuery.data?.last_name].filter(Boolean).join(" ") || "Your Name";
  const initials = [meQuery.data?.first_name?.[0], meQuery.data?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "U";
  const role = meQuery.data?.role ?? "";
  const roleLabel = role === "OWNER" ? "Property Owner" : role === "TENANT" ? "Tenant" : role;
  const roleBg = role === "OWNER" ? "bg-violet-500/15 text-violet-300 border-violet-500/20" : "bg-sky-500/15 text-sky-300 border-sky-500/20";

  const inputCls = (editing: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
      editing
        ? "border-slate-300 bg-white text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        : "border-slate-100 bg-slate-50 text-slate-700 cursor-default"
    }`;

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
          <div className="mx-auto max-w-2xl">

        {/* ── Hero card ── */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(99,102,241,0.3),_transparent_42%),radial-gradient(circle_at_80%_70%,_rgba(139,92,246,0.2),_transparent_38%)]" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-5">
              {/* avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl font-bold text-indigo-300 ring-2 ring-indigo-500/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold sm:text-2xl">{fullName}</p>
                <p className="mt-0.5 truncate text-sm text-slate-400">{meQuery.data?.email || "—"}</p>
                {roleLabel && (
                  <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBg}`}>
                    {roleLabel}
                  </span>
                )}
              </div>
              {!isEditing && draft && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            {/* google linked badge */}
            {meQuery.data?.firebase_uid && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Google account linked
              </div>
            )}
          </div>
        </section>

        {/* ── Notice ── */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3.5 text-sm text-indigo-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <p className="flex-1">{notice}</p>
              <button onClick={() => setNotice("")} className="shrink-0 text-indigo-400 hover:text-indigo-600">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading / Error / Empty ── */}
        {meQuery.isLoading && <LoadingState message="Loading profile…" className="py-10" />}
        {meQuery.isError && <ErrorState message={getApiErrorMessage(meQuery.error)} className="mt-4 p-4" />}
        {!meQuery.isLoading && !meQuery.isError && !draft && (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6">
            <EmptyState title="Profile not available" description="Please refresh and try again." className="py-4" />
          </div>
        )}

        {/* ── Form ── */}
        {draft && (
          <div className="mt-4 space-y-4">

            {/* Personal Info */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <User className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">First name</label>
                  <input
                    className={inputCls(isEditing)}
                    value={draft.first_name}
                    onChange={(e) => setDraft((p) => p ? { ...p, first_name: e.target.value } : p)}
                    readOnly={!isEditing}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Last name</label>
                  <input
                    className={inputCls(isEditing)}
                    value={draft.last_name}
                    onChange={(e) => setDraft((p) => p ? { ...p, last_name: e.target.value } : p)}
                    readOnly={!isEditing}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Contact</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className={`${inputCls(isEditing)} pl-10`}
                      value={draft.email}
                      onChange={(e) => setDraft((p) => p ? { ...p, email: e.target.value } : p)}
                      readOnly={!isEditing}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Phone number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputCls(isEditing)} pl-10`}
                      value={draft.phone}
                      onChange={(e) => setDraft((p) => p ? { ...p, phone: e.target.value } : p)}
                      readOnly={!isEditing}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Address</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Street address</label>
                  <input
                    className={inputCls(isEditing)}
                    value={draft.address}
                    onChange={(e) => setDraft((p) => p ? { ...p, address: e.target.value } : p)}
                    readOnly={!isEditing}
                    placeholder="123, MG Road"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">City</label>
                  <input
                    className={inputCls(isEditing)}
                    value={draft.city}
                    onChange={(e) => setDraft((p) => p ? { ...p, city: e.target.value } : p)}
                    readOnly={!isEditing}
                    placeholder="Delhi"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">State</label>
                    <input
                      className={inputCls(isEditing)}
                      value={draft.state}
                      onChange={(e) => setDraft((p) => p ? { ...p, state: e.target.value } : p)}
                      readOnly={!isEditing}
                      placeholder="Delhi"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Pincode</label>
                    <input
                      className={inputCls(isEditing)}
                      value={draft.pincode}
                      onChange={(e) => setDraft((p) => p ? { ...p, pincode: e.target.value } : p)}
                      readOnly={!isEditing}
                      placeholder="110001"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account details */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Account</h2>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
                <div>
                  <p className="text-xs text-slate-500">Account role</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{roleLabel || "—"}</p>
                </div>
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  Read-only
                </span>
              </div>
            </div>

            {/* Connected accounts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Link2 className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Connected accounts</h2>
              </div>

              {linkingError && (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {linkingError}
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Google G */}
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Google</p>
                    <p className="text-xs text-slate-500">{meQuery.data?.firebase_uid ? "Connected" : "Not connected"}</p>
                  </div>
                </div>
                {meQuery.data?.firebase_uid ? (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Linked
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onLinkGoogle}
                    disabled={linkFirebaseMutation.isPending || !auth}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {linkFirebaseMutation.isPending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                    {linkFirebaseMutation.isPending ? "Linking…" : "Link account"}
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {meQuery.data?.firebase_uid
                  ? "You can sign in with Google using this linked account."
                  : "Link Google to enable one-tap sign-in on your next visit."}
              </p>
            </div>

            {/* Save / Cancel */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="flex gap-3"
                >
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!hasChanges || updateMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateMutation.isPending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
