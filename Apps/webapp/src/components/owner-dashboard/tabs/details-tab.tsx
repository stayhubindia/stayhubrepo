"use client";

import { motion } from "framer-motion";
import type { PropertyDetail } from "@/types/property";

interface DetailsTabProps {
  property: PropertyDetail;
}

/**
 * DetailsTab Component
 * 
 * Displays detailed property specifications and information.
 * This is a placeholder that will be expanded in future tasks.
 */
export function DetailsTab({ property }: DetailsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-details"
      aria-labelledby="tab-details"
      className="p-6"
    >
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-900">Property Details</h3>
        <p className="text-sm text-slate-600">
          Detailed property specifications will be displayed here.
        </p>
        <p className="mt-2 text-xs text-slate-500">Coming soon in Task 3.8</p>
      </div>
    </motion.div>
  );
}
