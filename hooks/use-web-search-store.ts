import { WebSearchData, WebSearchStore } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWebSearchStore = create<WebSearchStore>()(
  persist(
    (set) => ({
      isWebSearch: false,
      data: { contentId: null, spaceId: null },
      onWebSearch: (isWebSearch: boolean, data?: WebSearchData) => {
        set({ isWebSearch: isWebSearch, data: data });
      },
    }),
    {
      name: "web-search-storage",
    },
  ),
);
