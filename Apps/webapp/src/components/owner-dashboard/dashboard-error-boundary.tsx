"use client";

import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DashboardErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

/**
 * DashboardErrorFallback Component
 *
 * Displayed when the dashboard encounters an unrecoverable error.
 * Provides Retry and Go to My Ads escape hatches.
 */
export function DashboardErrorFallback({
  error,
  resetErrorBoundary,
}: DashboardErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        {error?.message || "An unexpected error occurred while loading the dashboard."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}

        <Link
          href="/my-ads"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to My Ads
        </Link>
      </div>
    </div>
  );
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * DashboardErrorBoundary
 *
 * React error boundary that wraps the dashboard and catches
 * any unhandled errors, displaying a user-friendly fallback.
 */
export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  DashboardErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DashboardErrorFallback
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}
