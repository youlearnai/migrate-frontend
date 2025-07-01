import {
  LeftSidebarStore,
  RightSidebarStore,
  SidebarSettings,
} from "@/lib/types";
import { produce } from "immer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useRightSidebar = create(
  persist<RightSidebarStore>(
    (set, get) => ({
      isOpen: false,
      isHover: false,
      settings: { disabled: false, isHoverOpen: false },
      isFullWidth: false,
      toggleOpen: () => {
        set({ isOpen: !get().isOpen });
      },
      setIsOpen: (isOpen: boolean, data?: any) => {
        set({ isOpen, data });
      },
      setIsHover: (isHover: boolean) => {
        set({ isHover });
      },
      getOpenState: () => {
        const state = get();
        return state.isOpen || (state.settings.isHoverOpen && state.isHover);
      },
      data: null,
      setSettings: (settings: Partial<SidebarSettings>) => {
        set(
          produce((state: LeftSidebarStore) => {
            state.settings = { ...state.settings, ...settings };
          }),
        );
      },
      setIsFullWidth: (isFullWidth: boolean) => {
        set({ isFullWidth });
      },
    }),
    {
      name: "right-sidebar",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
