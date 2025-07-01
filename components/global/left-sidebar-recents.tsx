"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateContent } from "@/query-hooks/content";
import { useUpdateSpaceContent } from "@/query-hooks/space";
import { useGetHistory } from "@/query-hooks/user";
import { useQueryClient } from "@tanstack/react-query";
import {
  Mic,
  Box,
  ChevronDown,
  ChevronRight,
  Play,
  Text,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import LeftSidebarOptions from "./left-sidebar-options";
import { AudioLines } from "lucide-react";
import { isVideoType } from "@/lib/utils";

const LeftSidebarRecents = () => {
  const [showMore, setShowMore] = useState(false);
  const { data: history, isLoading } = useGetHistory(1, 20);
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const currentContentId = params.contentId as string;
  const currentSpaceId = params.spaceId as string;
  const [editingState, setEditingState] = useState<{
    contentId: string;
    spaceId: string | undefined;
    title: string;
  } | null>(null);
  const { mutate: updateSpaceContent } = useUpdateSpaceContent();
  const { mutate: updateContent } = useUpdateContent();
  const queryClient = useQueryClient();

  const handleEdit = (contentId: string, title: string, spaceId?: string) => {
    setEditingState({
      contentId,
      spaceId,
      title,
    });
  };

  const handleSaveTitle = (contentId: string) => {
    if (editingState?.spaceId) {
      updateSpaceContent(
        {
          spaceId: editingState?.spaceId!,
          spaceContents: [
            {
              content_id: contentId,
              content_title: editingState?.title,
            },
          ],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
            queryClient.invalidateQueries({
              queryKey: ["getContent", contentId, currentSpaceId],
            });
          },
        },
      );
    } else {
      updateContent(
        { contentId, content: { content_title: editingState?.title } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
            queryClient.invalidateQueries({
              queryKey: ["getContent", contentId, currentSpaceId],
            });
          },
        },
      );
    }
    setEditingState(null);
  };

  const handleTitleEdit = (
    e: React.KeyboardEvent<HTMLInputElement>,
    contentId: string,
  ) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSaveTitle(contentId);
    } else if (e.key === "Escape") {
      setEditingState(null);
    }
  };

  const handleBlur = () => {
    setEditingState(null);
  };

  const isContentEditing = (contentId: string, spaceId?: string) => {
    return (
      editingState?.contentId === contentId && editingState?.spaceId === spaceId
    );
  };

  if (isLoading || !history)
    return (
      <div className="flex flex-col space-y-1">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="w-[232px] h-9" />
        ))}
      </div>
    );

  if (history?.content_history.length === 0)
    return (
      <div className="text-sm text-primary/60 ml-2">
        {t("historyDashboard.loadingDetailed")}
      </div>
    );

  const displayedHistory = showMore
    ? history.content_history
    : history.content_history.slice(0, 5);

  const handleSpaceClick = (e: React.MouseEvent, spaceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/space/${spaceId}`);
  };

  return (
    <div className="flex flex-col space-y-1">
      {displayedHistory.map((history, index) => (
        <div key={index}>
          {isContentEditing(history.content.content_id, history.space?.id) ? (
            <Button
              className={`w-[232px] group items-center h-fit p-2 space-x-2 truncate justify-between text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left ${
                currentContentId === history.content.content_id &&
                currentSpaceId === history.space?.id
                  ? "bg-primary/5 dark:bg-primary/10 text-primary font-medium"
                  : ""
              }`}
              size="sm"
              variant="plain"
            >
              <div className="flex flex-row items-center space-x-2 w-full">
                {currentContentId === history.content.content_id &&
                currentSpaceId === history.space?.id ? (
                  <div className="w-2 h-2 mx-1 flex-shrink-0 rounded-full bg-green-500" />
                ) : isVideoType(history.content.type) ? (
                  <Play className="w-4 h-4 flex-shrink-0" />
                ) : history.content.type === "stt" ? (
                  <Mic className="w-4 h-4 flex-shrink-0" />
                ) : history.content.type === "audio" ? (
                  <AudioLines className="w-4 h-4 flex-shrink-0" />
                ) : history.content.type === "conversation" ? (
                  <MessageSquareText className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Text className="w-4 h-4 flex-shrink-0" />
                )}
                <div className="flex items-center space-x-2 max-w-[160px]">
                  <input
                    className="text-sm font-normal bg-primary/5 px-2 py-1 rounded outline-none w-full"
                    value={editingState?.title}
                    onChange={(e) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, title: e.target.value } : null,
                      )
                    }
                    onKeyDown={(e) =>
                      handleTitleEdit(e, history.content.content_id)
                    }
                    onBlur={handleBlur}
                    autoFocus
                  />
                  {history.space && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Box
                            className="w-4 h-4 flex-shrink-0 text-primary/60 hover:text-primary transition-colors"
                            onClick={(e) =>
                              handleSpaceClick(e, history?.space?.id!)
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent sideOffset={10}>
                          <p>{history?.space?.name!}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <LeftSidebarOptions
                spaceId={history.space?.id}
                contentId={history.content.content_id}
                contentTitle={history.content.title}
                contentUrl={history.content.content_url}
                visibility={history.content.visibility}
                handleEdit={(contentId) =>
                  handleEdit(
                    contentId!,
                    history.content.title!,
                    history.space?.id!,
                  )
                }
                contentType={history.content.type}
              />
            </Button>
          ) : (
            <Link
              href={
                history.space
                  ? `/learn/space/${history.space.id}/content/${history.content.content_id}`
                  : `/learn/content/${history.content.content_id}`
              }
            >
              <Button
                className={`w-[232px] group items-center h-fit p-2 space-x-2 truncate justify-between text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left ${
                  currentContentId === history.content.content_id &&
                  currentSpaceId === history.space?.id
                    ? "bg-primary/5 dark:bg-primary/10 text-primary font-medium"
                    : ""
                }`}
                size="sm"
                variant="plain"
              >
                <div className="flex flex-row items-center space-x-2 w-full">
                  {currentContentId === history.content.content_id &&
                  currentSpaceId === history.space?.id ? (
                    <div className="w-2 h-2 mx-1 flex-shrink-0 rounded-full bg-green-500" />
                  ) : isVideoType(history.content.type) ? (
                    <Play className="w-4 h-4 flex-shrink-0" />
                  ) : history.content.type === "stt" ? (
                    <Mic className="w-4 h-4 flex-shrink-0" />
                  ) : history.content.type === "conversation" ? (
                    <MessageSquareText className="w-4 h-4 flex-shrink-0" />
                  ) : history.content.type === "audio" ? (
                    <AudioLines className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Text className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="flex items-center space-x-2 max-w-[160px]">
                    <p className="truncate text-sm font-normal">
                      {history.content.title}
                    </p>
                    {history.space && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Box
                              className="w-4 h-4 flex-shrink-0 text-primary/60 hover:text-primary transition-colors"
                              onClick={(e) =>
                                handleSpaceClick(e, history?.space?.id!)
                              }
                            />
                          </TooltipTrigger>
                          <TooltipContent sideOffset={10}>
                            <p>{history?.space?.name!}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <LeftSidebarOptions
                  spaceId={history.space?.id}
                  contentId={history.content.content_id}
                  contentTitle={history.content.title}
                  contentUrl={history.content.content_url}
                  visibility={history.content.visibility}
                  handleEdit={(contentId) =>
                    handleEdit(
                      contentId!,
                      history.content.title!,
                      history.space?.id!,
                    )
                  }
                  contentType={history.content.type}
                />
              </Button>
            </Link>
          )}
        </div>
      ))}
      {history.content_history.length > 5 && (
        <Button
          className="w-[232px] h-fit p-2 truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none space-x-2 justify-start text-left"
          size="sm"
          variant="plain"
          onClick={() => setShowMore(!showMore)}
        >
          <p className="truncate text-sm flex items-center font-normal">
            {showMore ? (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                {t("common.showLess")}
              </>
            ) : (
              <>
                <ChevronRight className="mr-2 h-4 w-4" />
                {t("common.showMore")}
              </>
            )}
          </p>
        </Button>
      )}
    </div>
  );
};

export default memo(LeftSidebarRecents);
