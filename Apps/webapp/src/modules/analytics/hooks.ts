import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./api";

export const useOwnerDashboard = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["analytics", "dashboard", startDate, endDate],
    queryFn: () => analyticsApi.getOwnerDashboard(startDate, endDate),
  });
};

export const usePropertyDaily = (propertyId?: string, startDate?: string, endDate?: string, enabled = true) => {
  return useQuery({
    queryKey: ["analytics", "property-daily", propertyId, startDate, endDate],
    queryFn: () => analyticsApi.getPropertyDaily(propertyId, startDate, endDate),
    enabled,
  });
};

export const useHeatmap = (startDate?: string, endDate?: string, enabled = true) => {
  return useQuery({
    queryKey: ["analytics", "heatmap", startDate, endDate],
    queryFn: () => analyticsApi.getHeatmap(startDate, endDate),
    enabled,
  });
};
