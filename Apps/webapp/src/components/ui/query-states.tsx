import { Loader2, AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({ message = "Loading...", className = "py-8" }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  className?: string;
};

export function ErrorState({ message, className = "p-4" }: ErrorStateProps) {
  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 ${className}`}>
      <p className="inline-flex items-center gap-2 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        {message}
      </p>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = "py-10" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Inbox className="h-12 w-12 text-gray-300" />
      <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
