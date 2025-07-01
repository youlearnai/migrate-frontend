import { CustomErrorType, ErrorModalData, ErrorStore } from "@/lib/types";
import { create } from "zustand";

export const useErrorStore = create<ErrorStore>((set) => ({
  isOpen: false,
  error: null,
  data: {},
  override: false,
  openModal: (
    error: CustomErrorType,
    data?: ErrorModalData,
    override: boolean = false,
  ) => set({ isOpen: true, error, data, override }),
  closeModal: () => set({ isOpen: false, error: null, override: false }),
}));
