import { http } from "@/services/http";
import type { ContactLead, ContactType } from "@/types/contact";

export interface ContactCreatePayload {
  property_id: string;
  contact_type: ContactType;
  message?: string;
}

export const createContactLead = async (payload: ContactCreatePayload) => {
  const response = await http.post<ContactLead>("/contacts/", payload);
  return response.data;
};

export const listOwnerLeads = async (): Promise<ContactLead[]> => {
  const response = await http.get<ContactLead[]>("/contacts/leads/");
  return response.data;
};
