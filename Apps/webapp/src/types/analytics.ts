/**
 * TypeScript interfaces for analytics and performance metrics
 * 
 * This file contains type definitions for property analytics, dashboard snapshots,
 * daily aggregates, and location-based heatmap data used throughout the application.
 */

/**
 * Represents a snapshot of the owner's dashboard metrics for a specific date
 */
export interface OwnerDashboardSnapshot {
  /** Unique identifier for the snapshot */
  id: string;
  /** Owner's unique identifier */
  owner: string;
  /** Date of the snapshot (ISO 8601 format) */
  date: string;
  /** Total number of property views */
  total_views: number;
  /** Total number of favorites/saves */
  total_favorites: number;
  /** Total number of contact enquiries */
  total_contacts: number;
  /** Timestamp when the snapshot was created */
  created_at: string;
}

/**
 * Represents daily aggregated metrics for a specific property
 */
export interface PropertyDailyAggregate {
  /** Unique identifier for the aggregate record */
  id: string;
  /** Property's unique identifier */
  property: string;
  /** Date of the aggregate (ISO 8601 format) */
  date: string;
  /** Number of views for this day */
  views: number;
  /** Number of favorites for this day */
  favorites: number;
  /** Number of contacts for this day */
  contacts: number;
  /** Timestamp when the record was created */
  created_at: string;
}

/**
 * Represents location-based analytics data for heatmap visualization
 */
export interface LocationHeatmap {
  /** Unique identifier for the heatmap record */
  id: string;
  /** Location details */
  location: {
    /** Location's unique identifier */
    id: string;
    /** City name */
    city: string;
    /** State/province name */
    state: string;
    /** Country name */
    country: string;
    /** Locality/neighborhood name */
    locality: string;
    /** Postal/PIN code */
    pincode: string;
    /** Latitude coordinate (null if not available) */
    latitude: string | null;
    /** Longitude coordinate (null if not available) */
    longitude: string | null;
  };
  /** Date of the heatmap data (ISO 8601 format) */
  date: string;
  /** Number of views from this location */
  views: number;
  /** Number of favorites from this location */
  favorites: number;
  /** Number of contacts from this location */
  contacts: number;
  /** Timestamp when the record was created */
  created_at: string;
}

/**
 * Represents comprehensive analytics data for a property over a specific time period
 */
export interface PropertyAnalytics {
  /** Property's unique identifier */
  property_id: string;
  /** Time period for the analytics data */
  period: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
  /** Views metrics with total count and trend data */
  views: {
    /** Total number of views in the period */
    total: number;
    /** Array of daily trend data points */
    trend: TrendData[];
  };
  /** Enquiries metrics with total count and trend data */
  enquiries: {
    /** Total number of enquiries in the period */
    total: number;
    /** Array of daily trend data points */
    trend: TrendData[];
  };
  /** Bookings metrics with total count and trend data */
  bookings: {
    /** Total number of bookings in the period */
    total: number;
    /** Array of daily trend data points */
    trend: TrendData[];
  };
  /** Timestamp when the analytics data was last updated */
  updated_at: string;
}

/**
 * Represents a single data point in a trend chart
 */
export interface TrendData {
  /** Date of the data point (ISO 8601 format) */
  date: string;
  /** Numeric value for this date */
  value: number;
}
