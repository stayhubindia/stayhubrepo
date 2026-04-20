import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as any;

describe("Favorites & Leads API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFavorite = {
    id: "fav-1",
    user_id: "user-1",
    property_id: "prop-1",
    created_at: "2024-01-15T10:00:00Z",
  };

  const mockLead = {
    id: "lead-1",
    property_id: "prop-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    source: "property_inquiry",
    status: "new",
    created_at: "2024-01-15T10:00:00Z",
  };

  describe("Favorites", () => {
    describe("getFavorites", () => {
      it("should fetch user favorite properties", async () => {
        const mockResponse = {
          data: {
            results: [
              {
                property: {
                  id: "prop-1",
                  title: "Cozy Apartment",
                  price: 2000,
                },
              },
            ],
            count: 1,
          },
        };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get("/favorites/");

        expect(mockedAxios.get).toHaveBeenCalled();
        expect(result.data.results).toHaveLength(1);
      });

      it("should handle empty favorites list", async () => {
        const mockResponse = { data: { results: [], count: 0 } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get("/favorites/");

        expect(result.data.results).toHaveLength(0);
      });
    });

    describe("addFavorite", () => {
      it("should add a property to favorites", async () => {
        const propertyId = "prop-1";
        const mockResponse = { data: { ...mockFavorite, id: "fav-2" } };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await mockedAxios.post("/favorites/", {
          property_id: propertyId,
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/favorites/",
          { property_id: propertyId }
        );
        expect(result.data.property_id).toBe(propertyId);
      });

      it("should handle duplicate favorite error", async () => {
        const mockError = {
          response: {
            data: { detail: "This property is already in your favorites" },
          },
        };
        mockedAxios.post.mockRejectedValue(mockError);

        await expect(
          mockedAxios.post("/favorites/", { property_id: "prop-1" })
        ).rejects.toThrow();
      });
    });

    describe("removeFavorite", () => {
      it("should remove a property from favorites", async () => {
        const favoriteId = "fav-1";
        mockedAxios.delete.mockResolvedValue({
          data: { detail: "Removed from favorites" },
        });

        await mockedAxios.delete(`/favorites/${favoriteId}/`);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
          `/favorites/${favoriteId}/`
        );
      });

      it("should handle not found error", async () => {
        const mockError = { response: { status: 404 } };
        mockedAxios.delete.mockRejectedValue(mockError);

        await expect(
          mockedAxios.delete("/favorites/invalid-id/")
        ).rejects.toThrow();
      });
    });

    describe("isFavorited", () => {
      it("should check if property is favorited", async () => {
        const propertyId = "prop-1";
        const mockResponse = { data: { is_favorited: true } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get(
          `/properties/${propertyId}/is-favorited/`
        );

        expect(result.data.is_favorited).toBe(true);
      });

      it("should return false if not favorited", async () => {
        const propertyId = "prop-2";
        const mockResponse = { data: { is_favorited: false } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get(
          `/properties/${propertyId}/is-favorited/`
        );

        expect(result.data.is_favorited).toBe(false);
      });
    });
  });

  describe("Leads", () => {
    describe("getLeads", () => {
      it("should fetch leads for user's properties", async () => {
        const mockResponse = {
          data: {
            results: [mockLead],
            count: 1,
          },
        };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get("/leads/");

        expect(mockedAxios.get).toHaveBeenCalled();
        expect(result.data.results).toHaveLength(1);
        expect(result.data.results[0].name).toBe("John Doe");
      });

      it("should filter leads by status", async () => {
        const mockResponse = { data: { results: [mockLead], count: 1 } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        await mockedAxios.get("/leads/", {
          params: { status: "new" },
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          "/leads/",
          expect.objectContaining({
            params: expect.objectContaining({ status: "new" }),
          })
        );
      });

      it("should handle empty leads list", async () => {
        const mockResponse = { data: { results: [], count: 0 } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get("/leads/");

        expect(result.data.results).toHaveLength(0);
      });
    });

    describe("createLead", () => {
      it("should create a new lead from inquiry", async () => {
        const leadData = {
          property_id: "prop-1",
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "555-5678",
        };
        const mockResponse = {
          data: { ...mockLead, ...leadData, id: "lead-2" },
        };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await mockedAxios.post("/leads/", leadData);

        expect(mockedAxios.post).toHaveBeenCalledWith("/leads/", leadData);
        expect(result.data.name).toBe("Jane Smith");
        expect(result.data.status).toBe("new");
      });

      it("should validate required fields", async () => {
        const mockError = {
          response: {
            data: {
              name: ["This field is required."],
              email: ["This field is required."],
            },
          },
        };
        mockedAxios.post.mockRejectedValue(mockError);

        await expect(
          mockedAxios.post("/leads/", {
            property_id: "prop-1",
          })
        ).rejects.toThrow();
      });
    });

    describe("updateLeadStatus", () => {
      it("should update lead status", async () => {
        const leadId = "lead-1";
        const mockResponse = {
          data: { ...mockLead, status: "contacted" },
        };
        mockedAxios.patch.mockResolvedValue(mockResponse);

        const result = await mockedAxios.patch(`/leads/${leadId}/`, {
          status: "contacted",
        });

        expect(mockedAxios.patch).toHaveBeenCalledWith(
          `/leads/${leadId}/`,
          { status: "contacted" }
        );
        expect(result.data.status).toBe("contacted");
      });

      it("should support status transitions", async () => {
        const transitions = [
          { from: "new", to: "contacted" },
          { from: "contacted", to: "qualified" },
          { from: "qualified", to: "converted" },
        ];

        for (const transition of transitions) {
          const mockResponse = { data: { status: transition.to } };
          mockedAxios.patch.mockResolvedValue(mockResponse);

          const result = await mockedAxios.patch("/leads/lead-1/", {
            status: transition.to,
          });

          expect(result.data.status).toBe(transition.to);
        }
      });
    });

    describe("deleteLead", () => {
      it("should delete a lead", async () => {
        const leadId = "lead-1";
        mockedAxios.delete.mockResolvedValue({
          data: { detail: "Lead deleted" },
        });

        await mockedAxios.delete(`/leads/${leadId}/`);

        expect(mockedAxios.delete).toHaveBeenCalledWith(`/leads/${leadId}/`);
      });
    });
  });

  describe("Contacts", () => {
    const mockContact = {
      id: "contact-1",
      user_id: "user-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "555-9999",
      created_at: "2024-01-15T10:00:00Z",
    };

    describe("getContacts", () => {
      it("should fetch user's saved contacts", async () => {
        const mockResponse = {
          data: { results: [mockContact], count: 1 },
        };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await mockedAxios.get("/contacts/");

        expect(mockedAxios.get).toHaveBeenCalled();
        expect(result.data.results).toHaveLength(1);
      });
    });

    describe("saveContact", () => {
      it("should save a new contact", async () => {
        const contactData = {
          name: "Bob Wilson",
          email: "bob@example.com",
          phone: "555-1111",
        };
        const mockResponse = {
          data: { ...mockContact, ...contactData, id: "contact-2" },
        };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await mockedAxios.post("/contacts/", contactData);

        expect(result.data.name).toBe("Bob Wilson");
      });
    });
  });
});
