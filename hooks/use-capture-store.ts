import { CaptureStore, HighlightSore } from "@/lib/types";
import { create } from "zustand";

export const useCaptureStore = create<CaptureStore>((set) => ({
  isCapturing: false,
  loading: false,
  setIsCapturing: (isCapturing: boolean) => set({ isCapturing }),
  setLoading: (loading: boolean) => set({ loading }),
  isDragging: false,
  setIsDragging: (isDragging: boolean) => set({ isDragging }),
}));
