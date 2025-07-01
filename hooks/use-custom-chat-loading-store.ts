import { create } from "zustand";
import { CustomChatLoadingState, CustomChatLoadingType } from "@/lib/types";

export const useCustomChatLoadingStore = create<CustomChatLoadingState>(
  (set) => ({
    isLoading: false,
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
    type: null,
    setType: (type: CustomChatLoadingType) => set({ type }),
  }),
);
