import { useAgenticModeStore } from "@/hooks/use-agentic-mode-store";
import { useHighlightStore } from "@/hooks/use-highlight-store";
import { useLearnStore } from "@/hooks/use-learn";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { useTabStore } from "@/hooks/use-tab";
import { useChat } from "@/query-hooks/generation";
import { useUserProfile } from "@/query-hooks/user";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { useEffect, useState } from "react";
import { Lightbulb, BookOpenCheck } from "lucide-react";
import {
  PiQuestion,
  PiChatCircleBold,
  PiCardsBold,
  PiNoteBold,
  PiNotePencil,
} from "react-icons/pi";
import { IconType } from "react-icons";
import { useUpdateNotes } from "@/query-hooks/content";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import useAuth from "@/hooks/use-auth";
import { toast } from "sonner";

type ButtonVariant =
  | "outline"
  | "default"
  | "success"
  | "link"
  | "ghost"
  | "destructive"
  | "secondary"
  | "logo"
  | "glow"
  | "plain";
type BaseActionType = "summarize" | "chat" | "explain";
type LearnActionType =
  | "summarize"
  | "quiz"
  | "flashcards"
  | "explain"
  | "addToNotes";
type ActionType = BaseActionType | LearnActionType | "addToNotes";

type ActionConfig = {
  action: ActionType;
  handler: (text: string) => void;
  translationKey: string;
  icon?: IconType;
};

