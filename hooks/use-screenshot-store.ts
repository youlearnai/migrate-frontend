import { ScreenshotStore } from "@/lib/types";
import { create } from "zustand";

export const useScreenshotStore = create<ScreenshotStore>((set) => ({
  screenshot: null,
  data: {},

  onScreenshot: (screenshots: string[] | null, data) => {
    set((state) => ({
      screenshot: screenshots ? screenshots : null,
      data: data || state.data,
    }));
  },
}));
