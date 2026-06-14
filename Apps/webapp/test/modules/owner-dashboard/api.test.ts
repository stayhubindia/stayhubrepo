import { describe, it, expect, beforeEach, vi } from "vitest";
import { http } from "@/services/http";
import { getPropertyBookings } from "@/modules/owner-dashboard/api";

// Mock the http service
vi.mock("@/services/http", () => ({
  http: {
    get: vi.fn(),
  },
}));

describe("Owner Dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBooking = {
    id: "booking-1",
    tenant: {
      id: "tenant-1",
      name: "John Doe",
      avatar: "https://example.com/avatar.jpg",
    },
    check_in: "2024-02-01T00:00:00Z",
    check_out: "2024-02-15T00:00:00Z",
    status: "CONFIRMED" as const,
    total_amount: "₹28,000",
    created_at: "2024-01-15T10:30:00Z",
  };

  describe("getPropertyBookings", () => {
    it("should fetch bookings for a property with paginated response", async () => {
      const propertyId = "prop-123";
      const mockResponse = {
        data: {
          results: [mockBooking],
          count: 1,
        },
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await getPropertyBookings(propertyId);

      expect(http.get).toHaveBeenCalledWith("/bookings/", {
        params: { property_id: propertyId },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("booking-1");
      expect(result[0].tenant.name).toBe("John Doe");
      expect(result[0].status).toBe("CONFIRMED");
    });

    it("should fetch bookings for a property with direct array response", async () => {
      const propertyId = "prop-123";
      const mockResponse = {
        data: [mockBooking],
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await getPropertyBookings(propertyId);

      expect(http.get).toHaveBeenCalledWith("/bookings/", {
        params: { property_id: propertyId },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("booking-1");
    });

    it("should handle multiple bookings with different statuses", async () => {
      const propertyId = "prop-123";
      const mockBookings = [
        { ...mockBooking, id: "booking-1", status: "CONFIRMED" as const },
        { ...mockBooking, id: "booking-2", status: "PENDING" as const },
        { ...mockBooking, id: "booking-3", status: "CANCELLED" as const },
      ];
      const mockResponse = {
        data: {
          results: mockBookings,
          count: 3,
        },
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await getPropertyBookings(propertyId);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe("CONFIRMED");
      expect(result[1].status).toBe("PENDING");
      expect(result[2].status).toBe("CANCELLED");
    });

    it("should handle empty bookings list", async () => {
      const propertyId = "prop-123";
      const mockResponse = {
        data: {
          results: [],
          count: 0,
        },
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await getPropertyBookings(propertyId);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const propertyId = "prop-123";
      const mockError = new Error("Failed to fetch bookings");
      
      vi.mocked(http.get).mockRejectedValue(mockError);

      await expect(getPropertyBookings(propertyId)).rejects.toThrow(
        "Failed to fetch bookings"
      );
    });

    it("should handle response with missing results array", async () => {
      const propertyId = "prop-123";
      const mockResponse = {
        data: {},
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await getPropertyBookings(propertyId);

      expect(result).toEqual([]);
    });

    it("should correctly pass property_id as query parameter", async () => {
      const propertyId = "prop-456";
      const mockResponse = {
        data: [],
      };
      
      vi.mocked(http.get).mockResolvedValue(mockResponse);

      await getPropertyBookings(propertyId);

      expect(http.get).toHaveBeenCalledWith("/bookings/", {
        params: { property_id: "prop-456" },
      });
    });
  });
});
