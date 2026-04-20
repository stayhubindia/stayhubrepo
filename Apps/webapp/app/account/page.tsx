"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Heart,
  Home,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Shield,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useAuthStore } from "@/store/auth-store";

const formatMonthYear = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export default function AccountPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth();
  const { clearSession } = useAuthStore();

  if (!isAllowed || !user) return null;

  const isOwner = user.role === "OWNER";
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "User";
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim().toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  const memberSince = user.date_joined ? formatMonthYear(user.date_joined) : null;

  const profileFields = [
    { label: "First name", done: Boolean(user.first_name) },
    { label: "Last name", done: Boolean(user.last_name) },
    { label: "Email", done: Boolean(user.email) },
    { label: "Phone", done: Boolean(user.phone) },
    { label: "City", done: Boolean(user.location?.city) },
    { label: "Address", done: Boolean(user.location?.address) },
    { label: "Pincode", done: Boolean(user.location?.pincode) },
  ];

  const completedFields = profileFields.filter((item) => item.done).length;
  const completionPercent = Math.round((completedFields / profileFields.length) * 100);
  const stepsLeft = profileFields.length - completedFields;

  const primaryActions = [
    {
      href: "/profile",
      label: "Edit profile",
      sub: "Update your personal, location, and contact details.",
      icon: User,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      href: "/chats",
      label: "Messages",
      sub: isOwner ? "Respond to tenant conversations quickly." : "Continue your chats with owners.",
      icon: MessageSquare,
      tone: "from-slate-800 to-slate-700",
    },
    {
      href: "/settings",
      label: "Settings",
      sub: "Review app preferences, privacy, and notifications.",
      icon: Settings,
      tone: "from-amber-400 to-orange-500",
    },
  ];

  const accountMenu: {
    href?: string;
    onClick?: () => void;
    label: string;
    sub: string;
    icon: React.ElementType;
    iconWrap: string;
    badge?: string;
    ownerOnly?: boolean;
    tenantOnly?: boolean;
    danger?: boolean;
  }[] = [
    {
      href: isOwner ? "/dashboard/properties" : "/dashboard",
      label: isOwner ? "My listings" : "My dashboard",
      sub: isOwner ? "Manage your rental inventory and listing quality." : "See your current activity and progress.",
      icon: Home,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      href: "/favorites",
      label: "Wishlist",
      sub: "Properties you have saved for later review.",
      icon: Heart,
      iconWrap: "bg-rose-100 text-rose-700",
      tenantOnly: true,
    },
    {
      href: "/analytics",
      label: "Analytics",
      sub: "Track views, favorites, and lead performance.",
      icon: BarChart3,
      iconWrap: "bg-sky-100 text-sky-700",
      ownerOnly: true,
    },
    {
      href: "/notifications",
      label: "Notifications",
      sub: "Review recent updates, alerts, and account activity.",
      icon: Bell,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      href: isOwner ? "/premium/seller" : "/premium/buyer",
      label: isOwner ? "Premium seller" : "Premium buyer",
      sub: isOwner ? "Upgrade to improve visibility and lead access." : "Unlock faster contact and premium discovery tools.",
      icon: Star,
      iconWrap: "bg-amber-100 text-amber-700",
      badge: "New",
    },
    {
      onClick: () => {
        clearSession();
        router.push("/");
      },
      label: "Sign out",
      sub: "Log out securely from this session.",
      icon: LogOut,
      iconWrap: "bg-red-100 text-red-600",
      danger: true,
    },
  ];

  const visibleMenu = accountMenu.filter((item) => {
    if (item.ownerOnly && !isOwner) return false;
    if (item.tenantOnly && isOwner) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f3_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-28">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_28%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Account center
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manage your StayHub identity.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Keep your personal details, account status, communication preferences, and role-specific tools organized in one place.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    {user.is_verified ? "Verified account" : "Verification pending"}
                  </div>
                  {memberSince && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <User className="h-4 w-4 text-emerald-300" />
                      Member since {memberSince}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl font-black text-white shadow-lg shadow-emerald-500/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                    <p className="truncate text-sm text-slate-300">{user.email}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-white">{isOwner ? "Property Owner" : "Tenant"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Profile</p>
                    <p className="mt-1 text-sm font-semibold text-white">{completionPercent}% complete</p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Open full profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {stepsLeft > 0 && (
          <section className="rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your account profile is {completionPercent}% complete</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Complete the remaining {stepsLeft} detail{stepsLeft > 1 ? "s" : ""} to improve trust, recommendations, and account quality.
                  </p>
                </div>
              </div>
              <div className="sm:min-w-[220px]">
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-amber-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercent}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                  />
                </div>
                <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800">
                  Complete profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contact status</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {user.phone ? "Ready" : "Pending"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Phone className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {user.phone ? "Your phone number is available for account-related actions." : "Add a phone number to improve verification and follow-up."}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location profile</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{user.location?.city || "Unset"}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {user.location?.state || "Add your city and address to make discovery and recommendations more accurate."}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Verification</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{user.is_verified ? "Active" : "Review"}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {user.is_verified ? "Your account is verified and ready for full usage." : "Verification still needs attention before full trust signals appear."}
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Quick actions</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Manage your account workflow</h2>
            </div>
            <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Open dashboard
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {primaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className="group block rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-100/40"
                  >
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{action.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{action.sub}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                      Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Account tools</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Navigation and controls</h2>
              </div>
            </div>

            <div className="space-y-3">
              {visibleMenu.map((item, index) => {
                const Icon = item.icon;
                const card = (
                  <div className={`group flex items-center gap-4 rounded-[24px] border px-4 py-4 transition-all hover:shadow-md ${item.danger ? "border-red-100 bg-red-50/40 hover:border-red-200" : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white"}`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconWrap}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${item.danger ? "text-red-600" : "text-slate-900"}`}>{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{item.sub}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${item.danger ? "text-red-400" : "text-slate-400"}`} />
                  </div>
                );

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                  >
                    {item.onClick ? (
                      <button onClick={item.onClick} className="block w-full text-left">
                        {card}
                      </button>
                    ) : (
                      <Link href={item.href!} className="block">
                        {card}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Account summary</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Your details at a glance</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                  <p className="text-sm text-slate-300">Profile completion</p>
                  <p className="mt-2 text-3xl font-black">{completionPercent}%</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {stepsLeft > 0 ? `${stepsLeft} account details still need attention.` : "Everything important is filled in and ready."}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Profile checklist</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profileFields.map((field) => (
                      <span
                        key={field.label}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${field.done ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {field.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-2.5 w-2.5 rounded-full border border-slate-300" />}
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Contact details</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Communication info</h2>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Mail className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-slate-900">Email</p>
                    <p className="mt-1 break-all">{user.email || "Not added"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Phone className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-slate-900">Phone</p>
                    <p className="mt-1">{user.phone || "Not added"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-slate-900">Location</p>
                    <p className="mt-1">
                      {[user.location?.address, user.location?.city, user.location?.state, user.location?.pincode].filter(Boolean).join(", ") || "Location not added"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}