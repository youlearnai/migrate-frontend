import { create } from "zustand";
import debounce from "lodash/debounce";
import { SearchHighlightStore } from "@/lib/types";

export const useSearchHighlightStore = create<SearchHighlightStore>(
  (set, get) => ({
    searchQuery: "",
    activeMatchIndex: 0,
    totalMatches: 0,
    isSearching: false,
    componentMatches: {},

    setSearchQuery: (query: string) =>
      set({
        searchQuery: query,
        isSearching: query.length > 0,
        activeMatchIndex: 0,
        componentMatches: {},
        totalMatches: 0,
      }),

    reportComponentMatches: (componentId: string, count: number) =>
      set((state) => {
        // Performance optimization: check if count hasn't changed
        if (state.componentMatches[componentId] === count) {
          return state; // Return current state to avoid re-render
        }

        // Update component match count
        const newComponentMatches = { ...state.componentMatches };

        if (count === 0) {
          // Remove this component if it has no matches
          delete newComponentMatches[componentId];
        } else {
          newComponentMatches[componentId] = count;
        }

        // Calculate total matches across all components
        const newTotalMatches = Object.values(newComponentMatches).reduce(
          (sum, count) => sum + count,
          0,
        );

        // If nothing changed, return current state to avoid re-render
        if (
          newTotalMatches === state.totalMatches &&
          state.activeMatchIndex < newTotalMatches
        ) {
          return { componentMatches: newComponentMatches };
        }

        return {
          componentMatches: newComponentMatches,
          totalMatches: newTotalMatches,
          // Adjust active index if needed
          activeMatchIndex:
            state.activeMatchIndex >= newTotalMatches
              ? newTotalMatches > 0
                ? newTotalMatches - 1
                : 0
              : state.activeMatchIndex,
        };
      }),

    clearComponentMatches: () =>
      set({
        componentMatches: {},
        totalMatches: 0,
        activeMatchIndex: 0,
      }),

    nextMatch: () =>
      set((state) => ({
        activeMatchIndex:
          state.totalMatches > 0
            ? (state.activeMatchIndex + 1) % state.totalMatches
            : 0,
      })),

    previousMatch: () =>
      set((state) => ({
        activeMatchIndex:
          state.totalMatches > 0
            ? (state.activeMatchIndex - 1 + state.totalMatches) %
              state.totalMatches
            : 0,
      })),

    resetSearch: () =>
      set({
        searchQuery: "",
        activeMatchIndex: 0,
        totalMatches: 0,
        isSearching: false,
        componentMatches: {},
      }),

    debouncedSetSearchQuery: debounce(
      (query: string) =>
        set({
          searchQuery: query,
          isSearching: query.length > 0,
          activeMatchIndex: 0,
          componentMatches: {},
          totalMatches: 0,
        }),
      300,
    ),
  }),
);
