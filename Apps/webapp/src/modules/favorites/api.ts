import { http } from "@/services/http";
import type { FavoriteItem } from "@/types/favorite";

export const listFavorites = async (): Promise<FavoriteItem[]> => {
  const response = await http.get<FavoriteItem[]>("/favorites/");
  return response.data;
};

export const addFavorite = async (propertyId: string): Promise<FavoriteItem> => {
  const response = await http.post<FavoriteItem>("/favorites/", { property_id: propertyId });
  return response.data;
};

export const removeFavorite = async (propertyId: string): Promise<void> => {
  await http.delete(`/favorites/${propertyId}/`);
};
