import { create } from "zustand";
import { SpaceExamQuestionIdStore } from "@/lib/types";

export const useSpaceExamQuestionIdStore = create<SpaceExamQuestionIdStore>(
  (set) => ({
    questionId: null,
    setQuestionId: (questionId: string | null) => set({ questionId }),
    title: null,
    setTitle: (title: string | null) => set({ title }),
  }),
);
