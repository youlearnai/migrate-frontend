import { ChatLimitBannerStore } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useChatLimitBannerStore = create<ChatLimitBannerStore>()(
  persist(
    (set) => ({
      isOpen: true,
      setIsOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "chat-limit-banner",
    },
  ),
);
