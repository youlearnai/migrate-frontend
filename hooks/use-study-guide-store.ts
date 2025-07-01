import { StudyGuideStore } from "@/lib/types";
import { create } from "zustand";

export const useStudyGuideStore = create<StudyGuideStore>((set) => ({
  currentIndex: 0,
  view: "display",
  data: null,
  navigatedGroupId: null,

  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setView: (view) => set({ view }),
  setData: (data) => set({ data }),
  setNavigatedGroupId: (groupId: string | null) =>
    set({ navigatedGroupId: groupId }),
}));
