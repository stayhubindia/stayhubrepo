export interface OwnerDashboardSnapshot {
  id: string;
  owner: string;
  date: string;
  total_views: number;
  total_favorites: number;
  total_contacts: number;
  created_at: string;
}

export interface PropertyDailyAggregate {
  id: string;
  property: string;
  date: string;
  views: number;
  favorites: number;
  contacts: number;
  created_at: string;
}

export interface LocationHeatmap {
  id: string;
  location: {
    id: string;
    city: string;
    state: string;
    country: string;
    locality: string;
    pincode: string;
    latitude: string | null;
    longitude: string | null;
  };
  date: string;
  views: number;
  favorites: number;
  contacts: number;
  created_at: string;
}
