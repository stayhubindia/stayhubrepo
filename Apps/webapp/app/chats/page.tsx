"use client";

import { 
  Search as SearchIcon, MessageCircle, Send, ChevronLeft, 
  MoreVertical, Paperclip, Smile, Edit3, ExternalLink, MapPin, Archive,
  Building2, Heart, Menu, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useState, useEffect, useRef, useMemo } from "react";
import { wsService } from "@/services/websocket";
import { useAuthStore } from "@/store/auth-store";
import { useConversations, useMarkAsRead, useMessages, useArchiveConversation } from "@/modules/communication/hooks";
import { getApiErrorMessage } from "@/lib/api-error";
import toast from "react-hot-toast";
import { ErrorState } from "@/components/ui/query-states";
import { useQueryClient } from "@tanstack/react-query";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
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
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "bookings">("all");
  const [sendError, setSendError] = useState("");
  const [pendingMessages, setPendingMessages] = useState<LocalPendingMessage[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationsQuery = useConversations(!!user);
  const messagesQuery = useMessages(selectedConversation, !!selectedConversation);
  const markAsReadMutation = useMarkAsRead(selectedConversation ?? "");
  const archiveMutation = useArchiveConversation();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? null;
  const userRole = user?.role ?? "TENANT";
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);
  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const otherUser = userRole === "TENANT" ? conv.owner : conv.tenant;
      const userName = getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email);
      const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            conv.property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === "unread") {
        return getUnreadCount(conv) > 0;
      }
      
      return true;
    });
  }, [conversations, searchQuery, userRole, activeFilter]);

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

    if (!typingTimeoutRef.current) {
      wsService.sendTyping(true);
    } else {
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
    <div className="flex min-h-screen bg-slate-50 w-full">
      <DesktopSidebar />

      {/* ── Right: topbar + chat ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Topbar ── */}
        <header className="h-[72px] border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 bg-white shrink-0">
          {/* Mobile menu + logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Desktop search */}
          <div className="hidden lg:block flex-1 max-w-2xl relative mr-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Search by location, property or category"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘K</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link href="/favorites" className="hidden sm:flex flex-col items-center gap-1.5 group">
              <Heart className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">Wishlist</span>
            </Link>
            <Link href="/chats" className="hidden sm:flex flex-col items-center gap-1.5 group relative">
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">Messages</span>
            </Link>
            <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
            <ProfileDropdown />
          </div>
        </header>

      {/* ── Main Chat Layout ── */}
      <div className="flex-1 flex overflow-hidden">
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0
          bg-white border-r border-slate-200
          ${showMobileChat ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-black text-slate-900">Messages</h1>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative mb-5">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === "all" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter("unread")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${activeFilter === "unread" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            >
              Unread {totalUnread > 0 && <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${activeFilter === "unread" ? "bg-white text-emerald-600" : "bg-emerald-500 text-white"}`}>{totalUnread}</span>}
            </button>
            <button 
              onClick={() => setActiveFilter("bookings")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === "bookings" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            >
              Bookings
            </button>
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
                  <div key={conv.id} className="relative group/row">
                    <button
                      type="button"
                      onClick={() => { setSelectedConversation(conv.id); setShowMobileChat(true); }}
                      className={`w-full px-5 py-4 text-left transition-all relative border-b border-slate-100/50 ${
                        isActive
                          ? "bg-emerald-50/50 border-l-4 border-l-emerald-500"
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-base font-bold shadow-sm`}>
                            {initial}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[15px] font-extrabold truncate ${isActive ? "text-emerald-900" : "text-slate-900"}`}>
                              {name}
                            </span>
                            {conv.last_message_at && (
                              <span className="text-[11px] font-bold text-slate-400 tracking-tight">
                                {fmtConvTime(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className={`text-[11px] font-bold truncate uppercase tracking-wider ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                              {conv.property.title}
                            </p>
                            {conv.status === "ARCHIVED" && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                Archived
                              </span>
                            )}
                          </div>
                          <p className={`text-[13px] truncate leading-snug ${unread > 0 ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}>
                            {unread > 0 ? "New message received..." : "Click to view conversation"}
                          </p>
                        </div>

                        {unread > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm shadow-emerald-500/20">
                            {unread}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* ⋮ context menu trigger — appears on row hover */}
                    <button
                      type="button"
                      aria-label="Conversation options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity z-10"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown menu */}
                    {openMenuId === conv.id && (
                      <>
                        {/* Backdrop to close menu on outside click */}
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-2 top-10 z-30 min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-1 overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveMutation.mutate(conv.id, {
                                onSuccess: () => {
                                  toast.success("Conversation archived");
                                  setOpenMenuId(null);
                                },
                                onError: (err) => {
                                  toast.error(getApiErrorMessage(err));
                                  setOpenMenuId(null);
                                },
                              });
                            }}
                            disabled={archiveMutation.isPending}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Archive className="w-4 h-4 text-slate-400" />
                            Archive
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-slate-600 hover:text-emerald-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const name = getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email);
                  return (
                    <div className="relative">
                      <div className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                  );
                })()}

                <div className="min-w-0">
                  <h3 className="text-[17px] font-extrabold text-slate-900 truncate flex items-center gap-2">
                    {getDisplayName(otherUser.first_name, otherUser.last_name, otherUser.email)}
                    {!isOtherUserTyping && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </h3>
                  {isOtherUserTyping ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <span className="flex gap-0.5">
                        {[0,1,2].map(i => (
                          <span
                            key={i}
                            className="inline-block h-1 w-1 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                      typing...
                    </span>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                      {userRole === "TENANT" ? "Host" : "Tenant"} • {selectedConvData.property.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Property Card in Header */}
              <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-100 p-2 rounded-2xl max-w-sm">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=100&q=80" alt="Property" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate">{selectedConvData.property.title}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Sector 62, Noida</span>
                    <span className="text-[11px] font-bold text-emerald-600">₹28,000 / month</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
                  View Property
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-900">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex lg:hidden items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-900">
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-900">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-6 py-8 space-y-3 scrollbar-hide"
              style={{ background: "radial-gradient(ellipse at top, rgba(16,185,129,0.04), transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)" }}
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
                            max-w-[78%] md:max-w-[65%] px-5 py-3 relative group
                            ${isMine
                              ? "bg-emerald-50 text-slate-800 border border-emerald-100 rounded-[20px] rounded-tr-none shadow-sm"
                              : "bg-white text-slate-800 border border-slate-100 rounded-[20px] rounded-tl-none shadow-sm"
                            }
                          `}
                        >
                          <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words font-medium">{msg.content}</p>
                          <div className={`mt-1.5 flex items-center justify-end gap-1.5 ${isMine ? "text-emerald-600/60" : "text-slate-400"}`}>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{fmtTime(msg.created_at)}</span>
                            {isMine && (
                              <span className={`text-[10px] ${msg.is_read ? "text-emerald-500" : "text-emerald-400"}`}>
                                {msg.is_read ? "✓✓" : "✓"}
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
            <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-emerald-500/50 focus-within:bg-white transition-all">
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  maxLength={MESSAGE_MAX_LENGTH + 1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[14.5px] text-slate-900 placeholder:text-slate-400 py-2.5 resize-none max-h-32 scrollbar-hide"
                  style={{ lineHeight: "1.5" }}
                />

                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || message.length > MESSAGE_MAX_LENGTH}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Send className="h-4 h-4 fill-white" />
                  </button>
                </div>
              </div>
              
              {remainingChars < 200 && (
                <p className={`mt-2 text-right text-[10px] font-bold ${remainingChars < 0 ? "text-rose-500" : "text-slate-400"}`}>
                  {remainingChars >= 0 ? `${remainingChars} characters remaining` : "Message too long"}
                </p>
              )}
            </footer>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.06),_transparent_55%),linear-gradient(180deg,_#FFFFFF_0%,_#F8FAFC_100%)]">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
              <MessageCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Select a Conversation</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs font-medium">
              Choose a message from the list on the left to view your conversation and property details.
            </p>
          </div>
        )}
      </main>
      </div>
      </div>
    </div>
  );
}
