import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { createIdempotentGuard } from "@/lib/idempotent-actions";

import { getMe, updateMe, type UpdateProfilePayload } from "./api";

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: ["users", "me"],
    queryFn: getMe,
    enabled,
  });

export const useUpdateMe = () => {
  const guard = createIdempotentGuard("updateProfile", { timeout: 2000 });
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => guard.execute(() => updateMe(payload)),
    onSuccess: (updatedUser) => {
      const authState = useAuthStore.getState();
      if (authState.tokens) {
        authState.setSession(updatedUser, authState.tokens);
      } else {
        useAuthStore.setState({ user: updatedUser });
      }
    },
  });
};
