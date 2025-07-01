import { ChatStore } from "@/lib/types";
import { create } from "zustand";

// TODO: Refacor in the future. This is a temporary solution to store the message for the chat.
export const useChatStore = create<ChatStore>()((set, get) => ({
  message: "",
  messageMap: {} as Record<string, string>,
  setMessage: (message) => set({ message }),
  getMessageForContent: (contentId) => {
    const { messageMap } = get();
    return messageMap[contentId] || "";
  },
  setMessageForContent: (contentId, message) => {
    set((state) => ({
      message: message,
      messageMap: {
        ...state.messageMap,
        [contentId]: message,
      },
    }));
  },
  clearMessageForContent: (contentId) => {
    set((state) => {
      const newMap = { ...state.messageMap };
      delete newMap[contentId];
      return {
        messageMap: newMap,
        message:
          contentId ===
          Object.keys(state.messageMap).find(
            (key) => state.messageMap[key] === state.message,
          )
            ? ""
            : state.message,
      };
    });
  },
}));
