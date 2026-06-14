import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPropertyDetail,
  getPropertyAnalytics,
  getPropertyEnquiries,
  updatePropertyStatus,
  expireProperty,
} from './api';
import type { PropertyDetail } from '@/types/property';
import type { PropertyAnalytics } from '@/types/analytics';

/**
 * Hook to fetch detailed information for a specific property.
 * Used in the owner property dashboard to display property details with caching.
 * 
 * @param propertyId - The unique identifier of the property
 * @param enabled - Whether the query should be enabled (defaults to true)
 * @returns TanStack Query result with property detail data
 * 
 * @example
 * ```tsx
 * const { data: property, isLoading, error } = useOwnerPropertyDetail(propertyId);
 * ```
 */
export const useOwnerPropertyDetail = (propertyId: string, enabled = true) =>
  useQuery({
    queryKey: ['owner', 'properties', 'detail', propertyId],
    queryFn: () => getPropertyDetail(propertyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(propertyId) && enabled,
  });

/**
 * Hook to fetch analytics data for a specific property over a given time period.
 * Used in the owner property dashboard to display performance metrics.
 * 
 * @param propertyId - The unique identifier of the property
 * @param period - The time period for analytics
 * @param enabled - Whether the query should be enabled (defaults to true)
 * @returns TanStack Query result with analytics data including views, enquiries, and bookings
 * 
 * @example
 * ```tsx
 * const { data: analytics } = usePropertyAnalytics(propertyId, 'last_30_days');
 * ```
 */
export const usePropertyAnalytics = (
  propertyId: string,
  period: PropertyAnalytics['period'],
  enabled = true
) =>
  useQuery({
    queryKey: ['owner', 'properties', 'analytics', propertyId, period],
    queryFn: () => getPropertyAnalytics(propertyId, period),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: Boolean(propertyId) && enabled,
  });

/**
 * Hook to fetch all enquiries (contact leads) for a specific property.
 * Used in the owner property dashboard to display tenant enquiries in the Enquiries tab.
 * 
 * @param propertyId - The unique identifier of the property
 * @param enabled - Whether the query should be enabled (defaults to true)
 * @returns TanStack Query result with array of property enquiries
 * 
 * @example
 * ```tsx
 * const { data: enquiries } = usePropertyEnquiries(propertyId);
 * ```
 */
export const usePropertyEnquiries = (propertyId: string, enabled = true) =>
  useQuery({
    queryKey: ['owner', 'properties', 'enquiries', propertyId],
    queryFn: () => getPropertyEnquiries(propertyId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: Boolean(propertyId) && enabled,
  });

/**
 * Hook to update the status of a specific property.
 * Used in the owner property dashboard to toggle property status between active and inactive.
 * Automatically invalidates related queries on success.
 * 
 * @returns TanStack Query mutation result
 * 
 * @example
 * ```tsx
 * const updateStatus = useUpdatePropertyStatus();
 * await updateStatus.mutateAsync({ propertyId: '123', status: 'ACTIVE' });
 * ```
 */
export const useUpdatePropertyStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, status }: { propertyId: string; status: PropertyDetail['status'] }) =>
      updatePropertyStatus(propertyId, status),
    onSuccess: (_, variables) => {
      // Invalidate the specific property detail query
      queryClient.invalidateQueries({
        queryKey: ['owner', 'properties', 'detail', variables.propertyId],
      });
      // Invalidate all properties queries to update lists
      queryClient.invalidateQueries({
        queryKey: ['properties'],
      });
    },
  });
};

/**
 * Hook to expire/deactivate a specific property.
 * Used in the owner property dashboard to permanently deactivate a property listing.
 * Automatically invalidates related queries on success.
 * 
 * @returns TanStack Query mutation result
 * 
 * @example
 * ```tsx
 * const expirePropertyMutation = useExpireProperty();
 * await expirePropertyMutation.mutateAsync('property-123');
 * ```
 */
export const useExpireProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => expireProperty(propertyId),
    onSuccess: (_, propertyId) => {
      // Invalidate the specific property detail query
      queryClient.invalidateQueries({
        queryKey: ['owner', 'properties', 'detail', propertyId],
      });
      // Invalidate all properties queries to update lists
      queryClient.invalidateQueries({
        queryKey: ['properties'],
      });
    },
  });
};
