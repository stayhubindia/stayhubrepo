export type ContactType = "PHONE" | "CHAT" | "WHATSAPP";

export interface ContactLead {
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
