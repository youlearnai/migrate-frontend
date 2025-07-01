import { create } from "zustand";
import { ChatLoadingStore } from "@/lib/types";

export const useChatLoadingStore = create<ChatLoadingStore>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
  streaming: false,
  setStreaming: (streaming) => set({ streaming }),
}));
