import { create } from "zustand";
import { CurrentSourceStore } from "@/lib/types";

export const useCurrentSourceStore = create<CurrentSourceStore>((set) => ({
  currentSource: 0,
  setCurrentSource: (source) => set({ currentSource: source }),
}));
