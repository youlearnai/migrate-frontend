import { create } from "zustand";
import { FlashcardMode, FlashcardStore, FlashcardView } from "@/lib/types";

export const hasChanges = () => {
  const { editSession } = useFlashcardStore.getState();
  return (
    Object.keys(editSession.editedCards).length > 0 ||
    editSession.deletedCardIds.length > 0
  );
};

export const useFlashcardStore = create<FlashcardStore>()((set) => ({
  viewMap: {
    fastReview: "display" as FlashcardView,
    activeRecall: "display" as FlashcardView,
  },
  view: "display" as FlashcardView,
  mode: "activeRecall" as FlashcardMode,

  currentIndexMap: {
    fastReview: 0,
    activeRecall: 0,
  },

  data: {},

  displayModifiersMap: {
    fastReview: {
      isShuffled: false,
      showOnlyStarred: false,
      selectedKeyConcepts: [],
    },
    activeRecall: {
      isShuffled: false,
      showOnlyStarred: false,
      selectedKeyConcepts: [],
    },
  },
  editSession: {
    deletedCardIds: [],
    editedCards: {},
  },

  introSeenActiveRecall: {},
  setIntroSeen: (contentId: string) =>
    set((state) => ({
      introSeenActiveRecall: {
        ...state.introSeenActiveRecall,
        [contentId]: true,
      },
    })),

  showIntroActiveRecall: (contentId: string) => {
    set((state) => ({
      introSeenActiveRecall: {
        ...state.introSeenActiveRecall,
        [contentId]: !state.introSeenActiveRecall[contentId],
      },
    }));
  },

  setMode: (mode) =>
    set((state) => ({
      mode,
      view: state.viewMap[mode],
      currentIndexMap: {
        ...state.currentIndexMap,
        [mode]: state.currentIndexMap[mode] || 0,
      },
      currentIndex: state.currentIndexMap[mode] || 0,
      displayModifiers: state.displayModifiersMap[mode],
    })),

  setView: (view, data) =>
    set((state) => ({
      viewMap: {
        ...state.viewMap,
        [state.mode]: view,
      },
      view,
      data,
    })),
  setData: (data) => set({ data }),

  setCurrentIndex: (index: number, mode?: FlashcardMode) => {
    set((state) => ({
      currentIndexMap: {
        ...state.currentIndexMap,
        [mode ?? state.mode]: index,
      },
      currentIndex:
        state.mode === (mode ?? state.mode) ? index : state.currentIndex,
    }));
  },

  setDisplayModifiers: (
    modifiers: Partial<{
      isShuffled: boolean;
      showOnlyStarred: boolean;
      selectedKeyConcepts?: string[];
    }>,
    mode?: FlashcardMode,
  ) =>
    set((state) => {
      const targetMode = mode ?? state.mode;
      return {
        displayModifiersMap: {
          ...state.displayModifiersMap,
          [targetMode]: {
            ...state.displayModifiersMap[targetMode],
            ...modifiers,
          },
        },
        currentIndexMap: { ...state.currentIndexMap, [targetMode]: 0 },
        displayModifiers:
          targetMode === state.mode
            ? {
                ...state.displayModifiersMap[targetMode],
                ...modifiers,
              }
            : state.displayModifiers,
        currentIndex: targetMode === state.mode ? 0 : state.currentIndex,
      };
    }),

  updateCard: (cardId, changes) =>
    set((state) => ({
      editSession: {
        ...state.editSession,
        editedCards: {
          ...state.editSession.editedCards,
          [cardId]: {
            ...(state.editSession.editedCards[cardId] || {}),
            ...changes,
          },
        },
      },
    })),

  markCardDeleted: (cardId) =>
    set((state) => ({
      editSession: {
        ...state.editSession,
        deletedCardIds: [...state.editSession.deletedCardIds, cardId],
      },
    })),

  restoreCard: (cardId) =>
    set((state) => ({
      editSession: {
        ...state.editSession,
        deletedCardIds: state.editSession.deletedCardIds.filter(
          (id) => id !== cardId,
        ),
      },
    })),

  clearEditSession: () =>
    set({
      editSession: {
        deletedCardIds: [],
        editedCards: {},
      },
    }),

  currentIndex: 0,
  displayModifiers: {
    isShuffled: false,
    showOnlyStarred: false,
    selectedKeyConcepts: [],
  },
}));
