import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addFavorite, listFavorites, removeFavorite } from "./api";
import { createIdempotentGuard } from "@/lib/idempotent-actions";

export const useFavorites = (enabled = true) =>
  useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
    enabled,
    retry: 1,
    retryDelay: 2000,
    staleTime: 30_000,
  });

export const useFavoriteMutations = () => {
  const queryClient = useQueryClient();
  const addGuard = createIdempotentGuard("addFavorite", { timeout: 2000 });
  const removeGuard = createIdempotentGuard("removeFavorite", { timeout: 2000 });

  const addMutation = useMutation({
    mutationFn: (propertyId: string) =>
      addGuard.execute(() => addFavorite(propertyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) =>
      removeGuard.execute(() => removeFavorite(propertyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  return { addMutation, removeMutation };
};
