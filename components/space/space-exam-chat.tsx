import { useHighlightStore } from "@/hooks/use-highlight-store";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { useChat, useChatHistory } from "@/query-hooks/generation";
import { useUserProfile } from "@/query-hooks/user";
import { useParams } from "next/navigation";
import React from "react";
import ChatMessages from "../learn/chat-messages";
import ChatInput from "../learn/chat-submit";
import { cn } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import DeleteChatButton from "../learn/delete-chat-button";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import { useSpaceExamQuestionIdStore } from "@/hooks/use-space-exam-question-id-store";

const SpaceExamChat = ({
  className,
  spaceId,
}: {
  className?: string;
  spaceId: string;
}) => {
  const params = useParams();
  const chatbotType = "space";
  const contentId = params.contentId as string;
  const { data: chats, isLoading } = useChatHistory(
    spaceId,
    chatbotType,
    contentId,
  );
  const { data: userProfile } = useUserProfile();
  const {
    mutate: submit,
    loading: isSubmitting,
    streaming: isStreaming,
  } = useChat();
  const { screenshot, onScreenshot } = useScreenshotStore();
  const { isWebSearch } = useWebSearchStore();
  const { highlight, data, onHighlight } = useHighlightStore();
  const { isFullWidth } = useRightSidebar();
  const { questionId, setQuestionId } = useSpaceExamQuestionIdStore();

  const handleSubmit = (text: string) => {
    if (isSubmitting) return;

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
      agent: false,
      isWebSearch: isWebSearch,
      questionId: questionId!,
    });
    onHighlight(null);
    onScreenshot(null);
    setQuestionId(null);
  };

  const isChatEmpty = chats?.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col relative  px-4 h-full mx-auto ",
        isFullWidth ? "lg:w-3/5 2xl:w-1/2" : "w-full",
        className,
      )}
    >
      {!isChatEmpty && (
        <div
          key="delete-button-container"
          className="absolute top-0 right-0 -mt-2 z-40"
        >
          <DeleteChatButton key="delete-button" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto overscroll-none">
        <ChatMessages
          className="max-w-full"
          chats={chats}
          isStreaming={isStreaming}
        />
      </div>
      <ChatInput handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default SpaceExamChat;
