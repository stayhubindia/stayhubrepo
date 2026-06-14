import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOwnerPropertyDetail,
  usePropertyAnalytics,
  usePropertyEnquiries,
  useUpdatePropertyStatus,
  useExpireProperty,
} from '../hooks';
import * as api from '../api';
import type { PropertyDetail } from '@/types/property';
import type { PropertyAnalytics } from '@/types/analytics';
import type { PropertyEnquiry } from '@/types/owner-dashboard';
import React from 'react';

// Mock the API module
vi.mock('../api', () => ({
  getPropertyDetail: vi.fn(),
  getPropertyAnalytics: vi.fn(),
  getPropertyEnquiries: vi.fn(),
  updatePropertyStatus: vi.fn(),
  expireProperty: vi.fn(),
}));

// Helper function to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
};

describe('owner-dashboard hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useOwnerPropertyDetail', () => {
    it('should fetch property details successfully', async () => {
      const mockProperty: PropertyDetail = {
        id: 'property-123',
        title: 'Test Property',
        status: 'ACTIVE',
      } as PropertyDetail;

      vi.mocked(api.getPropertyDetail).mockResolvedValue(mockProperty);

      const { result } = renderHook(() => useOwnerPropertyDetail('property-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.getPropertyDetail).toHaveBeenCalledWith('property-123');
      expect(result.current.data).toEqual(mockProperty);
    });

    it('should not fetch when propertyId is empty', () => {
      const { result } = renderHook(() => useOwnerPropertyDetail(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(api.getPropertyDetail).not.toHaveBeenCalled();
    });

    it('should not fetch when enabled is false', () => {
      const { result } = renderHook(() => useOwnerPropertyDetail('property-123', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(api.getPropertyDetail).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to fetch property');
      vi.mocked(api.getPropertyDetail).mockRejectedValue(mockError);

      const { result } = renderHook(() => useOwnerPropertyDetail('property-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('usePropertyAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockAnalytics: PropertyAnalytics = {
        property_id: 'property-123',
        period: 'last_30_days',
        views: { total: 100, trend: [] },
        enquiries: { total: 10, trend: [] },
        bookings: { total: 5, trend: [] },
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(api.getPropertyAnalytics).mockResolvedValue(mockAnalytics);

      const { result } = renderHook(
        () => usePropertyAnalytics('property-123', 'last_30_days'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.getPropertyAnalytics).toHaveBeenCalledWith('property-123', 'last_30_days');
      expect(result.current.data).toEqual(mockAnalytics);
    });

    it('should not fetch when enabled is false', () => {
      const { result } = renderHook(
        () => usePropertyAnalytics('property-123', 'last_30_days', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isPending).toBe(true);
      expect(api.getPropertyAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('usePropertyEnquiries', () => {
    it('should fetch enquiries successfully', async () => {
      const mockEnquiries: PropertyEnquiry[] = [
        {
          id: 'enquiry-1',
          tenant: { id: 'tenant-1', name: 'John Doe' },
          contact_type: 'PHONE',
          created_at: '2024-01-01T00:00:00Z',
          status: 'NEW',
        },
      ];

      vi.mocked(api.getPropertyEnquiries).mockResolvedValue(mockEnquiries);

      const { result } = renderHook(() => usePropertyEnquiries('property-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.getPropertyEnquiries).toHaveBeenCalledWith('property-123');
      expect(result.current.data).toEqual(mockEnquiries);
    });

    it('should not fetch when enabled is false', () => {
      const { result } = renderHook(() => usePropertyEnquiries('property-123', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(api.getPropertyEnquiries).not.toHaveBeenCalled();
    });
  });

  describe('useUpdatePropertyStatus', () => {
    it('should update property status successfully', async () => {
      const mockUpdatedProperty: PropertyDetail = {
        id: 'property-123',
        title: 'Test Property',
        status: 'EXPIRED',
      } as PropertyDetail;

      vi.mocked(api.updatePropertyStatus).mockResolvedValue(mockUpdatedProperty);

      const { result } = renderHook(() => useUpdatePropertyStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ propertyId: 'property-123', status: 'EXPIRED' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.updatePropertyStatus).toHaveBeenCalledWith('property-123', 'EXPIRED');
      expect(result.current.data).toEqual(mockUpdatedProperty);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to update status');
      vi.mocked(api.updatePropertyStatus).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdatePropertyStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ propertyId: 'property-123', status: 'ACTIVE' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useExpireProperty', () => {
    it('should expire property successfully', async () => {
      vi.mocked(api.expireProperty).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpireProperty(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('property-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.expireProperty).toHaveBeenCalledWith('property-123');
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to expire property');
      vi.mocked(api.expireProperty).mockRejectedValue(mockError);

      const { result } = renderHook(() => useExpireProperty(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('property-123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });
});
