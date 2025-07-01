import { HighlightSore } from "@/lib/types";
import { create } from "zustand";

export const useHighlightStore = create<HighlightSore>((set) => ({
  highlight: null,
  data: {},
  onHighlight: (newHighlight: string | null, data) => {
    set({ highlight: newHighlight, data: data });
  },
}));
