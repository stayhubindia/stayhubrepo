"use client";

import { Search, MessageCircle, Send, ChevronLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useState, useEffect, useRef, useMemo } from "react";
import { wsService } from "@/services/websocket";
import { useAuthStore } from "@/store/auth-store";
import { useConversations, useMarkAsRead, useMessages } from "@/modules/communication/hooks";
import { getApiErrorMessage } from "@/lib/api-error";
import { ErrorState } from "@/components/ui/query-states";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "@/types/communication";

type LocalPendingMessage = {
  id: string;
  content: string;
  createdAt: string;
  status: "queued" | "sending";
};

const MESSAGE_MAX_LENGTH = 1000;

const getDisplayName = (firstName: string, lastName: string, fallback?: string | null) => {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || fallback || "User";
};

export default function ChatsPage() {
  // All hooks are called before the early return guard, ensuring they execute in the same order
  const { user, isAllowed } = useRequireAuth();
  const { tokens } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendError, setSendError] = useState("");
  const [pendingMessages, setPendingMessages] = useState<LocalPendingMessage[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationsQuery = useConversations(!!user);
  const messagesQuery = useMessages(selectedConversation, !!selectedConversation);
  const markAsReadMutation = useMarkAsRead(selectedConversation ?? "");
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? null;
  const userRole = user?.role ?? "TENANT";
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);
  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);

  const getUnreadCount = (conv: Conversation) =>
    userRole === "TENANT" ? conv.tenant_unread_count : conv.owner_unread_count;

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0),
    [conversations, userRole],
  );

  const markConversationReadOptimistic = (conversationId: string) => {
    queryClient.setQueryData<Conversation[]>(["conversations"], (prev) => {
      if (!prev) return prev;
      return prev.map((conv) => {
        if (conv.id !== conversationId) return conv;
        return userRole === "TENANT"
          ? { ...conv, tenant_unread_count: 0 }
          : { ...conv, owner_unread_count: 0 };
      });
    });
  };

  useEffect(() => {
    if (selectedConversation && tokens?.access) {
      wsService.connect(selectedConversation, tokens.access);

      const cleanup = wsService.onMessage(() => {
        wsService.markAsRead();
        markConversationReadOptimistic(selectedConversation);
        conversationsQuery.refetch();
        messagesQuery.refetch();
      });

      const cleanupRead = wsService.onReadUpdate(() => {
        conversationsQuery.refetch();
        messagesQuery.refetch();
      });

      const cleanupMessageStatus = wsService.onMessageStatus(({ id, status }) => {
        setPendingMessages((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      });

      const cleanupError = wsService.onError(({ detail }) => {
        setSendError(detail);
      });

      const cleanupTyping = wsService.onTyping(({ userId, isTyping }) => {
        if (!currentUserId || userId === currentUserId) return;
        setIsOtherUserTyping(isTyping);
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = null;
        }
        if (isTyping) {
          otherTypingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
            otherTypingTimeoutRef.current = null;
          }, 2500);
        }
      });

      const cleanupReconnect = wsService.onReconnected(() => {
        conversationsQuery.refetch();
        messagesQuery.refetch();
        wsService.markAsRead();
      });

      wsService.markAsRead();
      markConversationReadOptimistic(selectedConversation);

      return () => {
        cleanup();
        cleanupRead();
        cleanupMessageStatus();
        cleanupError();
        cleanupTyping();
        cleanupReconnect();
        setIsOtherUserTyping(false);
        setPendingMessages([]);
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = null;
        }
        wsService.disconnect();
      };
    }
  }, [currentUserId, selectedConversation, tokens?.access]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data, pendingMessages]);

  const filteredConversations = useMemo(() => conversations.filter((conv) => {
    const otherUser = userRole === "TENANT" ? conv.owner : conv.tenant;
    const userName = getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email);
    return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.property.title.toLowerCase().includes(searchQuery.toLowerCase());
  }), [conversations, searchQuery, userRole]);

  useEffect(() => {
    if (!conversations.length || selectedConversation) return;
    setSelectedConversation(conversations[0].id);
  }, [conversations, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;
    const exists = conversations.some((conv) => conv.id === selectedConversation);
    if (!exists) {
      setSelectedConversation(conversations[0]?.id ?? null);
      setShowMobileChat(false);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    setSendError("");
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation || markAsReadMutation.isPending) return;

    const selected = conversations.find((conv) => conv.id === selectedConversation);
    if (!selected) return;

    const unread = getUnreadCount(selected);
    if (unread <= 0) return;

    markConversationReadOptimistic(selectedConversation);
    markAsReadMutation.mutate(undefined, {
      onError: () => {
        conversationsQuery.refetch();
      },
    });
  }, [
    conversations,
    conversationsQuery,
    markAsReadMutation,
    selectedConversation,
    userRole,
  ]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;
    if (message.length > MESSAGE_MAX_LENGTH) {
      setSendError(`Message must be ${MESSAGE_MAX_LENGTH} characters or less.`);
      return;
    }

    const outboundMessage = wsService.sendMessage(message.trim());
    if (outboundMessage) {
      setPendingMessages((prev) => [
        ...prev,
        {
          id: outboundMessage.id,
          content: outboundMessage.content,
          createdAt: outboundMessage.createdAt,
          status: "sending",
        },
      ]);
    }

    setMessage("");
    setSendError("");
    wsService.sendTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!messages.length || !currentUserId) return;

    setPendingMessages((prev) => {
      const next = [...prev];
      messages.forEach((msg) => {
        if (msg.sender.id !== currentUserId) return;
        const pendingIndex = next.findIndex((item) => item.content === msg.content);
        if (pendingIndex >= 0) {
          next.splice(pendingIndex, 1);
        }
      });
      return next;
    });
  }, [currentUserId, messages]);

  if (!isAllowed || !user) return null;

  const selectedConvData = conversations.find((c) => c.id === selectedConversation);
  const otherUser = selectedConvData
    ? (userRole === "TENANT" ? selectedConvData.owner : selectedConvData.tenant)
    : null;

  const remainingChars = MESSAGE_MAX_LENGTH - message.length;

  const handleMessageChange = (value: string) => {
    setMessage(value);
    if (!selectedConversation) return;

    if (!value.trim()) {
      wsService.sendTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    wsService.sendTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fmtConvTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  const avatarGradient = (name: string) => {
    const colors = [
      "from-emerald-400 to-teal-500",
      "from-violet-400 to-purple-500",
      "from-rose-400 to-pink-500",
      "from-amber-400 to-orange-500",
      "from-blue-400 to-indigo-500",
      "from-cyan-400 to-sky-500",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-100">
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0
          bg-white border-r border-slate-200/80
          ${showMobileChat ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Messages</h1>
            <div className="flex items-center gap-2">
              {totalUnread > 0 ? (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  {totalUnread > 99 ? "99+" : totalUnread} unread
                </span>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  All read
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search people or properties…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversationsQuery.isLoading ? (
            <div className="space-y-1 p-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3 animate-pulse">
                  <div className="h-11 w-11 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded-full w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversationsQuery.isError ? (
            <ErrorState message={getApiErrorMessage(conversationsQuery.error)} className="p-4" />
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <MessageCircle className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No conversations yet</p>
              <p className="text-xs text-slate-400">Enquire about a property to start chatting</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredConversations.map((conv) => {
                const other = user.role === "TENANT" ? conv.owner : conv.tenant;
                const unread = getUnreadCount(conv);
                const isActive = selectedConversation === conv.id;
                const name = getDisplayName(other.first_name, other.last_name, other.email);
                const initial = name.charAt(0).toUpperCase();

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => { setSelectedConversation(conv.id); setShowMobileChat(true); }}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition-all ${
                      isActive
                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                        {initial}
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : unread > 0 ? "text-slate-950" : "text-slate-900"}`}>
                            {name}
                          </span>
                          {conv.last_message_at && (
                            <span className={`text-[10px] shrink-0 font-medium ${unread > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                              {fmtConvTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${unread > 0 ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                          {conv.property.title}
                        </p>
                      </div>
                      {/* Unread badge */}
                      {unread > 0 && (
                        <span className="shrink-0 inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── CHAT PANEL ──────────────────────────────────────────────────── */}
      <main
        className={`
          flex-1 flex flex-col min-w-0
          ${showMobileChat ? "flex" : "hidden md:flex"}
          bg-white
        `}
      >
        {selectedConvData && otherUser ? (
          <>
            {/* Chat header */}
            <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(() => {
                const name = getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email);
                return (
                  <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                );
              })()}

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                  {getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email)}
                </h3>
                {isOtherUserTyping ? (
                  <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                    <span className="flex gap-0.5">
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                    typing…
                  </span>
                ) : (
                  <p className="text-xs text-slate-400 truncate leading-tight">{selectedConvData.property.title}</p>
                )}
              </div>
            </header>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-5 space-y-1 scrollbar-hide"
              style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.04), transparent 60%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}
            >
              {sendError && (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {sendError}
                </div>
              )}

              {messagesQuery.isLoading ? (
                <div className="space-y-3 py-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} animate-pulse`}>
                      <div className={`h-10 rounded-2xl bg-slate-200 ${i % 2 === 0 ? "w-52" : "w-44"}`} />
                    </div>
                  ))}
                </div>
              ) : messagesQuery.isError ? (
                <ErrorState message={getApiErrorMessage(messagesQuery.error)} className="p-4" />
              ) : messages.length === 0 && pendingMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <MessageCircle className="h-7 w-7 text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No messages yet</p>
                  <p className="text-xs text-slate-400">Say hello to get started!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isMine = msg.sender.id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                        <div
                          className={`
                            max-w-[78%] md:max-w-[62%] px-4 py-2.5
                            ${isMine
                              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-indigo-500/20"
                              : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm"
                            }
                          `}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`mt-1 flex items-center justify-end gap-1.5 ${isMine ? "text-indigo-200" : "text-slate-400"}`}>
                            <span className="text-[10px]">{fmtTime(msg.created_at)}</span>
                            {isMine && (
                              <span className={`text-[10px] font-semibold ${msg.is_read ? "text-violet-100" : "text-indigo-200"}`}>
                                {msg.is_read ? "Seen" : "Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {pendingMessages.map((pm) => (
                    <div key={pm.id} className="flex justify-end mb-1">
                      <div className="max-w-[78%] md:max-w-[62%] px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl rounded-br-sm shadow-sm opacity-75">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{pm.content}</p>
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-indigo-400">
                          <span className="text-[10px]">{fmtTime(pm.createdAt)}</span>
                          <span className="text-[10px]">{pm.status === "queued" ? "⏱" : "⏳"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <footer className="shrink-0 border-t border-slate-200/80 bg-white/90 backdrop-blur-sm px-4 py-3">
              <div className="flex items-end gap-2.5">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    maxLength={MESSAGE_MAX_LENGTH + 1}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition max-h-32 overflow-y-auto"
                    style={{ lineHeight: "1.5" }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || message.length > MESSAGE_MAX_LENGTH}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-violet-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {remainingChars < 200 && (
                <p className={`mt-1.5 text-right text-[11px] font-medium ${remainingChars < 0 ? "text-red-500" : "text-slate-400"}`}>
                  {remainingChars >= 0 ? `${remainingChars} chars left` : "Too long"}
                </p>
              )}
            </footer>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
              <MessageCircle className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Your messages</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
