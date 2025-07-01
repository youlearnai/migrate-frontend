import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import {
  Copy,
  Volume2,
  Check,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Square,
} from "lucide-react";
import { PiNoteBold } from "react-icons/pi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatOptionsProps } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useUpdateNotes } from "@/query-hooks/content";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import useAuth from "@/hooks/use-auth";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useTTS } from "@/hooks/use-tts";

const ChatOptions = ({
  content,
  messageId,
  className,
  handleThumbsUp,
  handleThumbsDown,
  renderNavigateButton,
}: ChatOptionsProps) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const [isAddedToNotes, setIsAddedToNotes] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { mutate: updateNotes } = useUpdateNotes();
  const params = useParams();
  const contentId = params.contentId as string;
  const spaceId = params.spaceId as string;
  const isSpace = !!spaceId && !contentId;

  const cleanContent = content
    ?.replace(/【[^】]*】/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_~#`]/g, "");

  const chatId = useMemo(() => {
    return (
      messageId ||
      `chat_${content.slice(0, 20)}_${Math.random().toString(36).slice(2, 9)}`
    );
  }, [messageId, content]);

  const { togglePlay, isPlaying, isLoading } = useTTS(cleanContent, chatId);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToNotes = async () => {
    if (!user || !contentId) {
      toast.error(t("notes.pleaseLoginToViewNotes"));
      return;
    }

    setIsAddedToNotes(true);
    setTimeout(() => setIsAddedToNotes(false), 2000);

    try {
      const currentNotesData = queryClient.getQueryData<{
        note: PartialBlock<DefaultBlockSchema>[];
      }>(["getNotes", user.uid, contentId]);

      const newBlock: PartialBlock<DefaultBlockSchema> = {
        type: "paragraph",
        content: cleanContent,
      };

      const newBlockWithNewLine: PartialBlock<DefaultBlockSchema> = {
        type: "paragraph",
        content: "\n" + cleanContent,
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

  const speakTooltip = (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="w-7 h-7 p-1.5 text-muted-foreground"
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePlay();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : isPlaying ? (
              <Square className="w-3 h-3" />
            ) : (
              <Volume2 />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isPlaying ? t("chatOptions.stop") : t("chatOptions.readAloud")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const copyTooltip = useMemo(
    () => (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-7 h-7 p-1.5 text-muted-foreground"
              size="icon"
              variant="ghost"
              onClick={handleCopy}
            >
              {isCopied ? <Check /> : <Copy />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("chatOptions.copy")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    [isCopied, t],
  );

  const thumbsUpTooltip = useMemo(
    () => (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-7 h-7 p-1.5"
              variant="ghost"
              size="icon"
              onClick={handleThumbsUp}
            >
              <ThumbsUp />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("chatOptions.thumbsUp")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    [t, handleThumbsUp],
  );

  const thumbsDownTooltip = useMemo(
    () => (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-7 h-7 p-1.5"
              variant="ghost"
              size="icon"
              onClick={handleThumbsDown}
            >
              <ThumbsDown />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("chatOptions.thumbsDown")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    [t, handleThumbsDown],
  );

  const addToNotesTooltip = useMemo(
    () => (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-7 h-7 p-1.5 text-muted-foreground"
              size="icon"
              variant="ghost"
              onClick={handleAddToNotes}
            >
              {isAddedToNotes ? <Check /> : <PiNoteBold className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("popover.addToNotes")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    [t, isAddedToNotes, handleAddToNotes],
  );

  return (
    <div className={cn("flex flex-row space-x-1 items-center", className)}>
      {speakTooltip}
      {copyTooltip}
      {!isSpace && addToNotesTooltip}
      {handleThumbsUp && thumbsUpTooltip}
      {handleThumbsDown && thumbsDownTooltip}
      {renderNavigateButton && renderNavigateButton()}
    </div>
  );
};

export default ChatOptions;
