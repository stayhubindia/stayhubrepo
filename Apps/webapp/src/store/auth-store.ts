"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { AppUser, AuthTokens } from "@/types/auth";

interface AuthState {
  user: AppUser | null;
  tokens: AuthTokens | null;
  setSession: (user: AppUser, tokens: AuthTokens) => void;
  clearSession: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      clearSession: () => set({ user: null, tokens: null }),
    }),
    {
      name: "gharbazar-auth",
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : localStorage)),
    },
  ),
);
