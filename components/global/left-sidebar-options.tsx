"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModalStore } from "@/hooks/use-modal-store";
import { OptionsProps } from "@/lib/types";
import { useAddContent, useCheckContentInSpace } from "@/query-hooks/content";
import { useUserSpaces } from "@/query-hooks/user";
import { Box, Ellipsis, Move, Pencil, Share, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "../ui/skeleton";

const LeftSidebarOptions = ({
  contentType,
  contentId,
  contentUrl,
  spaceId,
  contentTitle,
  spaceName,
  visibility,
  handleEdit,
}: OptionsProps) => {
  const { t } = useTranslation();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const { data: userSpacesData } = useUserSpaces();
  const { mutate: moveContent } = useAddContent();
  const { onOpen } = useModalStore();

  const handleMove = (spaceId: string) => {
    moveContent({
      spaceId: spaceId,
      contentURLs: [contentUrl!],
      addToHistory: false,
    });
  };

  const { data: spacesWithContent, isLoading: isSpacesWithContentLoading } =
    useCheckContentInSpace(contentId as string, {
      enabled: isSubmenuOpen,
    });

  const filteredSpaces = isSubmenuOpen
    ? userSpacesData?.filter(
        (space) => !spacesWithContent?.includes(space.space._id!),
      )
    : [];

  const handleDelete = () => {
    if (spaceId && spaceName) {
      onOpen("spaceDelete", { spaceId, spaceName });
    } else if (contentId && contentTitle && spaceId) {
      onOpen("contentDelete", { contentId, contentTitle, spaceId });
    } else if (contentId && contentTitle) {
      onOpen("contentDelete", { contentId, contentTitle });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Ellipsis className="w-3.5 h-3.5 flex-shrink-0 opacity-100 xl:opacity-0 group-hover:opacity-100 text-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => e.stopPropagation()}
        className="w-48 ml-5 rounded-lg shadow-lg"
        side="right"
      >
        {contentId && (
          <DropdownMenuSub onOpenChange={setIsSubmenuOpen}>
            {contentType !== "conversation" && (
              <DropdownMenuSubTrigger className="flex items-center cursor-pointer w-full px-4 py-2 text-sm">
                <Move className="h-4 w-4 mr-2" />
                <span>{t("smartkbd.add")}</span>
              </DropdownMenuSubTrigger>
            )}
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                alignOffset={-1}
                sideOffset={8}
                className="w-full -mt-1 rounded-lg shadow-lg"
              >
                {isSpacesWithContentLoading ? (
                  <div className="flex flex-col min-w-24 space-y-1">
                    <Skeleton className="h-6 rounded-sm w-full" />
                    <Skeleton className="h-6 rounded-sm w-full" />
                    <Skeleton className="h-6 rounded-sm w-full" />
                  </div>
                ) : filteredSpaces?.length === 0 ? (
                  <div className="text-center text-sm p-1.5">
                    {t("optionsMenu.noSpacesAvailable")}
                  </div>
                ) : (
                  filteredSpaces?.map((space, index) => (
                    <DropdownMenuItem
                      onClick={() => handleMove(space.space._id!)}
                      key={index}
                      className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
                    >
                      <Box className="h-4 w-4 mr-2" />
                      <span>{space.space.name}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        <DropdownMenuItem
          onClick={() => {
            if (spaceId && spaceName) {
              onOpen("shareSpace", { spaceId });
            } else {
              onOpen("shareContent", { contentId, spaceId, visibility });
            }
          }}
          className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
        >
          <Share className="h-4 w-4 mr-2" />
          <span>{t("optionsMenu.share")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
          onClick={() => handleEdit!(contentId!, contentTitle!, spaceId!)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          <span>{t("flashcards.edit")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
          onClick={handleDelete}
        >
          <Trash className="h-4 w-4 mr-2" />
          <span>{t("optionsMenu.delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LeftSidebarOptions;
