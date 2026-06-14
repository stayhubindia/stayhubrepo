"use client";

import { motion } from "framer-motion";

/**
 * ActivityTab Component
 * 
 * Displays property activity log and history.
 * This is a placeholder that will be expanded in Task 3.8.
 */
export function ActivityTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-activity"
      aria-labelledby="tab-activity"
      className="p-6"
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-900">Activity Log</h3>
        <p className="text-sm text-slate-600">
          Property activity history and timeline will be displayed here.
        </p>
        <p className="mt-2 text-xs text-slate-500">Coming soon in Task 3.8</p>
      </div>
    </motion.div>
  );
}
