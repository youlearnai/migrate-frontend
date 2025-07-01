import { PasteChatInputStore } from "@/lib/types";
import { create } from "zustand";

export const usePasteChatInputStore = create<PasteChatInputStore>((set) => ({
  inputs: null,
  appendInput: (item) =>
    set((state) => ({
      inputs: [...(state.inputs ?? []), { ...item, id: crypto.randomUUID() }],
    })),
  removeInput: (id) =>
    set((state) => ({
      inputs: state.inputs?.filter((i) => i.id !== id) ?? null,
    })),
  removeAllInputs: () => set({ inputs: null }),
}));
