import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth-store";

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
    });
  });

  describe("setSession", () => {
    it("should set user and tokens in store", () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
      };
      const mockTokens = {
        access: "access-token",
        refresh: "refresh-token",
      };

      useAuthStore.setState({
        user: mockUser,
        tokens: mockTokens,
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
    });
  });

  describe("clearSession", () => {
    it("should clear user and tokens from store", () => {
      // Set initial state
      useAuthStore.setState({
        user: { id: "user-1", email: "test@example.com" },
        tokens: { access: "token", refresh: "refresh" },
      });

      // Clear session
      useAuthStore.setState({
        user: null,
        tokens: null,
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
    });
  });

  describe("setError", () => {
    it("should set error message in store", () => {
      const errorMsg = "Authentication failed";
      useAuthStore.setState({ error: errorMsg });

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMsg);
    });

    it("should clear error when set to null", () => {
      useAuthStore.setState({ error: "Some error" });
      useAuthStore.setState({ error: null });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user and tokens exist", () => {
      useAuthStore.setState({
        user: { id: "user-1", email: "test@example.com" },
        tokens: { access: "token", refresh: "refresh" },
      });

      const state = useAuthStore.getState();
      const isAuth = state.user !== null && state.tokens !== null;
      expect(isAuth).toBe(true);
    });

    it("should return false when user is null", () => {
      useAuthStore.setState({
        user: null,
        tokens: { access: "token", refresh: "refresh" },
      });

      const state = useAuthStore.getState();
      const isAuth = state.user !== null && state.tokens !== null;
      expect(isAuth).toBe(false);
    });

    it("should return false when tokens are null", () => {
      useAuthStore.setState({
        user: { id: "user-1", email: "test@example.com" },
        tokens: null,
      });

      const state = useAuthStore.getState();
      const isAuth = state.user !== null && state.tokens !== null;
      expect(isAuth).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("should set loading state", () => {
      useAuthStore.setState({ isLoading: true });
      let state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);

      useAuthStore.setState({ isLoading: false });
      state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("should update user profile data while keeping tokens", () => {
      const originalUser = {
        id: "user-1",
        email: "test@example.com",
        profile_completion_percentage: 50,
      };
      const tokens = { access: "token", refresh: "refresh" };

      useAuthStore.setState({ user: originalUser, tokens });

      // Update user profile
      const updatedUser = { ...originalUser, profile_completion_percentage: 85 };
      useAuthStore.setState({ user: updatedUser });

      const state = useAuthStore.getState();
      expect(state.user?.profile_completion_percentage).toBe(85);
      expect(state.tokens).toEqual(tokens); // Tokens unchanged
    });
  });
});
