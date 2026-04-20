import { http } from "@/services/http";
import type { PaginatedResponse, PropertyDetail, PropertyListItem, PropertyListQuery } from "@/types/property";

const compactQuery = (query: PropertyListQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.append(key, String(value));
  });
  return params;
};

export const listProperties = async (query: PropertyListQuery): Promise<PaginatedResponse<PropertyListItem>> => {
  const response = await http.get<PaginatedResponse<PropertyListItem>>("/properties/", {
    params: compactQuery(query),
  });
  return response.data;
};

export const getTrendingProperties = async (limit = 6): Promise<PropertyListItem[]> => {
  const response = await http.get<PropertyListItem[]>("/properties/trending/", {
    params: { limit },
  });
  return response.data;
};

export const getPropertyDetail = async (propertyId: string): Promise<PropertyDetail> => {
  const response = await http.get<PropertyDetail>(`/properties/${propertyId}/`);
  return response.data;
};
