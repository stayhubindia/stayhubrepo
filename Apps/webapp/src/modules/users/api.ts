import { http } from "@/services/http";
import type { AppUser } from "@/types/auth";

export interface UpdateProfilePayload {
  email?: string | null;
  phone?: string | null;
  first_name?: string;
  last_name?: string;
  role?: "OWNER" | "TENANT";
  location_id?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locality?: string;
  lat?: number | null;
  lng?: number | null;
}

export const getMe = async (): Promise<AppUser> => {
  const response = await http.get<AppUser>("/users/me/");
  return response.data;
};

export const updateMe = async (payload: UpdateProfilePayload): Promise<AppUser> => {
  const response = await http.patch<AppUser>("/users/me/", payload);
  return response.data;
};
