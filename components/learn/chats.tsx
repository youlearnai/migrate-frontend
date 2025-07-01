import { useAgenticModeStore } from "@/hooks/use-agentic-mode-store";
import useAuth from "@/hooks/use-auth";
import { useHighlightStore } from "@/hooks/use-highlight-store";
import { useMicStore } from "@/hooks/use-mic-store";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { ContentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useGetContent } from "@/query-hooks/content";
import {
  useChat,
  useChatHistory,
  useCreateLivekitConnection,
} from "@/query-hooks/generation";
import { useUserProfile } from "@/query-hooks/user";
import {
  MessageCircle,
  Globe,
  AudioLines,
  BookOpenCheck,
  Brain,
  Search,
  Blocks,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ChatSkeleton from "../skeleton/chat-skeleton";
import ChatSubmit from "./chat-submit";
import DeleteChatButton from "./delete-chat-button";
import ChatMessages from "./chat-messages";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { useConnectionState, useRoomContext } from "@livekit/components-react";
import AdvancedVoice from "./advanced-voice";
import { PiCardsBold, PiChatCircleBold } from "react-icons/pi";
import { TbTimeline } from "react-icons/tb";
import { useChatStore } from "@/hooks/use-chat-store";
import { RiMindMap } from "react-icons/ri";
import { MdOutlineJoinInner } from "react-icons/md";
import CustomChatLoading from "./custom-chat-loading";
import { IconType } from "react-icons";
import { useChatContentContextStore } from "@/hooks/use-chat-content-context-store";
import { getUniqueContextContentsFromChats } from "@/lib/utils";

export const Chats = ({
  type,
  className,
  isFullWidth,
}: {
  type?: ContentType;
  className?: string;
  isFullWidth?: boolean;
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const { user, loading } = useAuth();
  const { screenshot, onScreenshot } = useScreenshotStore();
  const { highlight, data, onHighlight } = useHighlightStore();
  const { data: contentData } = useGetContent(
    params.spaceId as string | undefined,
    params.contentId as string,
    { enabled: !!params.contentId },
  );
  const { isWebSearch, onWebSearch } = useWebSearchStore();
  const { isRecording } = useMicStore();
  const { isAgentic } = useAgenticModeStore();
  const spaceId = params.spaceId as string | undefined;
  const contentId = params.contentId as string;
  const chatbotType = spaceId ? "space" : "content";
  const { data: chats, isLoading } = useChatHistory(
    spaceId,
    chatbotType,
    contentId,
  );
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const { data: userProfile } = useUserProfile();
  const {
    mutate: submit,
    loading: isSubmitting,
    streaming: isStreaming,
  } = useChat();
  const { currentSource } = useCurrentSourceStore();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const isManualScrolling = useRef(false);
  const { setMessage, setMessageForContent } = useChatStore();
  const { mutate: createLivekitConnection } = useCreateLivekitConnection();
  const { contextContents, resetContextContents } =
    useChatContentContextStore();
  const chatContextContents = getUniqueContextContentsFromChats(chats);

  const handleScroll = useCallback(() => {
    const currentRef = chatContainerRef.current;
    if (currentRef) {
      isManualScrolling.current = true;

      const { scrollTop, clientHeight, scrollHeight } = currentRef;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setUserHasScrolled(!atBottom);

      setTimeout(() => {
        isManualScrolling.current = false;
      }, 250);
    }
  }, []);

  useEffect(() => {
    const currentRef = chatContainerRef.current;
    currentRef?.addEventListener("scroll", handleScroll);
    return () => {
      currentRef?.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (isManualScrolling.current) return;

    const currentRef = chatContainerRef.current;

    if (currentRef && !userHasScrolled) {
      const scrollToBottom = () => {
        if (currentRef.scrollHeight > currentRef.clientHeight) {
          currentRef.scrollTop = currentRef.scrollHeight;
        }
      };

      const animationFrame = requestAnimationFrame(scrollToBottom);
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [chats, userHasScrolled, isStreaming]);

  useEffect(() => {
    if (!isStreaming || isManualScrolling.current || userHasScrolled) return;

    const currentRef = chatContainerRef.current;
    if (!currentRef) return;

    const scrollToBottom = () => {
      if (currentRef.scrollHeight > currentRef.clientHeight) {
        currentRef.scrollTop = currentRef.scrollHeight;
      }
    };

    const interval = setInterval(scrollToBottom, 100);
    return () => clearInterval(interval);
  }, [isStreaming, userHasScrolled]);

  const canProceedWithVoiceChat = () => {
    const isVoiceChatAllowed =
      isRecording ||
      (contentData?.content_url !== "stt" && contentData?.content_url !== null);
    if (isVoiceChatAllowed) {
      return true;
    }
    toast.error(t("chats.sttError"));
    return false;
  };

  const isSpacePage = spaceId && !contentId;

  const handleSubmit = (text: string) => {
    if (isSubmitting) return;
    if (type === "stt" && !canProceedWithVoiceChat()) {
      return;
    }

    submit({
      spaceId,
      contentId,
      query: text,
      getExistingChatHistory: true,
      saveChatHistory: true,
      quoteText: highlight || undefined,
      quoteId: data?.quoteId! || "0",
      imageUrls: screenshot!,
      chatModelId: userProfile?.user_profile.chat_model_id!,
      agent: isSpacePage ? false : isAgentic,
      isWebSearch: isWebSearch,
      currentSource: isSpacePage ? undefined : currentSource,
      contextContents: contextContents,
    });
    onHighlight(null);
    onScreenshot(null);
    resetContextContents();

    const currentRef = chatContainerRef.current;
    if (currentRef) {
      const { scrollTop, clientHeight, scrollHeight } = currentRef;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (atBottom) {
        setUserHasScrolled(false);
      }
    }
  };

  const handleMentionSelect = (prompt: string) => {
    setMessage(prompt);
    setMessageForContent(contentId, prompt);
  };

  const handleVoiceMode = async () => {
    createLivekitConnection(
      {
        contentId,
        spaceId,
      },
      {
        onSuccess: async (data) => {
          await room?.connect(
            process.env.NEXT_PUBLIC_LIVEKIT_URL as string,
            data.token,
          );
          await room.localParticipant.setMicrophoneEnabled(true);
        },
      },
    );
  };

  const handleSearchMode = () => {
    onWebSearch(true);
  };

  if (isLoading || loading) return <ChatSkeleton />;

  const isChatEmpty = !chats || chats.length === 0;

  const suggestions = [
    {
      label: t("popover.quiz"),
      icon: BookOpenCheck,
      action: () =>
        handleMentionSelect(
          t("createMeWithA", {
            label: "@[quiz]",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#EF4444]/10 hover:text-[#EF4444] dark:hover:text-[#EF4444] border-neutral-200 dark:border-neutral-800 hover:border-[#EF4444]/50 dark:hover:border-[#EF4444]/50",
    },
    {
      label: t("featureMentions.mindMapDisplay"),
      icon: RiMindMap,
      action: () =>
        handleMentionSelect(
          t("createMeWithA", {
            label: "@[mind-map]",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#9333EA]/10 hover:text-[#9333EA] dark:hover:text-[#9333EA] border-neutral-200 dark:border-neutral-800 hover:border-[#9333EA]/50 dark:hover:border-[#9333EA]/50",
    },
    {
      label: t("voiceMode.button"),
      icon: AudioLines,
      action: () => handleVoiceMode(),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#4B5563]/10 hover:text-[#4B5563] dark:hover:text-[#4B5563] border-neutral-200 dark:border-neutral-800 hover:border-[#4B5563]/50 dark:hover:border-[#4B5563]/50",
    },
    {
      label: t("featureMentions.flowchartDisplay"),
      icon: PiChatCircleBold,
      action: () =>
        handleMentionSelect(
          t("createMeWithA", {
            label: "@[" + t("flowchart") + "] ",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#3CB371]/10 hover:text-[#3CB371] dark:hover:text-[#3CB371] border-neutral-200 dark:border-neutral-800 hover:border-[#3CB371]/50 dark:hover:border-[#3CB371]/50",
    },
    {
      label: t("featureMentions.vennDiagramDisplay"),
      icon: MdOutlineJoinInner,
      action: () =>
        handleMentionSelect(
          t("createMeWithA", {
            label: "@[venn-diagram]",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#F97316]/10 hover:text-[#F97316] dark:hover:text-[#F97316] border-neutral-200 dark:border-neutral-800 hover:border-[#F97316]/50 dark:hover:border-[#F97316]/50",
    },
    {
      label: t("featureMentions.flashcardsDisplay"),
      icon: PiCardsBold,
      action: () =>
        handleMentionSelect(
          t("createMe", {
            label: "@[flashcards]",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#EAB308]/10 hover:text-[#EAB308] dark:hover:text-[#EAB308] border-neutral-200 dark:border-neutral-800 hover:border-[#EAB308]/50 dark:hover:border-[#EAB308]/50",
    },
    {
      label: t("search"),
      icon: Globe,
      action: () => handleSearchMode(),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] dark:hover:text-[#3B82F6] border-neutral-200 dark:border-neutral-800 hover:border-[#3B82F6]/50 dark:hover:border-[#3B82F6]/50",
    },
    {
      label: t("featureMentions.timelineDisplay"),
      icon: TbTimeline,
      action: () =>
        handleMentionSelect(
          t("createMeWithA", {
            label: "@[timeline]",
          }),
        ),
      className:
        "text-primary/40 dark:text-primary/60 hover:bg-[#3CB371]/10 hover:text-[#3CB371] dark:hover:text-[#3CB371] border-neutral-200 dark:border-neutral-800 hover:border-[#3CB371]/50 dark:hover:border-[#3CB371]/50",
    },
  ];

  const renderSuggestions = () => {
    const topRowLabels = suggestions.slice(0, 3);
    const bottomRowLabels = suggestions.slice(5, 8);

    type SuggestionButtonProps = {
      label: string;
      icon: IconType;
      action: () => void;
      className: string;
    };

    if (isSpacePage || type === "conversation") {
      return null;
    }

    const SuggestionButton = ({
      label,
      icon: Icon,
      action,
      className,
    }: SuggestionButtonProps) => (
      <div
        key={label}
        className={cn(
          "flex items-center justify-center px-3 py-2 rounded-xl gap-2 hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors font-medium border",
          className,
        )}
        onClick={action}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-xs">{label}</span>
      </div>
    );

    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {topRowLabels.map((suggestion) => (
            <SuggestionButton key={suggestion.label} {...suggestion} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {bottomRowLabels.map((suggestion) => (
            <SuggestionButton key={suggestion.label} {...suggestion} />
          ))}
        </div>
      </div>
    );
  };

  const renderChatEmpty = () => {
    return (
      <div className="flex flex-col items-center justify-center text-center text-primary/40 dark:text-primary/60 p-4">
        <MessageCircle className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-base font-medium mb-1 text-primary/40 dark:text-primary/60">
          {t("chats.emptyChatTitle")}
        </p>
        {/* <p className="text-sm text-neutral-400 dark:text-neutral-600">
          {t(
            "chats.emptyChatDescription",
            "Ask anything or use the suggestions below",
          )}
        </p> */}
        {renderSuggestions()}
      </div>
    );
  };

  return (
    <div
      key="chats-container"
      className={cn(
        "w-full md:h-[calc(100vh-142px)] h-full flex flex-col relative",
        className,
        spaceId && params.contentId ? "px-0" : "px-0",
      )}
    >
      {!isChatEmpty && (
        <div
          key="delete-button-container"
          className={cn(
            "absolute top-0 right-0 sm:right-[-12] -mt-5 z-40",
            (type === "conversation" || isFullWidth) &&
              "sm:right-2 md:right-4 lg:right-8",
            isSpacePage && "-mt-7 xl:-mt-2",
          )}
        >
          <DeleteChatButton key="delete-button" />
        </div>
      )}
      <div
        key="chat-messages"
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-10 lg:space-y-4 overflow-y-auto overscroll-y-none flex flex-col"
      >
        {isChatEmpty && (
          <div
            className={cn(
              isFullWidth ? "lg:w-3/5 2xl:w-1/2" : "w-full",
              "max-w-full mx-auto",
            )}
          >
            <CustomChatLoading />
          </div>
        )}
        <div
          className={cn(
            "max-w-full mx-auto flex-grow flex flex-col justify-center px-4 sm:px-4",
            isFullWidth ? "lg:w-3/5 2xl:w-1/2" : "w-full",
            !isChatEmpty && "justify-start",
          )}
        >
          {isChatEmpty ? (
            renderChatEmpty()
          ) : (
            <>
              <ChatMessages
                chats={chats}
                isStreaming={isStreaming}
                chatContextContents={chatContextContents}
              />
              <CustomChatLoading />
            </>
          )}
        </div>
      </div>
      <div
        key="chat-input-container"
        className={cn(
          "mt-0 w-full max-w-full mx-auto px-2 sm:px-0",
          isFullWidth ? "lg:w-3/5 2xl:w-1/2" : "w-full",
        )}
      >
        <div className="sm:ml-0.5">
          {connectionState === "connected" && !isSpacePage ? (
            <AdvancedVoice />
          ) : (
            <ChatSubmit
              key="chat-submit"
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              type={type}
              enabledVoice={!isSpacePage}
              chatContextContents={chatContextContents}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
