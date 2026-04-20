import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PropertyListQuery } from "@/types/property";
import { createIdempotentGuard } from "@/lib/idempotent-actions";

import { getPropertyDetail, getTrendingProperties, listProperties } from "./api";

export const useProperties = (query: PropertyListQuery, enabled = true) =>
  useQuery({
    queryKey: ["properties", query],
    queryFn: () => listProperties(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useTrendingProperties = (limit = 6, enabled = true) =>
  useQuery({
    queryKey: ["properties", "trending", limit],
    queryFn: () => getTrendingProperties(limit),
    staleTime: 60_000,
    enabled,
  });

export const usePropertyDetail = (propertyId: string, enabled = true) =>
  useQuery({
    queryKey: ["properties", "detail", propertyId],
    queryFn: () => getPropertyDetail(propertyId),
    enabled: Boolean(propertyId) && enabled,
  });

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  const guard = createIdempotentGuard("createProperty", { timeout: 5000 });
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: result } = await guard.execute(() =>
        import("@/services/http").then((m) => m.http.post("/properties/", data)),
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};
