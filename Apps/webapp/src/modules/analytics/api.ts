import { http } from "@/services/http";
import type { OwnerDashboardSnapshot, PropertyDailyAggregate, LocationHeatmap } from "@/types/analytics";

export const analyticsApi = {
  getOwnerDashboard: async (startDate?: string, endDate?: string) => {
    const { data } = await http.get<OwnerDashboardSnapshot[]>("/analytics/dashboard/", {
      params: { start: startDate, end: endDate },
    });
    return data;
  },

  getPropertyDaily: async (propertyId?: string, startDate?: string, endDate?: string) => {
    const { data } = await http.get<PropertyDailyAggregate[]>("/analytics/properties/daily/", {
      params: { property_id: propertyId, start: startDate, end: endDate },
    });
    return data;
  },

  getHeatmap: async (startDate?: string, endDate?: string) => {
    const { data } = await http.get<LocationHeatmap[]>("/analytics/heatmap/", {
      params: { start: startDate, end: endDate },
    });
    return data;
  },
};
