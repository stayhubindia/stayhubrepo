export interface FavoriteItem {
  id: string;
  property_id: string;
  property_title: string;
  property_city: string;
  property_rent: string;
  created_at: string;
}

export interface SavedSearchItem {
  id: string;
  title?: string;
  status?: string;
  location?: string | null;
  location_city?: string;
  location_state?: string;
  property_type?: string;
  furnishing?: string;
  min_rent?: string;
  max_rent?: string;
  config?: string;
  alerts_on: boolean;
  results_count?: number;
  image?: string;
  bedrooms?: number;
  price_min?: number;
  price_max?: number;
  name?: string;
  created_at: string;
  updated_at: string;
}
