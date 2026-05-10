import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/services/http";
import { createIdempotentGuard } from "@/lib/idempotent-actions";

export interface Property {
  id: string;
  owner: string;
  title: string;
  description: string;
  property_type: string;
  furnishing: string;
  rent: string;
  deposit?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  status: string;
  total_views: number;
  total_favorites: number;
  total_contacts: number;
  location?: {
    city: string;
    locality?: string;
    address?: string;
  };
  images?: Array<{ id: string; image: string; is_primary: boolean }>;
  amenities?: Array<{ id: string; name: string }>;
  created_at: string;
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  property_type: string;
  furnishing: string;
  rent: number;
  deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locality?: string;
  lat?: number | null;
  lng?: number | null;
  preferred_tenant?: string;
  amenity_ids?: number[];
}

export function useMyProperties(enabled = true) {
  return useQuery<Property[]>({
    queryKey: ["properties", "mine"],
    queryFn: async () => {
      const response = await http.get("/properties/?mine=true");
      return response.data.results || response.data;
    },
    enabled,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const guard = createIdempotentGuard("createProperty", { timeout: 3000 });

  return useMutation({
    mutationFn: async (data: CreatePropertyInput) => {
      return guard.execute(async () => {
        const response = await http.post("/properties/", data);
        return response.data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePropertyInput> }) => {
      const response = await http.patch(`/properties/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useSubmitProperty() {
  const queryClient = useQueryClient();
  const guard = createIdempotentGuard("submitProperty", { timeout: 3000 });

  return useMutation({
    mutationFn: async (id: string) => {
      return guard.execute(async () => {
        const response = await http.post(`/properties/${id}/submit/`);
        return response.data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useMarkRented() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await http.post(`/properties/${id}/mark-rented/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
