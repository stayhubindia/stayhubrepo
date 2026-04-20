import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api-error";
import type { MessageSendPayload } from "@/types/communication";
import toast from "react-hot-toast";

import { conversationApi } from "./api";

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: conversationApi.list,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => conversationApi.create({ property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMessages(conversationId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => conversationApi.getMessages(conversationId as string),
    enabled: enabled && !!conversationId,
    staleTime: 15_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MessageSendPayload) => conversationApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => conversationApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationApi.archive(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
