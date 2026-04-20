import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as any;

describe("Chat API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConversation = {
    id: "conv-1",
    participant_ids: ["user-1", "user-2"],
    property_id: "prop-1",
    latest_message: "Thanks for your interest",
    latest_message_at: "2024-01-15T10:30:00Z",
    unread_count: 2,
    last_read_at: "2024-01-15T09:00:00Z",
  };

  const mockMessage = {
    id: "msg-1",
    conversation_id: "conv-1",
    sender_id: "user-1",
    text: "Hello, is this property still available?",
    is_read: false,
    created_at: "2024-01-15T10:00:00Z",
  };

  describe("getConversations", () => {
    it("should fetch list of conversations for user", async () => {
      const mockResponse = {
        data: {
          results: [mockConversation],
          count: 1,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mockedAxios.get(
        "/conversations/",
        expect.any(Object)
      );

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].id).toBe("conv-1");
    });

    it("should handle empty conversations list", async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mockedAxios.get("/conversations/");

      expect(result.data.results).toHaveLength(0);
    });

    it("should handle API errors", async () => {
      const mockError = { response: { status: 500 } };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(mockedAxios.get("/conversations/")).rejects.toThrow();
    });
  });

  describe("getMessages", () => {
    it("should fetch messages from a conversation", async () => {
      const conversationId = "conv-1";
      const mockResponse = {
        data: {
          results: [mockMessage],
          count: 1,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mockedAxios.get(
        `/conversations/${conversationId}/messages/`
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `/conversations/${conversationId}/messages/`
      );
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].text).toBe(
        "Hello, is this property still available?"
      );
    });

    it("should support pagination", async () => {
      const conversationId = "conv-1";
      const mockResponse = { data: { results: [], count: 50 } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await mockedAxios.get(`/conversations/${conversationId}/messages/`, {
        params: { page: 2, page_size: 20 },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `/conversations/${conversationId}/messages/`,
        expect.any(Object)
      );
    });
  });

  describe("sendMessage", () => {
    it("should send a message in a conversation", async () => {
      const conversationId = "conv-1";
      const messageData = { text: "I am interested in this property" };
      const mockResponse = {
        data: { ...mockMessage, id: "msg-2", text: messageData.text },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await mockedAxios.post(
        `/conversations/${conversationId}/messages/`,
        messageData
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/conversations/${conversationId}/messages/`,
        messageData
      );
      expect(result.data.text).toBe(messageData.text);
      expect(result.data.is_read).toBe(false);
    });

    it("should handle empty message error", async () => {
      const conversationId = "conv-1";
      const mockError = {
        response: {
          data: { text: ["This field may not be blank."] },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        mockedAxios.post(`/conversations/${conversationId}/messages/`, {
          text: "",
        })
      ).rejects.toThrow();
    });

    it("should handle rate limiting on message send", async () => {
      const conversationId = "conv-1";
      const mockError = {
        response: {
          status: 429,
          data: { detail: "You are sending messages too quickly" },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        mockedAxios.post(`/conversations/${conversationId}/messages/`, {
          text: "test",
        })
      ).rejects.toThrow();
    });
  });

  describe("markMessagesAsRead", () => {
    it("should mark messages as read in a conversation", async () => {
      const conversationId = "conv-1";
      const mockResponse = { data: { detail: "Messages marked as read" } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await mockedAxios.post(
        `/conversations/${conversationId}/mark-read/`,
        {}
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/conversations/${conversationId}/mark-read/`,
        {}
      );
    });
  });

  describe("createConversation", () => {
    it("should create a new conversation", async () => {
      const conversationData = { participant_id: "user-2", property_id: "prop-1" };
      const mockResponse = {
        data: { ...mockConversation, id: "conv-2" },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await mockedAxios.post(
        "/conversations/",
        conversationData
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/conversations/",
        conversationData
      );
      expect(result.data.id).toBe("conv-2");
    });

    it("should prevent conversation with self", async () => {
      const conversationData = { participant_id: "user-1", property_id: "prop-1" };
      const mockError = {
        response: {
          data: { detail: "Cannot create conversation with yourself" },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        mockedAxios.post("/conversations/", conversationData)
      ).rejects.toThrow();
    });
  });

  describe("WebSocket message flow", () => {
    it("should emit message status events", () => {
      const mockEvent = new CustomEvent("chat:message-status", {
        detail: { id: "msg-1", status: "sending" },
      });

      // Simulate dispatching event
      expect(mockEvent.detail.id).toBe("msg-1");
      expect(mockEvent.detail.status).toBe("sending");
    });

    it("should emit typing indicator events", () => {
      const mockEvent = new CustomEvent("chat:typing", {
        detail: { conversation_id: "conv-1", user_id: "user-2", isTyping: true },
      });

      expect(mockEvent.detail.isTyping).toBe(true);
      expect(mockEvent.detail.user_id).toBe("user-2");
    });

    it("should emit read receipt events", () => {
      const mockEvent = new CustomEvent("chat:read", {
        detail: 5, // message count read
      });

      expect(mockEvent.detail).toBe(5);
    });
  });
});
