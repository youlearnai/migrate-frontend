import { AgenticModeData, AgenticModeStore } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAgenticModeStore = create<AgenticModeStore>()(
  persist(
    (set) => ({
      isAgentic: true,
      data: { contentId: null },
      setIsAgentic: (newIsAgentic: boolean, data: AgenticModeData) => {
        set({ isAgentic: newIsAgentic, data: data });
      },
    }),
    {
      name: "agentic-mode-storage",
    },
  ),
);
