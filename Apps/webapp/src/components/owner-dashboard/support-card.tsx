"use client";

import { motion } from "framer-motion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * SupportCard Component
 *
 * Displays a "Need help?" card with a Contact Support button
 * that navigates to the support page.
 */
export function SupportCard() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <HelpCircle className="h-5 w-5 text-slate-600" />
        <h3 className="text-sm font-bold text-slate-900">Need help?</h3>
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-slate-600">
          Our support team is available 24/7 to help you manage your property listing.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/contact")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
          aria-label="Contact support"
        >
          <MessageCircle className="h-4 w-4" />
          Contact Support
        </motion.button>
      </div>
    </div>
  );
}
