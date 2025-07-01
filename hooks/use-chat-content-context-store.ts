import { Content, ChatContentContextStore } from "@/lib/types";
import { create } from "zustand";

export const useChatContentContextStore = create<ChatContentContextStore>(
  (set) => ({
    contextContents: [],

    addContextContent: (content: Content) => {
      set((state) => ({
        contextContents: [...state.contextContents, content],
      }));
    },

    removeContextContent: (content: Content) => {
      set((state) => ({
        contextContents: state.contextContents.filter(
          (c) => c.id !== content.id,
        ),
      }));
    },

    updateContextContent: (content: Content) => {
      set((state) => ({
        contextContents: state.contextContents.map((c) =>
          c.id === content.id ? content : c,
        ),
      }));
    },

    resetContextContents: () => {
      set({ contextContents: [] });
    },
  }),
);
