import { ModalProps } from "@/lib/types";
import { create } from "zustand";

export const useModalStore = create<ModalProps>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
