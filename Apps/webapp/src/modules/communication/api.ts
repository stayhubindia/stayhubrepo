import { http } from "@/services/http";
import type {
  Conversation,
  ConversationCreatePayload,
  Message,
  MessageSendPayload,
} from "@/types/communication";

export const conversationApi = {
  list: async () => {
    const { data } = await http.get<Conversation[]>("/communication/conversations/");
    return data;
  },

  create: async (payload: ConversationCreatePayload) => {
    const { data } = await http.post<Conversation>("/communication/conversations/", payload);
    return data;
  },

  getMessages: async (conversationId: string) => {
    const { data } = await http.get<Message[]>(`/communication/conversations/${conversationId}/messages/`);
    return data;
  },

  sendMessage: async (conversationId: string, payload: MessageSendPayload) => {
    const formData = new FormData();
    if (payload.content) formData.append("content", payload.content);
    if (payload.image) formData.append("image", payload.image);

    const { data } = await http.post<Message>(
      `/communication/conversations/${conversationId}/messages/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  markRead: async (conversationId: string) => {
    await http.post(`/communication/conversations/${conversationId}/read/`);
  },

  archive: async (conversationId: string) => {
    await http.post(`/communication/conversations/${conversationId}/archive/`);
  },
};
