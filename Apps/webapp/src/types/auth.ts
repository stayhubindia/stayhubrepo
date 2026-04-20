export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LocationLite {
  id: string;
  country?: string;
  state?: string;
  city?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  latitude?: string | null;
  longitude?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: "OWNER" | "TENANT" | "ADMIN";
  location: LocationLite | null;
  location_id: string | null;
  is_verified: boolean;
  date_joined: string;
  firebase_uid?: string | null;
}

export interface AuthResponse {
  user: AppUser;
  tokens: AuthTokens;
}
