"use client";

import { motion } from "framer-motion";
import { CalendarX } from "lucide-react";

/**
 * BookingsTab Component
 *
 * Bookings management is not available for this property type.
 * Owners can view tenant conversations via the Messages section.
 */
export function BookingsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-bookings"
      aria-labelledby="tab-bookings"
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <CalendarX className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Bookings not available</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Booking management is not supported for this property. Use the Messages section to communicate with tenants.
      </p>
    </motion.div>
  );
}
