"use client";

import { motion } from "framer-motion";
import type { PropertyDetail } from "@/types/property";

interface AmenitiesTabProps {
  property: PropertyDetail;
}

/**
 * AmenitiesTab Component
 * 
 * Displays the complete list of property amenities.
 * This is a placeholder that will be expanded in Task 3.8.
 */
export function AmenitiesTab({ property }: AmenitiesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-amenities"
      aria-labelledby="tab-amenities"
      className="p-6"
    >
      <h3 className="mb-6 text-lg font-bold text-slate-900">All Amenities</h3>
      
      {property.amenities && property.amenities.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {property.amenities.map((amenity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700">{amenity.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">No amenities listed for this property.</p>
        </div>
      )}
    </motion.div>
  );
}
