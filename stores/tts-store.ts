import { create } from "zustand";

type TTSStore = {
  activeChatId: string | null;
  activeType: "tts" | "cached" | null;
  setActiveChat: (chatId: string | null, type?: "tts" | "cached") => void;
};

export const useTTSStore = create<TTSStore>((set) => ({
  activeChatId: null,
  activeType: null,

  setActiveChat: (chatId, type) =>
    set({
      activeChatId: chatId,
      activeType: type,
    }),
}));
