"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { useFavorites } from "@/modules/favorites/hooks";
import { useMyProperties } from "@/modules/properties/hooks";

const formatCurrency = (value: string | number | null | undefined) =>
  `Rs. ${Number(value ?? 0).toLocaleString("en-IN")}`;

const formatMonthYear = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
  DRAFT: "bg-slate-100 text-slate-600 border border-slate-200",
  RENTED: "bg-sky-50 text-sky-700 border border-sky-100",
  EXPIRED: "bg-red-50 text-red-700 border border-red-100",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-100",
};

export default function DashboardPage() {
  const { user, isAllowed } = useRequireAuth();
  const favoritesQuery = useFavorites(user?.role === "TENANT");
  const propertiesQuery = useMyProperties();

  if (!isAllowed || !user) {
    return null;
  }

  const firstName = user.first_name || user.email?.split("@")[0] || "there";
  const isOwner = user.role === "OWNER";
  const joinedLabel = formatMonthYear(user.date_joined);
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim().toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  const profileFields = [
    { label: "First Name", value: user.first_name },
    { label: "Last Name", value: user.last_name },
    { label: "Phone", value: user.phone, required: isOwner },
    { label: "Address", value: user.location?.address },
    { label: "City", value: user.location?.city, required: isOwner },
  ];

  const completedFields = profileFields.filter((field) => Boolean(field.value)).length;
  const completionPercent = Math.round((completedFields / profileFields.length) * 100);
  const stepsLeft = profileFields.length - completedFields;
  const isProfileComplete = profileFields.filter((field) => field.required).every((field) => Boolean(field.value));

  const properties = propertiesQuery.data ?? [];
  const favorites = favoritesQuery.data ?? [];
  const activeProperties = properties.filter((property) => property.status === "ACTIVE");
  const totalViews = properties.reduce((sum, property) => sum + (property.total_views ?? 0), 0);
  const totalFavorites = properties.reduce((sum, property) => sum + (property.total_favorites ?? 0), 0);
  const totalContacts = properties.reduce((sum, property) => sum + (property.total_contacts ?? 0), 0);

  const quickActions = isOwner
    ? [
        {
          href: "/dashboard/properties/add",
          label: "Add Property",
          sub: "Create a new listing with photos and pricing.",
          icon: Plus,
          tone: "from-emerald-500 to-teal-600",
        },
        {
          href: "/dashboard/properties",
          label: "Manage Listings",
          sub: "Review status, update details, and track performance.",
          icon: Building2,
          tone: "from-slate-800 to-slate-700",
        },
        {
          href: "/chats",
          label: "Open Leads",
          sub: "Continue tenant conversations and close faster.",
          icon: MessageSquare,
          tone: "from-amber-400 to-orange-500",
        },
      ]
    : [
        {
          href: "/properties",
          label: "Browse Homes",
          sub: "Explore verified rentals across your preferred areas.",
          icon: Sparkles,
          tone: "from-emerald-500 to-teal-600",
        },
        {
          href: "/favorites",
          label: "Saved Properties",
          sub: "Revisit shortlisted homes and compare options.",
          icon: Heart,
          tone: "from-rose-500 to-pink-600",
        },
        {
          href: "/chats",
          label: "Owner Chats",
          sub: "Follow up with owners and schedule your next visit.",
          icon: MessageSquare,
          tone: "from-slate-800 to-slate-700",
        },
      ];

  const statCards = isOwner
    ? [
        {
          label: "Active Listings",
          value: String(activeProperties.length),
          meta: `${properties.length} total properties`,
          icon: Building2,
          iconWrap: "bg-emerald-100 text-emerald-700",
        },
        {
          label: "Total Views",
          value: totalViews.toLocaleString("en-IN"),
          meta: totalViews > 0 ? "Audience is discovering your ads" : "Publish listings to start getting traffic",
          icon: Eye,
          iconWrap: "bg-sky-100 text-sky-700",
        },
        {
          label: "Favorites & Leads",
          value: `${totalFavorites.toLocaleString("en-IN")} / ${totalContacts.toLocaleString("en-IN")}`,
          meta: "Saved by tenants and direct contact count",
          icon: TrendingUp,
          iconWrap: "bg-amber-100 text-amber-700",
        },
      ]
    : [
        {
          label: "Saved Properties",
          value: favorites.length.toLocaleString("en-IN"),
          meta: favorites.length ? "Your shortlist is ready for follow-up" : "Start saving homes to compare later",
          icon: Heart,
          iconWrap: "bg-rose-100 text-rose-700",
        },
        {
          label: "Preferred City",
          value: user.location?.city || "Not set",
          meta: user.location?.state || "Add your location for better matches",
          icon: MapPin,
          iconWrap: "bg-emerald-100 text-emerald-700",
        },
        {
          label: "Profile Strength",
          value: `${completionPercent}%`,
          meta: stepsLeft > 0 ? `${stepsLeft} details still missing` : "Profile looks complete",
          icon: CheckCircle2,
          iconWrap: "bg-slate-100 text-slate-700",
        },
      ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f3_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-28">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_30%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isOwner ? "Owner workspace" : "Tenant workspace"}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back, {firstName}.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {isOwner
                    ? "Track listing performance, respond to tenant interest, and keep your inventory moving from one place."
                    : "Keep your shortlisted homes, conversations, and search progress organized in one clean workspace."}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <Calendar className="h-4 w-4 text-emerald-300" />
                    Member since {joinedLabel}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {user.location?.city || "Location pending"}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl font-black text-white shadow-lg shadow-emerald-500/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-white">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "User"}
                    </p>
                    <p className="truncate text-sm text-slate-300">{user.email}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-white">{user.role}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {user.is_verified ? "Verified" : "Verification pending"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/account"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  View account details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {!isProfileComplete && (
          <section className="rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Profile completion is at {completionPercent}%</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {isOwner
                      ? "Complete the remaining details to publish listings with a more trustworthy profile."
                      : "Finish your profile to improve recommendations and faster owner responses."}
                  </p>
                </div>
              </div>
              <div className="sm:min-w-[220px]">
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-amber-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${completionPercent}%` }} />
                </div>
                <Link
                  href={isOwner ? "/owner-onboarding" : "/tenant-onboarding"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800"
                >
                  Complete profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{card.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{card.meta}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Quick actions</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">What do you want to do next?</h2>
            </div>
            <Link href="/profile" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Edit profile
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-100/40"
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
              );
            })}
          </div>
        </section>

        {isOwner ? (
          <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Portfolio</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">Recent property performance</h2>
                </div>
                <Link href="/dashboard/properties" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Manage all
                </Link>
              </div>

              {propertiesQuery.isLoading && <LoadingState message="Loading your properties..." className="py-10" />}
              {propertiesQuery.isError && (
                <ErrorState message={getApiErrorMessage(propertiesQuery.error)} className="p-4" />
              )}

              {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length > 0 && (
                <div className="space-y-4">
                  {properties.slice(0, 4).map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-900">{property.title}</h3>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[property.status] ?? statusTone.DRAFT}`}>
                              {property.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {[property.location?.city, property.location?.locality, property.property_type].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Monthly rent</p>
                          <p className="text-lg font-black text-emerald-700">{formatCurrency(property.rent)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-white p-3 text-center">
                          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                            <Eye className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-bold text-slate-900">{property.total_views}</p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Views</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3 text-center">
                          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                            <Heart className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-bold text-slate-900">{property.total_favorites}</p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Saves</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3 text-center">
                          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-bold text-slate-900">{property.total_contacts}</p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Leads</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length === 0 && (
                <EmptyState
                  title="No properties listed yet"
                  description="Start with a polished listing so tenants can discover and contact you quickly."
                  action={
                    <Link
                      href="/dashboard/properties/add"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Property
                    </Link>
                  }
                />
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Overview</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Owner snapshot</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                  <p className="text-sm text-slate-300">Publishing readiness</p>
                  <p className="mt-2 text-3xl font-black">{completionPercent}%</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {isProfileComplete ? "Your profile is ready for consistent listing activity." : "Complete the missing details to strengthen trust with tenants."}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Recommended next step</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {properties.length === 0
                      ? "Create your first listing with complete rent, location, and furnishing details."
                      : activeProperties.length === 0
                        ? "Activate or submit your draft listings so they start receiving views."
                        : "Review tenant conversations and refresh your top-performing listings."}
                  </p>
                  <Link
                    href={properties.length === 0 ? "/dashboard/properties/add" : "/chats"}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Performance totals</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>All listing views</span>
                      <span className="font-semibold text-slate-900">{totalViews.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total saves</span>
                      <span className="font-semibold text-slate-900">{totalFavorites.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lead conversations</span>
                      <span className="font-semibold text-slate-900">{totalContacts.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Shortlist</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">Saved properties</h2>
                </div>
                <Link href="/favorites" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Open wishlist
                </Link>
              </div>

              {favoritesQuery.isLoading && <LoadingState message="Loading saved properties..." className="py-10" />}
              {favoritesQuery.isError && (
                <ErrorState message={getApiErrorMessage(favoritesQuery.error)} className="p-4" />
              )}

              {!favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length > 0 && (
                <div className="space-y-4">
                  {favorites.slice(0, 4).map((favorite) => (
                    <Link
                      key={favorite.id}
                      href={`/properties/${favorite.property_id}`}
                      className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-slate-900">{favorite.property_title || "Property"}</h3>
                          <p className="mt-1 text-sm text-slate-500">{favorite.property_city || "Location not available"}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                          <Heart className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rent</p>
                          <p className="mt-1 text-lg font-black text-emerald-700">{formatCurrency(favorite.property_rent)}/mo</p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          View details <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length === 0 && (
                <EmptyState
                  title="No favorites yet"
                  description="Start exploring verified homes and save the ones worth revisiting."
                  action={
                    <Link
                      href="/properties"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      Browse Properties
                    </Link>
                  }
                />
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Next step</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Tenant dashboard notes</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                  <p className="text-sm text-slate-300">Search readiness</p>
                  <p className="mt-2 text-3xl font-black">{completionPercent}%</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {stepsLeft > 0
                      ? "Add missing profile details so owners can trust inquiries faster."
                      : "Your profile is in good shape for faster owner responses."}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Best next action</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {favorites.length > 0
                      ? "Message owners for your top saved properties before availability changes."
                      : "Start with a city or property-type search and save promising homes to compare."}
                  </p>
                  <Link
                    href={favorites.length > 0 ? "/chats" : "/properties"}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Profile details</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Current city</span>
                      <span className="font-semibold text-slate-900">{user.location?.city || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Saved homes</span>
                      <span className="font-semibold text-slate-900">{favorites.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Account verification</span>
                      <span className="font-semibold text-slate-900">{user.is_verified ? "Verified" : "Pending"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <Link
            href={isOwner ? "/analytics" : "/account"}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">{isOwner ? "Open analytics" : "Review account hub"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isOwner
                ? "Dive into listing performance, reach, and engagement from one place."
                : "Manage profile details, app preferences, and your account activity."}
            </p>
          </Link>

          <Link
            href="/profile"
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Update your profile</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep your identity, location, and contact details current so the rest of the product works better.
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
}