import { ResizeState } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useResizeStore = create<ResizeState>()(
  persist(
    (set) => ({
      isFullTab: false,
      panelSize: 60,
      isSecondaryPanelOpen: true,
      setIsFullTab: (newFullTab: boolean) => set({ isFullTab: newFullTab }),
      setPanelSize: (newSize: number) => set({ panelSize: newSize }),
      setIsSecondaryPanelOpen: (newIsSecondaryPanelOpen: boolean) =>
        set({ isSecondaryPanelOpen: newIsSecondaryPanelOpen }),
    }),
    {
      name: "resizeable",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
