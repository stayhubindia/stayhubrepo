"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { LoadingState } from "@/components/ui/query-states";

/**
 * /dashboard — redirects based on user role:
 * - OWNER → /my-ads
 * - TENANT → /properties
 * - Unauthenticated → /auth
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role === "OWNER") {
      router.replace("/my-ads");
    } else {
      router.replace("/properties");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState message="Redirecting..." />
    </div>
  );
}
