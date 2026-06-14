"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Power, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUpdatePropertyStatus, useExpireProperty } from "@/modules/owner-dashboard/hooks";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PropertyDetail } from "@/types/property";

interface StatusCardProps {
  property: PropertyDetail;
}

/**
 * StatusCard Component
 *
 * Displays the property status with an Active/Inactive toggle
 * and a Deactivate Ad button. Sends PATCH/POST requests on change.
 */
export function StatusCard({ property }: StatusCardProps) {
  const isActive = property.status === "ACTIVE";

  const updateStatus = useUpdatePropertyStatus();
  const expireProperty = useExpireProperty();

  const isPending = updateStatus.isPending || expireProperty.isPending;

  const handleToggle = async () => {
    const newStatus = isActive ? "EXPIRED" : "ACTIVE";
    try {
      await updateStatus.mutateAsync({ propertyId: property.id, status: newStatus });
      toast.success(`Property ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeactivate = async () => {
    try {
      await expireProperty.mutateAsync(property.id);
      toast.success("Property deactivated successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Power className="h-5 w-5 text-slate-600" />
        <h3 className="text-sm font-bold text-slate-900">Status</h3>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Toggle Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isActive ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isActive
                ? "Visible to tenants"
                : "Hidden from search results"}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            role="switch"
            aria-checked={isActive}
            aria-label="Toggle property status"
            disabled={isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
              isActive ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <motion.span
              layout
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
              animate={{ x: isActive ? 24 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Status Message */}
        <div
          className={`rounded-xl px-4 py-3 text-xs ${
            isActive
              ? "bg-emerald-50 text-emerald-800"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          {isActive
            ? "Your property is live and visible to potential tenants."
            : "Your property is currently hidden. Activate it to receive enquiries."}
        </div>

        {/* Deactivate Button */}
        {isActive && (
          <button
            onClick={handleDeactivate}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50"
          >
            {expireProperty.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Deactivate Ad
          </button>
        )}
      </div>
    </div>
  );
}