const useAdvancedMode = () => {
  const { isLearnMode, clientRef, wavStreamPlayerRef } = useLearnStore();
  const { setCurrentTab } = useTabStore();
  const { onHighlight } = useHighlightStore();
  const { screenshot, onScreenshot } = useScreenshotStore();
  const { mutate: submit } = useChat();
  const { data: user } = useUserProfile();
  const { user: authUser } = useAuth();
  const { isAgentic } = useAgenticModeStore();
  const { isWebSearch } = useWebSearchStore();
  const { t } = useTranslation();
  const { currentSource } = useCurrentSourceStore();
  const params = useParams();
  const queryClient = useQueryClient();
  const { mutate: updateNotes } = useUpdateNotes();

  const spaceId = params.spaceId as string | undefined;
  const contentId = params.contentId as string;

  const isSpacePage = spaceId && !contentId;

  const handleChat = (text: string) => {
    setCurrentTab("chat");
    onHighlight(text, { contentId });
  };

  const handleDefaultAction = (action: ActionType, text: string) => {
    setCurrentTab("chat");
    let queryText = "";
    if (action === "quiz") {
      queryText = `${t(`popover.quizMeOn`)}: "${text}"`;
    } else if (action === "flashcards") {
      queryText = `${t(`popover.flashcards`)}: "${text}"`;
    } else if (action === "explain") {
      queryText = `${t(`popover.explain`)}: "${text}"`;
    } else {
      queryText = `${t(`popover.${action}`)}: "${text}"`;
    }
    submit({
      spaceId,
      contentId,
      query: queryText,
      getExistingChatHistory: true,
      saveChatHistory: true,
      quoteText: undefined,
      quoteId: undefined,
      imageUrls: screenshot!,
      chatModelId: user?.user_profile.chat_model_id,
      agent: isAgentic,
      isWebSearch: isWebSearch,
      currentSource: isSpacePage ? undefined : currentSource,
    });
    onHighlight(null);
    onScreenshot(null);
  };

  const handleAddToNotes = async (text: string) => {
    if (!authUser || !contentId) {
      toast.error(t("notes.pleaseLoginToViewNotes"));
      return;
    }

    try {
      const currentNotesData = queryClient.getQueryData<{
        note: PartialBlock<DefaultBlockSchema>[];
      }>(["getNotes", authUser.uid, contentId]);

      const newBlockWithNewLine: PartialBlock<DefaultBlockSchema> = {
        type: "paragraph",
        content: "\n" + text,
      };

      const newBlock: PartialBlock<DefaultBlockSchema> = {
        type: "paragraph",
        content: text,
      };

      const updatedNotes = currentNotesData?.note
        ? [
            ...currentNotesData.note,
            currentNotesData.note.length ? newBlockWithNewLine : newBlock,
          ]
        : [newBlock];

      updateNotes(
        {
          contentId,
          note: updatedNotes,
        },
        {
          onSuccess: () => {
            toast.success(t("popover.addedToNotes"));
          },
        },
      );
    } catch (error) {
      console.error("Failed to add to notes:", error);
    }
  };

  const handleLearnAction = async (action: LearnActionType, text: string) => {
    if (!clientRef.current) return;

    try {
      // Interrupt any ongoing response first
      const trackSampleOffset = await wavStreamPlayerRef.current?.interrupt();
      if (trackSampleOffset?.trackId) {
        await clientRef.current.cancelResponse(
          trackSampleOffset.trackId,
          trackSampleOffset.offset,
        );
      }

      let promptText = "";
      if (action === "summarize") {
        promptText = `Summarize: "${text}"`;
      } else if (action === "quiz") {
        promptText = `Quiz me on: "${text}"`;
      } else if (action === "flashcards") {
        promptText = `Create flashcards for: "${text}"`;
      } else if (action === "explain") {
        promptText = `Explain: "${text}"`;
      }

      await clientRef.current.sendUserMessageContent([
        {
          type: "input_text",
          text: promptText,
        },
      ]);
      onHighlight(null);
      onScreenshot(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const getAdvancedBehavior = () => {
    if (isLearnMode) {
      const actions: ActionConfig[] = [
        {
          action: "explain",
          handler: (text) => handleLearnAction("explain", text),
          translationKey: "popover.explain",
          icon: PiQuestion,
        },
        {
          action: "quiz",
          handler: (text) => handleLearnAction("quiz", text),
          translationKey: "popover.quiz",
          icon: BookOpenCheck,
        },
        {
          action: "flashcards",
          handler: (text) => handleLearnAction("flashcards", text),
          translationKey: "learnTabs.flashcardsTab",
          icon: PiCardsBold,
        },
        {
          action: "addToNotes",
          handler: handleAddToNotes,
          translationKey: "popover.addToNotes",
          icon: PiNotePencil,
        },
      ];

      return {
        actions,
        buttonStyle: "ghost" as ButtonVariant,
        showDividers: true,
      };
    }

    const actions: ActionConfig[] = [
      {
        action: "explain",
        handler: (text) => handleDefaultAction("explain", text),
        translationKey: "popover.explain",
        icon: Lightbulb,
      },
      {
        action: "chat",
        handler: handleChat,
        translationKey: "popover.chat",
        icon: PiChatCircleBold,
      },
      {
        action: "quiz",
        handler: (text) => handleDefaultAction("quiz", text),
        translationKey: "popover.quiz",
        icon: BookOpenCheck,
      },
      {
        action: "flashcards",
        handler: (text) => handleDefaultAction("flashcards", text),
        translationKey: "learnTabs.flashcardsTab",
        icon: PiCardsBold,
      },
      {
        action: "addToNotes",
        handler: handleAddToNotes,
        translationKey: "popover.addToNotes",
        icon: PiNoteBold,
      },
    ];

    return {
      actions,
      buttonStyle: "ghost" as ButtonVariant,
      showDividers: true,
    };
  };

  return { getAdvancedBehavior };
};

export function AdvancedPopover({ text }: { text: string }) {
  const { t } = useTranslation();
  const { getAdvancedBehavior } = useAdvancedMode();

  // Add a small delay (150 ms) before showing the pop-over to avoid instant flashes
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // If not yet visible, render nothing (keeps DOM light and prevents accidental clicks)
  if (!visible) {
    return null;
  }

  const behavior = getAdvancedBehavior();

  const renderAction = (actionConfig: ActionConfig) => {
    const IconComponent = actionConfig.icon;

    // Define hover colors based on action type to match suggestion styles
    let hoverStyle = "";
    if (actionConfig.action === "quiz") {
      hoverStyle =
        "text-primary/80 dark:text-primary/80 group-hover/button:text-[#EF4444] dark:group-hover/button:text-[#FF6B6B]";
    } else if (actionConfig.action === "flashcards") {
      hoverStyle =
        "text-primary/80 dark:text-primary/80 group-hover/button:text-[#EAB308] dark:group-hover/button:text-[#FFD43B]";
    } else if (actionConfig.action === "explain") {
      hoverStyle =
        "text-primary/80 dark:text-primary/80 group-hover/button:text-[#9333EA] dark:group-hover/button:text-[#B455FF]";
    } else if (actionConfig.action === "chat") {
      hoverStyle =
        "text-primary/80 dark:text-primary/80 group-hover/button:text-[#008080] dark:group-hover/button:text-[#00CCCC]";
    } else if (actionConfig.action === "addToNotes") {
      hoverStyle =
        "text-primary/80 dark:text-primary/80 group-hover/button:text-[#3B82F6] dark:group-hover/button:text-[#60A5FA]";
    }

    return (
      <Button
        key={actionConfig.action}
        size="sm"
        variant={behavior.buttonStyle}
        className="flex py-0 px-2 rounded-md items-center w-full justify-start text-sm gap-1.5 hover:bg-primary/5 dark:hover:bg-primary/10 group/button"
        onClick={() => actionConfig.handler(text)}
      >
        {IconComponent && (
          <div className="flex-shrink-0">
            <IconComponent className={`h-3.5 w-3.5 ${hoverStyle}`} />
          </div>
        )}
        <span className="group-hover/button:text-primary text-primary/80 dark:text-primary/80 dark:group-hover/button:text-primary/100">
          {t(actionConfig.translationKey)}
        </span>
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-1 shadow-sm mt-1.5 dark:bg-[#1F1F1F] dark:border-primary/10">
      {behavior.actions.map((actionConfig, index) => (
        <div className="flex items-center" key={actionConfig.action}>
          {index > 0 && behavior.showDividers && (
            <div className="w-px h-6 bg-border dark:bg-primary/10 mx-1" />
          )}
          {renderAction(actionConfig)}
        </div>
      ))}
    </div>
  );
}
