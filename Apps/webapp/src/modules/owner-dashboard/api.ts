import { http } from "@/services/http";
import type { PropertyDetail } from "@/types/property";
import type { PropertyAnalytics, TrendData, PropertyDailyAggregate } from "@/types/analytics";
import type { PropertyBooking, PropertyEnquiry } from "@/types/owner-dashboard";
import type { ContactLead } from "@/types/contact";

/**
 * Fetches detailed information for a specific property by ID.
 */
export const getPropertyDetail = async (propertyId: string): Promise<PropertyDetail> => {
  const { data } = await http.get<PropertyDetail>(`/properties/${propertyId}/`);
  return data;
};

/**
 * Fetches analytics data for a specific property over a given time period.
 * Uses /analytics/properties/daily/ and aggregates into PropertyAnalytics shape.
 */
export const getPropertyAnalytics = async (
  propertyId: string,
  period: PropertyAnalytics['period'] = 'last_30_days'
): Promise<PropertyAnalytics> => {
  // Calculate date range from period
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string | undefined;

  if (period === 'last_7_days') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
  } else if (period === 'last_30_days') {
    const d = new Date(now); d.setDate(d.getDate() - 30);
    startDate = d.toISOString().split('T')[0];
  } else if (period === 'last_90_days') {
    const d = new Date(now); d.setDate(d.getDate() - 90);
    startDate = d.toISOString().split('T')[0];
  }
  // 'all_time' — no start date

  const { data } = await http.get<PropertyDailyAggregate[] | { results?: PropertyDailyAggregate[] }>(
    '/analytics/properties/daily/',
    { params: { property_id: propertyId, start: startDate, end: endDate } }
  );

  const rows: PropertyDailyAggregate[] = Array.isArray(data)
    ? data
    : (data.results ?? []);

  // Build trend arrays and totals
  const viewsTrend: TrendData[] = rows.map(r => ({ date: r.date, value: r.views }));
  const enquiriesTrend: TrendData[] = rows.map(r => ({ date: r.date, value: r.contacts }));

  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  const totalEnquiries = rows.reduce((s, r) => s + r.contacts, 0);

  return {
    property_id: propertyId,
    period,
    views: { total: totalViews, trend: viewsTrend },
    enquiries: { total: totalEnquiries, trend: enquiriesTrend },
    bookings: { total: 0, trend: [] },
    updated_at: new Date().toISOString(),
  };
};

/**
 * Fetches all enquiries (contact leads) for a specific property.
 * Uses /contacts/leads/ (owner endpoint) and filters by property_id client-side.
 */
export const getPropertyEnquiries = async (propertyId: string): Promise<PropertyEnquiry[]> => {
  const { data } = await http.get<ContactLead[] | { results: ContactLead[] }>('/contacts/leads/');
  const leads = Array.isArray(data) ? data : data.results || [];

  return leads
    .filter((lead) => lead.property === propertyId)
    .map((lead) => ({
      id: lead.id,
      tenant: {
        id: lead.tenant,
        name: lead.tenant_name,
      },
      contact_type: lead.contact_type,
      message: lead.message ?? undefined,
      created_at: lead.created_at,
      status: 'NEW' as const,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Fetches bookings for a specific owner property.
 */
export const getPropertyBookings = async (propertyId: string): Promise<PropertyBooking[]> => {
  const { data } = await http.get<PropertyBooking[] | { results?: PropertyBooking[] }>("/bookings/", {
    params: { property_id: propertyId },
  });

  return Array.isArray(data) ? data : (data.results ?? []);
};

/**
 * Updates the status of a specific property.
 */
export const updatePropertyStatus = async (
  propertyId: string,
  status: PropertyDetail['status']
): Promise<PropertyDetail> => {
  const { data } = await http.patch<PropertyDetail>(`/properties/${propertyId}/`, { status });
  return data;
};

/**
 * Expires/deactivates a specific property.
 */
export const expireProperty = async (propertyId: string): Promise<void> => {
  await http.post(`/properties/${propertyId}/expire/`);
};
