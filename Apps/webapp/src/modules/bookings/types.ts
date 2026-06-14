/**
 * Types for the "My Bookings" page.
 * All fields are derived from real backend serializers — no invented fields.
 */

// ── Favorites (GET /favorites/) ─────────────────────────────────────────────
export interface SavedProperty {
  id: string;
  property_id: string;
  property_title: string;
  property_city: string | null;
  property_rent: string;
  created_at: string;
}

// ── Conversations (GET /communication/conversations/) ────────────────────────
export interface ConversationPropertyRef {
  id: string;
  title: string;
}

export interface ConversationUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

export interface BookingConversation {
  id: string;
  property: ConversationPropertyRef;
  tenant: ConversationUser;
  owner: ConversationUser;
  status: "ACTIVE" | "ARCHIVED";
  message_count: number;
  owner_unread_count: number;
  tenant_unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Contact Logs (GET /contacts/leads/) ─────────────────────────────────────
export type ContactType = "PHONE" | "CHAT" | "WHATSAPP";

export interface ContactLogEntry {
  id: string;
  property: string;
  property_title: string;
  tenant: string;
  tenant_name: string;
  contact_type: ContactType;
  message: string | null;
  ip_address: string | null;
  created_at: string;
}

// ── Tab identifier ───────────────────────────────────────────────────────────
export type BookingTab = "saved" | "discussions" | "contacts";
