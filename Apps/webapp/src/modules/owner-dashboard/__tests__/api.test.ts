import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePropertyStatus, expireProperty } from '../api';
import { http } from '@/services/http';
import type { PropertyDetail } from '@/types/property';

// Mock the http service
vi.mock('@/services/http', () => ({
  http: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('owner-dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePropertyStatus', () => {
    it('should send PATCH request to update property status', async () => {
      const mockPropertyId = 'property-123';
      const mockStatus = 'ACTIVE';
      const mockResponse: PropertyDetail = {
        id: mockPropertyId,
        status: mockStatus,
        title: 'Test Property',
        // Add other required PropertyDetail fields as needed
      } as PropertyDetail;

      vi.mocked(http.patch).mockResolvedValue({ data: mockResponse });

      const result = await updatePropertyStatus(mockPropertyId, mockStatus);

      expect(http.patch).toHaveBeenCalledWith(`/properties/${mockPropertyId}/`, { status: mockStatus });
      expect(result).toEqual(mockResponse);
    });

    it('should handle EXPIRED status', async () => {
      const mockPropertyId = 'property-456';
      const mockStatus = 'EXPIRED';
      const mockResponse: PropertyDetail = {
        id: mockPropertyId,
        status: mockStatus,
        title: 'Test Property',
      } as PropertyDetail;

      vi.mocked(http.patch).mockResolvedValue({ data: mockResponse });

      const result = await updatePropertyStatus(mockPropertyId, mockStatus);

      expect(http.patch).toHaveBeenCalledWith(`/properties/${mockPropertyId}/`, { status: mockStatus });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API request fails', async () => {
      const mockPropertyId = 'property-789';
      const mockStatus = 'ACTIVE';
      const mockError = new Error('API Error');

      vi.mocked(http.patch).mockRejectedValue(mockError);

      await expect(updatePropertyStatus(mockPropertyId, mockStatus)).rejects.toThrow('API Error');
      expect(http.patch).toHaveBeenCalledWith(`/properties/${mockPropertyId}/`, { status: mockStatus });
    });
  });

  describe('expireProperty', () => {
    it('should send POST request to expire endpoint', async () => {
      const mockPropertyId = 'property-123';

      vi.mocked(http.post).mockResolvedValue({ data: {} });

      await expireProperty(mockPropertyId);

      expect(http.post).toHaveBeenCalledWith(`/properties/${mockPropertyId}/expire/`);
    });

    it('should handle successful expiration without returning data', async () => {
      const mockPropertyId = 'property-456';

      vi.mocked(http.post).mockResolvedValue({ data: null });

      const result = await expireProperty(mockPropertyId);

      expect(http.post).toHaveBeenCalledWith(`/properties/${mockPropertyId}/expire/`);
      expect(result).toBeUndefined();
    });

    it('should throw error when API request fails', async () => {
      const mockPropertyId = 'property-789';
      const mockError = new Error('Failed to expire property');

      vi.mocked(http.post).mockRejectedValue(mockError);

      await expect(expireProperty(mockPropertyId)).rejects.toThrow('Failed to expire property');
      expect(http.post).toHaveBeenCalledWith(`/properties/${mockPropertyId}/expire/`);
    });
  });
});
