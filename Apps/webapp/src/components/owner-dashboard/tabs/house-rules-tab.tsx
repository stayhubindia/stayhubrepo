"use client";

import { motion } from "framer-motion";
import type { PropertyDetail } from "@/types/property";

interface HouseRulesTabProps {
  property: PropertyDetail;
}

/**
 * HouseRulesTab Component
 * 
 * Displays the complete list of house rules for the property.
 * This is a placeholder that will be expanded in Task 3.8.
 */
export function HouseRulesTab({ property }: HouseRulesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-house-rules"
      aria-labelledby="tab-house-rules"
      className="p-6"
    >
      <h3 className="mb-6 text-lg font-bold text-slate-900">House Rules</h3>
      
      <div className="space-y-3">
        {/* Common house rules - placeholder */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg
              className="h-6 w-6 text-red-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">No Smoking</p>
            <p className="text-xs text-slate-600">Smoking is strictly prohibited inside the property</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg
              className="h-6 w-6 text-red-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">No Parties or Events</p>
            <p className="text-xs text-slate-600">Parties and events are not allowed</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Check-out Time</p>
            <p className="text-xs text-slate-600">Check-out by 11:00 AM</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Pets Allowed</p>
            <p className="text-xs text-slate-600">Well-behaved pets are welcome with prior approval</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> Full house rules from property data will be displayed here in Task 3.8
        </p>
      </div>
    </motion.div>
  );
}
