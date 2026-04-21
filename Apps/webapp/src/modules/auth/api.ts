import { http } from "@/services/http";
import type { AuthResponse, AuthTokens, AppUser } from "@/types/auth";
import type { RequestEmailOtpInput, VerifyEmailOtpInput } from "./schemas";

export const requestEmailOtp = async (payload: RequestEmailOtpInput): Promise<{ detail: string }> => {
  const response = await http.post<{ detail: string }>("/auth/email-otp/request/", payload);
  return response.data;
};

export const verifyEmailOtp = async (payload: VerifyEmailOtpInput): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>("/auth/email-otp/verify/", payload);
  return response.data;
};

export const loginWithGoogle = async (idToken: string, role: "TENANT" | "OWNER"): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>("/auth/firebase/login/", { firebase_token: idToken, role });
  return response.data;
};

export const refreshAuthToken = async (refresh: string): Promise<AuthTokens> => {
  const response = await http.post<AuthTokens>("/auth/token/refresh/", { refresh });
  return response.data;
};

export const linkFirebaseAccount = async (idToken: string): Promise<{ detail: string; user: AppUser }> => {
  const response = await http.post<{ detail: string; user: AppUser }>("/auth/firebase/link/", { firebase_token: idToken });
  return response.data;
};
