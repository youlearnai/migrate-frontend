import { NewFeature, NewFeatureStore } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const STORAGE_KEY = "new-features-250603a";
export const PREDEFINED_FEATURES: NewFeature[] = [
  {
    id: "active-recall-flashcards",
    title: "newFeature.title1", // Practice with Active Recall
    description: "newFeature.description1", // Master key concepts by actively recalling answers with smart flashcards.
    mediaSrc:
      "https://youlearn-assets.s3.us-east-2.amazonaws.com/signup_modal/ActiveRecallFlashcards.mp4",
  },
  {
    id: "mention-tools",
    title: "newFeature.title2", // Mention Tools in Chat
    description: "newFeature.description2", // Type @ to add tools like quizzes and diagrams in chat.
    mediaSrc:
      "https://youlearn-assets.s3.us-east-2.amazonaws.com/signup_modal/MentionTools.mp4",
  },
  {
    id: "molecule-visualization",
    title: "newFeature.title3", // Visualize Chemical Structures
    description: "newFeature.description3", // Create clear diagrams for chemical structures and reactions in seconds.
    mediaSrc:
      "https://youlearn-assets.s3.us-east-2.amazonaws.com/signup_modal/MoleculeVisualization.mp4",
  },
  {
    id: "recording-tab",
    title: "newFeature.title4", // Record Lectures & Meetings
    description: "newFeature.description4", // Record Google Meet or browser tabs and get notes from your sessions instantly.
    mediaSrc:
      "https://youlearn-assets.s3.us-east-2.amazonaws.com/signup_modal/RecordingTab.mp4",
  },
  {
    id: "space-chat-thinking",
    title: "newFeature.title5", // More Accurate Space Chat
    description: "newFeature.description5", // It scans your space and answers with exact sources - citing timestamps, page numbers, or sections from your content.
    mediaSrc:
      "https://youlearn-assets.s3.us-east-2.amazonaws.com/signup_modal/SpaceChatThinking.mp4",
  },
].reverse();

export const useNewFeatureStore = create<NewFeatureStore>()(
  persist(
    (set, get) => ({
      dismissedFeatureIds: [],

      dismissFeature: (id) => {
        set((state) => ({
          dismissedFeatureIds: [...state.dismissedFeatureIds, id],
        }));
      },

      getActiveFeatures: () => {
        const { dismissedFeatureIds } = get();
        return PREDEFINED_FEATURES.filter(
          (feature) => !dismissedFeatureIds.includes(feature.id),
        );
      },

      resetDismissed: () => {
        set({ dismissedFeatureIds: [] });
      },
    }),
    {
      name: STORAGE_KEY,
    },
  ),
);
