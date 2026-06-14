export interface PropertyListItem {
  id: string;
  title: string;
  property_type: "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
  furnishing: "FURNISHED" | "SEMI" | "UNFURNISHED";
  rent: string;
  country: string | null;
  state: string | null;
  city: string | null;
  locality: string | null;
  pincode: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "RENTED" | "EXPIRED" | "REJECTED";
  is_featured: boolean;
  total_views: number;
  total_favorites: number;
  total_contacts: number;
  available_from: string | null;
  images?: PropertyImage[];
  created_at: string;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  icon: string;
}

export interface PropertyImage {
  id: string;
  image: string;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface PropertyLocation {
  id: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  pincode: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
}

export interface PropertyDetail {
  id: string;
  owner: string;
  title: string;
  description: string;
  property_type: "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
  furnishing: "FURNISHED" | "SEMI" | "UNFURNISHED";
  rent: string;
  deposit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  total_favorites: number;
  available_from: string | null;
  location: PropertyLocation | null;
  preferred_tenant: "MALE" | "FEMALE" | "ANY";
  total_views: number;
  total_contacts: number;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "RENTED" | "EXPIRED" | "REJECTED";
  is_featured: boolean;
  featured_until: string | null;
  amenities: PropertyAmenity[];
  images: PropertyImage[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PropertyListQuery {
  page?: number;
  q?: string;
  city?: string;
  state?: string;
  locality?: string;
  property_type?: string;
  furnishing?: string;
  preferred_tenant?: string;
  min_rent?: number;
  max_rent?: number;
  mine?: boolean;
  ordering?: string;
}
