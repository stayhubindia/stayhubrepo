/**
 * TypeScript interfaces for the Owner Property Dashboard feature
 * 
 * This file contains type definitions for dashboard tabs, enquiries, bookings,
 * and social sharing functionality used in the owner property detail dashboard.
 */

import type { ComponentType } from 'react';

/**
 * Represents a tab in the dashboard navigation
 */
export interface DashboardTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional count badge (e.g., number of enquiries or bookings) */
  count?: number;
  /** Optional icon component to display alongside the label */
  icon?: ComponentType;
}

/**
 * Represents a property enquiry from a tenant
 */
export interface PropertyEnquiry {
  /** Unique identifier for the enquiry */
  id: string;
  /** Tenant information */
  tenant: {
    /** Tenant's unique identifier */
    id: string;
    /** Tenant's full name */
    name: string;
    /** Optional tenant avatar URL */
    avatar?: string;
  };
  /** Type of contact method used */
  contact_type: 'PHONE' | 'CHAT' | 'WHATSAPP';
  /** Optional message from the tenant */
  message?: string;
  /** Timestamp when the enquiry was created */
  created_at: string;
  /** Current status of the enquiry */
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
}

/**
 * Represents a property booking
 */
export interface PropertyBooking {
  /** Unique identifier for the booking */
  id: string;
  /** Tenant information */
  tenant: {
    /** Tenant's unique identifier */
    id: string;
    /** Tenant's full name */
    name: string;
    /** Optional tenant avatar URL */
    avatar?: string;
  };
  /** Check-in date (ISO 8601 format) */
  check_in: string;
  /** Check-out date (ISO 8601 format) */
  check_out: string;
  /** Current status of the booking */
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  /** Total booking amount (formatted string with currency) */
  total_amount: string;
  /** Timestamp when the booking was created */
  created_at: string;
}

/**
 * Represents a social media sharing platform configuration
 */
export interface SharePlatform {
  /** Platform identifier */
  name: 'whatsapp' | 'facebook' | 'twitter' | 'email';
  /** Icon component for the platform */
  icon: ComponentType;
  /** Brand color for the platform button */
  color: string;
  /** Function to generate the share URL for this platform */
  getShareUrl: (url: string, title: string) => string;
}
