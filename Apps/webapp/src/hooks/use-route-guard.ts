"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";
import type { AppUser } from "@/types/auth";

interface RequireAuthOptions {
  roles?: AppUser["role"][];
  redirectTo?: string;
  unauthorizedTo?: string;
}

export const useRequireAuth = (options?: RequireAuthOptions) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const roles = options?.roles;

  useEffect(() => {
    if (!user) {
      router.replace(options?.redirectTo ?? "/auth");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(options?.unauthorizedTo ?? "/dashboard");
    }
  }, [options?.redirectTo, options?.unauthorizedTo, roles, router, user]);

  const hasRoleAccess = !roles || (user ? roles.includes(user.role) : false);
  const isAllowed = Boolean(user) && hasRoleAccess;
  return { user, isAllowed };
};

export const usePublicOnlyRoute = (redirectTo = "/dashboard") => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, user]);

  return { user };
};
