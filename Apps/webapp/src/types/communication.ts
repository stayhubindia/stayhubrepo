import type { AppUser } from "@/types/auth";

export interface ConversationProperty {
  id: string;
  title: string;
}

export interface Conversation {
  id: string;
  property: ConversationProperty;
  tenant: AppUser;
  owner: AppUser;
  status: "ACTIVE" | "ARCHIVED";
  message_count: number;
  owner_unread_count: number;
  tenant_unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: AppUser;
  message_type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  image: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ConversationCreatePayload {
  property_id: string;
}

export interface MessageSendPayload {
  content?: string;
  image?: File;
}
