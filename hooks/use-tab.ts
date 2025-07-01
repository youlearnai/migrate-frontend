import { TabProps } from "@/lib/types";
import { create } from "zustand";

export const useTabStore = create<TabProps>((set) => ({
  currentTab: "chat",
  setCurrentTab: (newTab) => set({ currentTab: newTab }),
}));
