import { API_BASE_URL } from "@/config/env";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { Message } from "@/types/communication";
import toast from "react-hot-toast";

// Schema for all incoming WebSocket messages — drops malformed data (TASK-10)
const MessageDataSchema = z.object({
  type: z.string(),
  message: z.any().optional(),
  updated: z.number().optional(),
  detail: z.string().max(500).optional(),
  code: z.string().optional(),
  user_id: z.string().optional(),
  is_typing: z.boolean().optional(),
});
type MessageData = z.infer<typeof MessageDataSchema>;

interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

interface OutboundMessage {
  id: string;
  content: string;
  createdAt: string;
}

interface MessageStatusEvent {
  id: string;
  status: "queued" | "sending";
}

interface ChatErrorEvent {
  detail: string;
  code?: string;
}

// Build WS URL without token in query string — token is sent in first message (TASK-18)
const buildWebSocketUrl = (conversationId: string) => {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/api(?:\/v1)?\/?$/, "")}/ws/communication/conversations/${conversationId}/`;
  url.search = "";
  return url.toString();
};

class WebSocketService {
  private socket: WebSocket | null = null;
  private conversationId: string | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxReconnectAttempts = 5;
  private intentionallyDisconnected = false;
  private outboundQueue: OutboundMessage[] = [];

  connect(conversationId: string, token: string) {
    if (
      this.socket &&
      this.conversationId === conversationId &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.disconnect();
    this.intentionallyDisconnected = false;
    this.conversationId = conversationId;
    this.token = token;
    this.reconnectAttempts = 0;

    this.createSocket(conversationId, token);
  }

  private createSocket(conversationId: string, token: string) {
    this.clearReconnectTimer();

    const ws = new WebSocket(buildWebSocketUrl(conversationId));

    ws.onopen = () => {
      // Send auth token as first message instead of URL query param (TASK-18)
      ws.send(JSON.stringify({ action: "authenticate", token }));
      const recoveredConnection = this.reconnectAttempts > 0;
      this.reconnectAttempts = 0;
      toast.success("Connected to chat");
      this.flushOutboundQueue();
      if (recoveredConnection) {
        window.dispatchEvent(new Event("chat:reconnected"));
      }
    };

    ws.onclose = () => {
      const shouldReconnect = !this.intentionallyDisconnected && this.conversationId === conversationId;

      if (shouldReconnect) {
        this.scheduleReconnect();
      } else if (this.conversationId === conversationId) {
        this.socket = null;
        this.conversationId = null;
        this.token = null;
      }
    };

    ws.onerror = (error) => {
      // Use project logger instead of raw console.error (TASK-19)
      logger.error("WebSocket error", { detail: String(error) });
      toast.error("Connection error");
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string);
        // Validate against schema before processing — drops malformed messages (TASK-10)
        const result = MessageDataSchema.safeParse(raw);
        if (!result.success) {
          logger.warn("Dropped malformed WebSocket message", { error: result.error.message });
          return;
        }
        this.handleMessage(result.data);
      } catch (error) {
        // Use project logger instead of raw console.error (TASK-19)
        logger.error("Failed to parse WebSocket message", { detail: String(error) });
      }
    };

    this.socket = ws;
  }

  private scheduleReconnect() {
    if (!this.conversationId || !this.token) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error("Disconnected from chat. Please refresh or reopen conversation.");
      return;
    }

    const delayMs = Math.min(1000 * 2 ** this.reconnectAttempts, 8000);
    this.reconnectAttempts += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (!this.conversationId || !this.token || this.intentionallyDisconnected) return;
      this.createSocket(this.conversationId, this.token);
    }, delayMs);
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private handleMessage(data: MessageData) {
    if (data.type === "message.created" && data.message) {
      toast.success(`New message: ${data.message?.content?.substring(0, 50)}...`, {
        duration: 3000,
        icon: "💬",
      });
      window.dispatchEvent(new CustomEvent<Message>("chat:message", { detail: data.message }));
    } else if (data.type === "read.updated") {
      window.dispatchEvent(new CustomEvent<number>("chat:read", { detail: data.updated ?? 0 }));
    } else if (data.type === "typing.updated" && data.user_id) {
      window.dispatchEvent(
        new CustomEvent<TypingEvent>("chat:typing", {
          detail: {
            userId: data.user_id,
            isTyping: Boolean(data.is_typing),
          },
        }),
      );
    } else if (data.type === "error") {
      toast.error(data.detail || "An error occurred");
      window.dispatchEvent(
        new CustomEvent<ChatErrorEvent>("chat:error", {
          detail: {
            detail: data.detail || "An error occurred",
            code: data.code,
          },
        }),
      );
    }
  }

  private flushOutboundQueue() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.outboundQueue.length === 0) {
      return;
    }

    const queuedItems = [...this.outboundQueue];
    this.outboundQueue = [];

    queuedItems.forEach((item) => {
      this.emitSendMessage(item);
    });
  }

  private emitSendMessage(message: OutboundMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.outboundQueue.push(message);
      this.emitMessageStatus(message.id, "queued");
      return;
    }

    this.socket.send(
      JSON.stringify({
        action: "send_message",
        content: message.content,
      }),
    );
    this.emitMessageStatus(message.id, "sending");
  }

  private emitMessageStatus(id: string, status: "queued" | "sending") {
    window.dispatchEvent(new CustomEvent<MessageStatusEvent>("chat:message-status", { detail: { id, status } }));
  }

  disconnect() {
    this.intentionallyDisconnected = true;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.conversationId = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.outboundQueue = [];
  }

  sendMessage(content: string) {
    const outboundMessage: OutboundMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content,
      createdAt: new Date().toISOString(),
    };

    this.emitSendMessage(outboundMessage);
    return outboundMessage;
  }

  markAsRead() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.socket.send(JSON.stringify({
      action: "mark_read",
    }));
  }

  sendTyping(isTyping: boolean) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ action: "typing", is_typing: isTyping }));
  }

  onMessage(callback: (data: Message) => void) {
    const handler = (event: Event) => callback((event as CustomEvent<Message>).detail);
    window.addEventListener("chat:message", handler);
    return () => window.removeEventListener("chat:message", handler);
  }

  onReadUpdate(callback: (count: number) => void) {
    const handler = (event: Event) => callback((event as CustomEvent<number>).detail);
    window.addEventListener("chat:read", handler);
    return () => window.removeEventListener("chat:read", handler);
  }

  onTyping(callback: (event: TypingEvent) => void) {
    const handler = (event: Event) => callback((event as CustomEvent<TypingEvent>).detail);
    window.addEventListener("chat:typing", handler);
    return () => window.removeEventListener("chat:typing", handler);
  }

  onReconnected(callback: () => void) {
    const handler = () => callback();
    window.addEventListener("chat:reconnected", handler);
    return () => window.removeEventListener("chat:reconnected", handler);
  }

  onMessageStatus(callback: (event: MessageStatusEvent) => void) {
    const handler = (event: Event) => callback((event as CustomEvent<MessageStatusEvent>).detail);
    window.addEventListener("chat:message-status", handler);
    return () => window.removeEventListener("chat:message-status", handler);
  }

  onError(callback: (event: ChatErrorEvent) => void) {
    const handler = (event: Event) => callback((event as CustomEvent<ChatErrorEvent>).detail);
    window.addEventListener("chat:error", handler);
    return () => window.removeEventListener("chat:error", handler);
  }
}

export const wsService = new WebSocketService();
