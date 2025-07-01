import { CommandStore } from "@/lib/types";
import { create } from "zustand";

export const useCommandStore = create<CommandStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
