import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSavedProperties,
  fetchConversations,
  fetchContactLogs,
  removeSavedProperty,
} from "./api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api-error";

/** Saved/favorited properties for the authenticated user. */
export const useSavedProperties = (enabled = true) =>
  useQuery({
    queryKey: ["bookings", "saved"],
    queryFn: fetchSavedProperties,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

/** All conversations (property interest threads) for the authenticated user. */
export const useBookingConversations = (enabled = true) =>
  useQuery({
    queryKey: ["bookings", "conversations"],
    queryFn: fetchConversations,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

/** Contact log entries for the authenticated user. */
export const useContactLogs = (enabled = true) =>
  useQuery({
    queryKey: ["bookings", "contacts"],
    queryFn: fetchContactLogs,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

/** Remove a saved property from favorites. */
export const useRemoveSaved = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => removeSavedProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from saved properties");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};
