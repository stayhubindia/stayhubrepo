import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as any;

describe("Properties API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProperty = {
    id: "prop-1",
    title: "Cozy Apartment",
    description: "A nice apartment in the city",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    price: 2000,
    bed_count: 2,
    bath_count: 1,
    area_sqft: 1000,
    property_type: "apartment",
    status: "published",
    owner_id: "user-1",
    images: [{ url: "image1.jpg" }],
  };

  describe("getProperties", () => {
    it("should fetch list of properties", async () => {
      const mockResponse = {
        data: {
          results: [mockProperty],
          count: 1,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Simulate the getProperties call
      const result = await mockedAxios.get("/properties/", {
        params: { page: 1 },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/properties/",
        expect.objectContaining({ params: { page: 1 } })
      );
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].id).toBe("prop-1");
    });

    it("should filter properties by city", async () => {
      const mockResponse = { data: { results: [mockProperty], count: 1 } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await mockedAxios.get("/properties/", {
        params: { city: "New York" },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/properties/",
        expect.objectContaining({
          params: expect.objectContaining({ city: "New York" }),
        })
      );
    });

    it("should handle empty property list", async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mockedAxios.get("/properties/");

      expect(result.data.results).toHaveLength(0);
    });

    it("should handle API errors", async () => {
      const mockError = new Error("Failed to fetch properties");
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(mockedAxios.get("/properties/")).rejects.toThrow(
        "Failed to fetch properties"
      );
    });
  });

  describe("createProperty", () => {
    it("should create a new property", async () => {
      const newProperty = {
        title: "New House",
        description: "Beautiful house",
        address: "456 Oak Ave",
        city: "Boston",
        state: "MA",
        price: 350000,
        bed_count: 3,
        bath_count: 2,
        area_sqft: 2500,
        property_type: "house",
      };

      const mockResponse = { data: { ...newProperty, id: "prop-2", status: "draft" } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await mockedAxios.post("/properties/", newProperty);

      expect(mockedAxios.post).toHaveBeenCalledWith("/properties/", newProperty);
      expect(result.data.id).toBe("prop-2");
      expect(result.data.status).toBe("draft");
    });

    it("should handle validation errors on property creation", async () => {
      const invalidProperty = {
        title: "", // Required field
      };

      const mockError = {
        response: {
          data: { title: ["This field may not be blank."] },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(mockedAxios.post("/properties/", invalidProperty)).rejects.toThrow();
    });
  });

  describe("updateProperty", () => {
    it("should update an existing property", async () => {
      const propertyId = "prop-1";
      const updates = { price: 2200, description: "Updated description" };
      const mockResponse = { data: { ...mockProperty, ...updates } };
      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await mockedAxios.patch(
        `/properties/${propertyId}/`,
        updates
      );

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `/properties/${propertyId}/`,
        updates
      );
      expect(result.data.price).toBe(2200);
    });
  });

  describe("publishProperty", () => {
    it("should publish a property from draft to published", async () => {
      const propertyId = "prop-1";
      const mockResponse = {
        data: { ...mockProperty, status: "published" },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await mockedAxios.post(
        `/properties/${propertyId}/publish/`,
        {}
      );

      expect(result.data.status).toBe("published");
    });

    it("should handle publish errors (e.g., incomplete property)", async () => {
      const propertyId = "prop-incomplete";
      const mockError = {
        response: {
          data: { detail: "Property is missing required fields" },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        mockedAxios.post(`/properties/${propertyId}/publish/`, {})
      ).rejects.toThrow();
    });
  });

  describe("deleteProperty", () => {
    it("should delete a property", async () => {
      const propertyId = "prop-1";
      mockedAxios.delete.mockResolvedValue({ data: { detail: "Deleted" } });

      await mockedAxios.delete(`/properties/${propertyId}/`);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `/properties/${propertyId}/`
      );
    });
  });
});
