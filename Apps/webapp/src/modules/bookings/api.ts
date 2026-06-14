import { http } from "@/services/http";
import type { SavedProperty, BookingConversation, ContactLogEntry } from "./types";

/**
 * Fetch the authenticated user's saved/favorited properties.
 * Endpoint: GET /favorites/
 */
export const fetchSavedProperties = async (): Promise<SavedProperty[]> => {
  const { data } = await http.get<SavedProperty[]>("/favorites/");
  return Array.isArray(data) ? data : (data as { results?: SavedProperty[] }).results ?? [];
};

/**
 * Fetch the authenticated user's conversations (tenant or owner).
 * Endpoint: GET /communication/conversations/
 */
export const fetchConversations = async (): Promise<BookingConversation[]> => {
  const { data } = await http.get<BookingConversation[]>("/communication/conversations/");
  return Array.isArray(data) ? data : (data as { results?: BookingConversation[] }).results ?? [];
};

/**
 * Remove a favorite by property id.
 * Endpoint: DELETE /favorites/{propertyId}/
 */
export const removeSavedProperty = async (propertyId: string): Promise<void> => {
  await http.delete(`/favorites/${propertyId}/`);
};

/**
 * Fetch the authenticated user's contact log entries (tenant-side).
 * Note: /contacts/leads/ returns owner leads. For tenant history we
 * rely on conversations since there's no dedicated tenant contact list endpoint.
 * This is a safe fallback — returns empty array if endpoint 404s.
 */
export const fetchContactLogs = async (): Promise<ContactLogEntry[]> => {
  try {
    const { data } = await http.get<ContactLogEntry[]>("/contacts/leads/");
    return Array.isArray(data) ? data : (data as { results?: ContactLogEntry[] }).results ?? [];
  } catch {
    return [];
  }
};
