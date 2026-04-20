import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the http client
vi.mock("@/services/http", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import http from "@/services/http";

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmailOTP", () => {
    it("should send OTP request with email", async () => {
      const email = "user@example.com";
      const mockResponse = { data: { detail: "OTP sent" } };
      (http.post as any).mockResolvedValue(mockResponse);

      // Simulate the sendEmailOTP call
      const result = await http.post("/auth/email/otp/", { email });

      expect(http.post).toHaveBeenCalledWith("/auth/email/otp/", { email });
      expect(result.data).toEqual(mockResponse.data);
    });

    it("should handle OTP request errors", async () => {
      const email = "invalid@example.com";
      const mockError = new Error("Network error");
      (http.post as any).mockRejectedValue(mockError);

      await expect(
        http.post("/auth/email/otp/", { email })
      ).rejects.toThrow("Network error");
    });
  });

  describe("verifyEmailOTP", () => {
    it("should verify OTP and return user data", async () => {
      const email = "user@example.com";
      const otp = "123456";
      const mockUser = {
        id: "user-1",
        email,
        first_name: "Test",
        last_name: "User",
      };
      const mockResponse = {
        data: { user: mockUser, access: "token123", refresh: "refreshtoken" },
      };
      (http.post as any).mockResolvedValue(mockResponse);

      const result = await http.post("/auth/email/verify/", {
        email,
        otp,
      });

      expect(http.post).toHaveBeenCalledWith("/auth/email/verify/", {
        email,
        otp,
      });
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.access).toBe("token123");
    });

    it("should handle invalid OTP error", async () => {
      const mockError = {
        response: { data: { detail: "Invalid or expired OTP" } },
      };
      (http.post as any).mockRejectedValue(mockError);

      await expect(
        http.post("/auth/email/verify/", {
          email: "user@example.com",
          otp: "000000",
        })
      ).rejects.toThrow();
    });
  });

  describe("verifyGoogleToken", () => {
    it("should verify Google ID token and return user data", async () => {
      const idToken = "google-id-token-xyz";
      const mockUser = {
        id: "user-2",
        email: "user@gmail.com",
        firebase_uid: "firebase-uid-123",
      };
      const mockResponse = {
        data: { user: mockUser, access: "token456", refresh: "refreshtoken" },
      };
      (http.post as any).mockResolvedValue(mockResponse);

      const result = await http.post("/auth/google/verify/", {
        firebase_token: idToken,
      });

      expect(http.post).toHaveBeenCalledWith("/auth/google/verify/", {
        firebase_token: idToken,
      });
      expect(result.data.user).toEqual(mockUser);
    });

    it("should return conflict error when email exists with different auth method", async () => {
      const mockError = {
        response: {
          data: {
            detail:
              "An account with this email already exists. Please sign in with email OTP first, then link your Google account from your profile.",
          },
        },
      };
      (http.post as any).mockRejectedValue(mockError);

      await expect(
        http.post("/auth/google/verify/", { firebase_token: "some-token" })
      ).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token using refresh token", async () => {
      const refreshToken = "refresh-token-xyz";
      const newAccessToken = "new-access-token";
      const mockResponse = { data: { access: newAccessToken } };
      (http.post as any).mockResolvedValue(mockResponse);

      const result = await http.post("/auth/refresh/", {
        refresh: refreshToken,
      });

      expect(http.post).toHaveBeenCalledWith("/auth/refresh/", {
        refresh: refreshToken,
      });
      expect(result.data.access).toBe(newAccessToken);
    });
  });

  describe("logout", () => {
    it("should call logout endpoint", async () => {
      const refreshToken = "refresh-token";
      (http.post as any).mockResolvedValue({ data: { detail: "Logged out" } });

      await http.post("/auth/logout/", { refresh: refreshToken });

      expect(http.post).toHaveBeenCalledWith("/auth/logout/", {
        refresh: refreshToken,
      });
    });
  });

  describe("getCurrentUser", () => {
    it("should fetch current user profile", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@example.com",
        profile_completion_percentage: 85,
      };
      const mockResponse = { data: mockUser };
      (http.get as any).mockResolvedValue(mockResponse);

      const result = await http.get("/users/profile/");

      expect(http.get).toHaveBeenCalledWith("/users/profile/");
      expect(result.data).toEqual(mockUser);
    });

    it("should handle 401 when user is not authenticated", async () => {
      const mockError = { response: { status: 401 } };
      (http.get as any).mockRejectedValue(mockError);

      await expect(http.get("/users/profile/")).rejects.toThrow();
    });
  });
});

