"use client";

import { motion } from "framer-motion";
import { usePropertyEnquiries } from "@/modules/owner-dashboard/hooks";
import { LoadingState, ErrorState } from "@/components/ui/query-states";
import { getApiErrorMessage } from "@/lib/api-error";

interface EnquiriesTabProps {
  propertyId: string;
}

/**
 * EnquiriesTab Component
 * 
 * Displays a list of tenant enquiries for the property.
 * This is a basic implementation that will be expanded in Task 3.6.
 */
export function EnquiriesTab({ propertyId }: EnquiriesTabProps) {
  const enquiriesQuery = usePropertyEnquiries(propertyId);

  if (enquiriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingState message="Loading enquiries..." />
      </div>
    );
  }

  if (enquiriesQuery.isError) {
    return (
      <div className="p-6">
        <ErrorState message={getApiErrorMessage(enquiriesQuery.error)} />
      </div>
    );
  }

  const enquiries = enquiriesQuery.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-enquiries"
      aria-labelledby="tab-enquiries"
      className="p-6"
    >
      <h3 className="mb-6 text-lg font-bold text-slate-900">
        Enquiries {enquiries.length > 0 && `(${enquiries.length})`}
      </h3>

      {enquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
            <svg
              className="h-8 w-8 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-bold text-slate-900">No enquiries yet</h4>
          <p className="text-sm text-slate-600">
            When tenants contact you about this property, their enquiries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-sm font-bold text-emerald-700">
                    {enquiry.tenant.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Enquiry Info */}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{enquiry.tenant.name}</p>
                  <p className="text-xs text-slate-600">
                    {enquiry.contact_type} • {new Date(enquiry.created_at).toLocaleDateString()}
                  </p>
                  {enquiry.message && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{enquiry.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                Contact
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> Full enquiry management features will be implemented in Task 3.6
        </p>
      </div>
    </motion.div>
  );
}
