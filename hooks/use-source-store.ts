import { BoundingBoxData, SourceOrigin, SourceStore } from "@/lib/types";
import { create } from "zustand";

export const useSourceStore = create<SourceStore>((set) => ({
  source: null,
  data: null,
  lastUpdated: Date.now(),
  sourceOrigin: null,
  scrollType: "smooth",
  onSource: (
    newSource: number,
    newData?: BoundingBoxData | null,
    newSourceOrigin?: SourceOrigin,
    scrollType: "auto" | "smooth" = "smooth",
  ) => {
    set({
      source: newSource === 0 ? 0.01 : newSource,
      data: newData,
      lastUpdated: Date.now(),
      sourceOrigin: newSourceOrigin,
      scrollType: scrollType,
    });
  },
  resetSource: () => {
    set({
      source: null,
      data: null,
    });
  },
}));
