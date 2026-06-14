"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  Heart,
  Key,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Monitor,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useAuthStore } from "@/store/auth-store";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useMe, useUpdateMe } from "@/modules/users/hooks";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatMemberSince = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const formatActivityDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ── Sub-components ────────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
      <ShieldCheck className="w-3.5 h-3.5" />
      Verified
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-slate-900 mb-4">{children}</h2>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth();
  const { clearSession } = useAuthStore();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  // Personal info editing state
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateMutation = useUpdateMe();

  if (!isAllowed || !user) return null;

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "User";
  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim().toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";
  const memberSince = user.date_joined ? formatMemberSince(user.date_joined) : null;
  const locationStr = [user.location?.city, user.location?.state, user.location?.country]
    .filter(Boolean)
    .join(", ");

  const handleEditClick = () => {
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updateMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
      });
      setIsEditing(false);
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    clearSession();
    router.push("/");
  };

  const today = new Date();

  return (
    <div className="flex min-h-screen bg-slate-50 w-full pb-24 lg:pb-0">
      <DesktopSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* ── Topbar ── */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white">
          {/* Mobile menu */}
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">
              ⌘K
            </span>
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

        {/* ── Page content ── */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your profile, security settings, and account preferences.
              </p>
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* ── LEFT COLUMN ── */}
              <div className="space-y-6">
                {/* Profile card */}
                <Card>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-emerald-200">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-slate-900">{displayName}</span>
                        {user.is_verified && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      {memberSince && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          {user.role === "OWNER" ? "Owner" : "Tenant"} since {memberSince}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {/* Email row */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 break-all">{user.email || "Not added"}</span>
                      </div>
                      {user.email && <VerifiedBadge />}
                    </div>

                    {/* Phone row */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{user.phone || "Not added"}</span>
                      </div>
                      {user.phone && <VerifiedBadge />}
                    </div>

                    {/* Location row */}
                    <div className="flex items-center gap-3 py-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{locationStr || "Location not added"}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={handleEditClick}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </Card>

                {/* Personal Information card */}
                <Card>
                  <SectionTitle>Personal Information</SectionTitle>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            First Name
                          </label>
                          <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Last Name
                          </label>
                          <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="Last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="Email address"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="Phone number"
                        />
                      </div>

                      {saveError && (
                        <p className="text-sm text-red-600">{saveError}</p>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                        >
                          {updateMutation.isPending ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Full Name</p>
                          <p className="text-sm text-slate-900">{displayName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Email Address</p>
                          <p className="text-sm text-slate-900 break-all">{user.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Phone Number</p>
                          <p className="text-sm text-slate-900">{user.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Location</p>
                          <p className="text-sm text-slate-900">{locationStr || "—"}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleEditClick}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Edit information →
                      </button>
                    </div>
                  )}
                </Card>

                {/* Security card */}
                <Card>
                  <SectionTitle>Security</SectionTitle>
                  <div className="space-y-1">
                    <Link
                      href="/settings"
                      className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Key className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Change Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <div className="flex items-center justify-between py-3 px-1 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Two-Factor Authentication</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Enabled
                      </span>
                    </div>

                    <Link
                      href="/settings"
                      className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Active Sessions</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </Card>

                {/* Preferences card */}
                <Card>
                  <SectionTitle>Preferences</SectionTitle>
                  <div className="space-y-1">
                    <Link
                      href="/notifications"
                      className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Notification Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Email Preferences</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/settings/privacy"
                      className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Privacy Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </Card>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="space-y-6">
                {/* Documents card */}
                <Card>
                  <SectionTitle>Documents</SectionTitle>
                  <div className="space-y-3">
                    {/* Identity Proof */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-800">Identity Proof</span>
                      </div>
                      <VerifiedBadge />
                    </div>

                    {/* Address Proof */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-800">Address Proof</span>
                      </div>
                      <VerifiedBadge />
                    </div>

                    {/* Income Proof */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">Income Proof</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">Not Uploaded</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors">
                    <Upload className="w-4 h-4" />
                    Manage Documents
                  </button>
                </Card>

                {/* Recent Account Activity card */}
                <Card>
                  <SectionTitle>Recent Account Activity</SectionTitle>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Monitor className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          Logged in from Chrome on Windows
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Noida, India &bull; {formatActivityDate(today)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Current Session
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Sign out card */}
                <Card>
                  <button
                    onClick={() => {
                      clearSession();
                      router.push("/");
                    }}
                    className="w-full flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-red-600">Sign Out</span>
                  </button>
                </Card>

                {/* Delete Account card */}
                <Card className="border-red-200 bg-red-50/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-700">Delete Account</h3>
                      <p className="mt-1 text-xs text-red-500 leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="mt-4 w-full py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
                  >
                    Delete Account
                  </button>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Delete Account Confirmation Dialog ── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Delete Account?</h2>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This will permanently delete your account and all associated data. You will be signed out immediately. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
