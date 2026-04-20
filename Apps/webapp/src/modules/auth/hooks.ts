import { useMutation } from "@tanstack/react-query";

import type { RequestEmailOtpInput, VerifyEmailOtpInput } from "./schemas";
import { requestEmailOtp, verifyEmailOtp, loginWithGoogle, linkFirebaseAccount } from "./api";
import { useAuthStore } from "@/store/auth-store";

export const useRequestEmailOtp = () =>
  useMutation({
    mutationFn: (payload: RequestEmailOtpInput) => requestEmailOtp(payload),
  });

export const useVerifyEmailOtp = () =>
  useMutation({
    mutationFn: (payload: VerifyEmailOtpInput) => verifyEmailOtp(payload),
  });

export const useGoogleLogin = () =>
  useMutation({
    mutationFn: ({ idToken, role }: { idToken: string; role: "TENANT" | "OWNER" }) => loginWithGoogle(idToken, role),
  });

export const useLinkFirebase = () =>
  useMutation({
    mutationFn: (idToken: string) => linkFirebaseAccount(idToken),
    onSuccess: (data) => {
      const authState = useAuthStore.getState();
      if (authState.tokens) {
        // User already has tokens from previous login, just update user data
        authState.setSession(data.user, authState.tokens);
      }
    },
  });
