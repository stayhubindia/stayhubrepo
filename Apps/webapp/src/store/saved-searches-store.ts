import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedSearchItem } from "@/types/favorite";

interface SavedSearchesState {
  searches: SavedSearchItem[];
  addSearch: (search: Omit<SavedSearchItem, "id" | "created_at" | "updated_at">) => void;
  removeSearch: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearAll: () => void;
}

export const useSavedSearchesStore = create<SavedSearchesState>()(
  /*
   * NOTE: Saved searches are stored in localStorage only (key: "stayhub-saved-searches").
   * They are NOT persisted to the server. Clearing browser data will erase all saved searches.
   * Server-side persistence is deferred to a future spec.
   */
  persist(
    (set) => ({
      searches: [],
      addSearch: (search) =>
        set((state) => ({
          searches: [
            {
              ...search,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...state.searches,
          ],
        })),
      removeSearch: (id) =>
        set((state) => ({
          searches: state.searches.filter((s) => s.id !== id),
        })),
      toggleAlert: (id) =>
        set((state) => ({
          searches: state.searches.map((s) =>
            s.id === id
              ? {
                  ...s,
                  alerts_on: !s.alerts_on,
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        })),
      clearAll: () => set({ searches: [] }),
    }),
    {
      name: "stayhub-saved-searches",
    }
  )
);
