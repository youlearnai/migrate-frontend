import { ScrollState } from "@/lib/types";
import { create } from "zustand";

export const useSummaryScrollStore = create<ScrollState>((set) => ({
  scrollPosition: 0,
  contentId: null,
  setScrollData: (position, contentId) =>
    set({ scrollPosition: position, contentId }),
  resetScroll: () => set({ scrollPosition: 0, contentId: null }),
}));
