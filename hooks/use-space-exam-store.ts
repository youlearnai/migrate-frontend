import { Content, SpaceExamData, SpaceExamStore } from "@/lib/types";
import { create } from "zustand";

const useSpaceExamStore = create<SpaceExamStore>((set) => ({
  step: 0,
  setStep: (step) => set({ step }),

  data: null,
  setData: (data: SpaceExamData) => set({ data }),

  isSpaceExamOpen: false,
  setIsSpaceExamOpen: (isSpaceExamOpen) => set({ isSpaceExamOpen }),

  selectedContents: [],
  setSelectedContents: (contents) =>
    set({
      selectedContents: contents,
    }),

  // helper function to toggle the selection of a content
  toggleContent: (content: Content) =>
    set((state) => {
      return {
        selectedContents: state.selectedContents.some(
          (c) => c.content_id === content.content_id,
        )
          ? state.selectedContents.filter(
              (c) => c.content_id !== content.content_id,
            )
          : [...state.selectedContents, content],
      };
    }),

  // helper function to select all contents
  toggleSelectAll: (allContents: Content[]) =>
    set((state) => {
      if (state.selectedContents.length === allContents.length) {
        return { selectedContents: [] };
      }
      return { selectedContents: [...allContents] };
    }),

  reset: () => set({ isSpaceExamOpen: false, step: 0, selectedContents: [] }),
}));

export default useSpaceExamStore;
