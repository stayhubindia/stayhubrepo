"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Menu } from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useOwnerPropertyDetail, usePropertyEnquiries } from "@/modules/owner-dashboard/hooks";
import { LoadingState, ErrorState } from "@/components/ui/query-states";
import { getApiErrorMessage } from "@/lib/api-error";
import { PropertyHero } from "@/components/owner-dashboard/property-hero";
import { TabNavigation } from "@/components/owner-dashboard/tab-navigation";
import { OverviewTab } from "@/components/owner-dashboard/tabs/overview-tab";
import { DetailsTab } from "@/components/owner-dashboard/tabs/details-tab";
import { AmenitiesTab } from "@/components/owner-dashboard/tabs/amenities-tab";
import { LocationTab } from "@/components/owner-dashboard/tabs/location-tab";
import { HouseRulesTab } from "@/components/owner-dashboard/tabs/house-rules-tab";
import { EnquiriesTab } from "@/components/owner-dashboard/tabs/enquiries-tab";
import { ActivityTab } from "@/components/owner-dashboard/tabs/activity-tab";
import { PerformanceMetrics } from "@/components/owner-dashboard/performance-metrics";
import { StatusCard } from "@/components/owner-dashboard/status-card";
import { ShareCard } from "@/components/owner-dashboard/share-card";
import { ActionButtons } from "@/components/owner-dashboard/action-buttons";
import { SupportCard } from "@/components/owner-dashboard/support-card";
import { DashboardErrorBoundary } from "@/components/owner-dashboard/dashboard-error-boundary";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import type { DashboardTab } from "@/types/owner-dashboard";

/**
 * Owner Property Dashboard Page
 * 
 * This page provides property owners with a comprehensive dashboard to manage
 * their property listings, view analytics, respond to enquiries, and manage bookings.
 * 
 * Features:
 * - Role-based access control (OWNER and ADMIN only)
 * - Three-column responsive layout
 * - Property details and management
 * - Performance metrics and analytics
 * - Enquiries and bookings management
 * 
 * Access Control:
 * - TENANT users are redirected to the tenant-facing property detail page
 * - Unauthenticated users are redirected to the auth page
 * - OWNER users can only access their own properties (403 for others)
 * - ADMIN users have access to all properties
 */
export default function OwnerPropertyDashboardPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params?.id ?? "";
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth();

  // Fetch property details
  const propertyQuery = useOwnerPropertyDetail(propertyId, Boolean(user));
  const property = propertyQuery.data;

  // Fetch enquiries for count badge
  const enquiriesQuery = usePropertyEnquiries(propertyId, Boolean(user && property));

  // Local state
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Define tabs with count badges
  const tabs: DashboardTab[] = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "amenities", label: "Amenities" },
    { id: "location", label: "Location" },
    { id: "house-rules", label: "House Rules" },
    { 
      id: "enquiries", 
      label: "Enquiries",
      count: enquiriesQuery.data?.length || 0
    },
    { id: "activity", label: "Activity" },
  ];

  // Analytics: track dashboard viewed
  useEffect(() => {
    if (property && user) {
      console.info("[Analytics] owner_dashboard_viewed", {
        property_id: property.id,
        property_type: property.property_type,
        status: property.status,
      });
    }
  }, [property?.id]);

  // Analytics: track tab selection
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    console.info("[Analytics] owner_dashboard_tab_selected", { tab_name: tabId });
  };

  // Role-based access control
  useEffect(() => {
    if (!user) return;

    // Redirect tenants to the tenant-facing property detail page
    if (user.role === "TENANT") {
      router.replace(`/properties/${propertyId}`);
      return;
    }

    // Check if owner owns this property (skip for admins)
    if (user.role === "OWNER" && property && property.owner !== user.id) {
      toast.error("You do not have permission to view this property");
      router.replace("/my-ads");
      return;
    }
  }, [user, property, propertyId, router]);

  // Don't render anything until auth is checked
  if (!isAllowed || !user) {
    return null;
  }

  // Show loading state
  if (propertyQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <LoadingState message="Loading property dashboard..." />
      </div>
    );
  }

  // Show error state
  if (propertyQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4">
        <div className="text-center">
          <ErrorState message={getApiErrorMessage(propertyQuery.error)} />
          <button
            onClick={() => propertyQuery.refetch()}
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Property not found
  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4">
        <ErrorState message="Property not found" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar — same as homepage */}
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* ── Top Bar — same style as homepage ── */}
        <header className="h-20 border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-white/80 backdrop-blur-xl shrink-0">
          {/* Mobile menu + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{property.title}</h1>
              <p className="hidden sm:block text-sm text-slate-500">Property Dashboard</p>
            </div>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-2 sm:gap-6">
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            <div className="hidden sm:block w-px h-8 bg-slate-100 mx-2" />
            <ProfileDropdown />
          </div>
        </header>

        {/* ── Main Content ── */}
        <div className="flex flex-1">
          {/* Centre: property content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-32 overflow-y-auto">
            <DashboardErrorBoundary>
              <PropertyHero property={property} />

              {/* Tab Navigation and Content */}
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <TabNavigation
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
                <div className="min-h-[400px]">
                  {activeTab === "overview" && <OverviewTab property={property} />}
                  {activeTab === "details" && <DetailsTab property={property} />}
                  {activeTab === "amenities" && <AmenitiesTab property={property} />}
                  {activeTab === "location" && <LocationTab property={property} />}
                  {activeTab === "house-rules" && <HouseRulesTab property={property} />}
                  {activeTab === "enquiries" && <EnquiriesTab propertyId={propertyId} />}
                  {activeTab === "activity" && <ActivityTab />}
                </div>
              </div>
            </DashboardErrorBoundary>
          </main>

          {/* Right Sidebar — performance metrics & actions */}
          <aside className="hidden xl:block xl:w-80 2xl:w-96 border-l border-slate-200 bg-white">
            <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto p-6 space-y-4">
              <ActionButtons property={property} />
              <PerformanceMetrics propertyId={propertyId} />
              <StatusCard property={property} />
              <ShareCard property={property} />
              <SupportCard />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
