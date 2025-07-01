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
import { DropdownItem, OptionsProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAddContent, useCheckContentInSpace } from "@/query-hooks/content";
import { useUserSpaces } from "@/query-hooks/user";
import { Box, EllipsisVertical, Move, Share, Trash } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "../ui/skeleton";

export const defaultDropdownItems: DropdownItem[] = [
  { type: "move" },
  { type: "share" },
  { type: "separator" },
  { type: "delete" },
  { type: "edit" },
];

const Options = ({
  contentId,
  contentTitle,
  contentUrl,
  spaceId,
  dropdownItems = defaultDropdownItems,
  visibility,
  className,
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
    onOpen("contentDelete", { contentId, contentTitle, spaceId });
  };

  const renderDropdownItem = (item: DropdownItem) => {
    switch (item.type) {
      case "move":
        return (
          <DropdownMenuSub onOpenChange={setIsSubmenuOpen}>
            <DropdownMenuSubTrigger
              aria-label="Move"
              className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
            >
              <Move className="h-4 w-4 mr-2" />
              <span>{t("smartkbd.add")}</span>
            </DropdownMenuSubTrigger>
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
        );
      case "share":
        return (
          <DropdownMenuItem
            onClick={() =>
              onOpen("shareContent", { contentId, spaceId, visibility })
            }
            className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
          >
            <Share className="h-4 w-4 mr-2" />
            <span>{t("optionsMenu.share")}</span>
          </DropdownMenuItem>
        );
      case "separator":
        return <DropdownMenuSeparator />;
      case "delete":
        return (
          <DropdownMenuItem
            className="flex items-center cursor-pointer w-full px-4 py-2 text-sm"
            onClick={handleDelete}
          >
            <Trash className="h-4 w-4 mr-2" />
            <span>{t("optionsMenu.delete")}</span>
          </DropdownMenuItem>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisVertical
          aria-label={t("optionsMenu.openMenu")}
          className={cn(
            "w-3.5 h-3.5 opacity-100 xl:opacity-0 group-hover:opacity-100 text-black",
            className,
          )}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => e.stopPropagation()}
        className="w-48 rounded-lg shadow-lg"
        aria-label="options menu"
      >
        {dropdownItems?.map((item, index) => (
          <React.Fragment key={index}>
            {renderDropdownItem(item)}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Options;
