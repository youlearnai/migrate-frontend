import { ContentViewStore } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useContentViewStore = create<ContentViewStore>()(
  persist(
    (set) => ({
      contentView: "grid",
      setContentView: (contentView) => set({ contentView }),
    }),
    {
      name: "content-view-storage",
    },
  ),
);
