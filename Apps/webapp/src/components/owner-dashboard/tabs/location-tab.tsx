"use client";

import { motion } from "framer-motion";
import type { PropertyDetail } from "@/types/property";

interface LocationTabProps {
  property: PropertyDetail;
}

/**
 * LocationTab Component
 * 
 * Displays the property location with an interactive map.
 * This is a placeholder that will be expanded in Task 3.8.
 */
export function LocationTab({ property }: LocationTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-location"
      aria-labelledby="tab-location"
      className="p-6"
    >
      <h3 className="mb-6 text-lg font-bold text-slate-900">Location</h3>
      
      {/* Address */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <svg
              className="h-5 w-5 text-emerald-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Address</p>
            <p className="mt-1 text-sm text-slate-600">
              {property.location?.address || "Address not available"}
            </p>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <h4 className="mb-2 text-lg font-bold text-slate-900">Interactive Map</h4>
        <p className="text-sm text-slate-600">
          Full map view with geocoding will be implemented here.
        </p>
        <p className="mt-2 text-xs text-slate-500">Coming soon in Task 3.8</p>
      </div>
    </motion.div>
  );
}
