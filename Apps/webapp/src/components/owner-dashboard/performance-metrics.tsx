"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, MessageSquare, TrendingUp, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePropertyAnalytics } from "@/modules/owner-dashboard/hooks";
import type { PropertyAnalytics } from "@/types/analytics";

// Lazy load trend chart
const TrendChart = dynamic(
  () => import("@/components/charts/trend-chart").then((m) => ({ default: m.TrendChart })),
  { loading: () => <div className="h-10 w-28 animate-pulse rounded bg-slate-100" /> }
);

interface PerformanceMetricsProps {
  propertyId: string;
}

type Period = PropertyAnalytics["period"];

const PERIODS: { label: string; value: Period }[] = [
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
  { label: "All time", value: "all_time" },
];

/**
 * PerformanceMetrics Component
 *
 * Displays property performance metrics (views, enquiries, bookings)
 * with trend sparkline charts and a time period selector.
 */
export function PerformanceMetrics({ propertyId }: PerformanceMetricsProps) {
  const [period, setPeriod] = useState<Period>("last_30_days");

  const { data: analytics, isLoading, isError, error } = usePropertyAnalytics(
    propertyId,
    period,
    Boolean(propertyId)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Performance Overview</h3>
        </div>
      </div>

      {/* Period Selector */}
      <div className="border-b border-slate-100 px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                period === p.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="divide-y divide-slate-100 px-5">
        {isLoading && (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-6 w-12 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-10 w-28 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Failed to load analytics</span>
          </div>
        )}

        {analytics && !isLoading && (
          <>
            {/* Views */}
            <MetricRow
              icon={<Eye className="h-4 w-4 text-blue-600" />}
              iconBg="bg-blue-50"
              label="Views"
              total={analytics.views.total}
              trend={analytics.views.trend}
            />

            {/* Enquiries */}
            <MetricRow
              icon={<MessageSquare className="h-4 w-4 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="Enquiries"
              total={analytics.enquiries.total}
              trend={analytics.enquiries.trend}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3">
        <Link
          href="/analytics"
          className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          View full analytics
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  total: number;
  trend: { date: string; value: number }[];
}

function MetricRow({ icon, iconBg, label, total, trend }: MetricRowProps) {
  const isPositive = trend.length >= 2
    ? trend[trend.length - 1].value >= trend[0].value
    : true;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-4"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-black text-slate-900">{total.toLocaleString()}</p>
        </div>
      </div>
      <TrendChart
        data={trend}
        isPositive={isPositive}
        width={100}
        height={36}
        ariaLabel={`${label} trend chart`}
      />
    </motion.div>
  );
}
