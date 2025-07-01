"use client";

import { useAddSpace, useUpdateSpace } from "@/query-hooks/space";
import { useUserSpaces } from "@/query-hooks/user";
import { useQueryClient } from "@tanstack/react-query";
import { Box, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Skeleton } from "../ui/skeleton";
import SidebarOptions from "./left-sidebar-options";
import SidebarSpaceContent from "./left-sidebar-space-content";

const LeftSidebarSpaces = () => {
  const [showMore, setShowMore] = useState(false);
  const [openSpaces, setOpenSpaces] = useState<Record<string, boolean>>({});
  const { data: spaces, isLoading } = useUserSpaces();
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const currentSpaceId = params.spaceId as string;
  const { mutate: addSpace } = useAddSpace();
  const { mutate: updateSpace } = useUpdateSpace();
  const queryClient = useQueryClient();
  const [editingState, setEditingState] = useState<{
    spaceId: string;
    title: string;
  } | null>(null);

  const handleEdit = (contentId?: string, title?: string, spaceId?: string) => {
    if (spaceId && title) {
      setEditingState({
        spaceId: spaceId,
        title: title,
      });
    }
  };

  const handleSaveTitle = (spaceId: string) => {
    updateSpace(
      { spaceId, spaceName: editingState?.title! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getHistory"] });
          queryClient.invalidateQueries({ queryKey: ["userSpaces"] });
          setEditingState(null);
        },
      },
    );
  };

  const handleTitleEdit = (
    e: React.KeyboardEvent<HTMLInputElement>,
    spaceId: string,
  ) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSaveTitle(spaceId);
    } else if (e.key === "Escape") {
      setEditingState(null);
    }
  };

  const handleBlur = () => {
    setEditingState(null);
  };

  const isSpaceEditing = (spaceId: string) => {
    return editingState?.spaceId === spaceId;
  };

  if (isLoading || !spaces)
    return (
      <div className="flex flex-col space-y-1">
        <Skeleton className="w-[232px] h-9" />
        <Skeleton className="w-[232px] h-9" />
        <Skeleton className="w-[232px] h-9" />
      </div>
    );

  const displayedSpaces = showMore ? spaces : spaces?.slice(0, 3);

  const toggleSpace = (spaceId: string) => {
    setOpenSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  const handleCreateSpace = () => {
    addSpace(
      {
        spaceName: t("spaces.defaultSpaceName"),
        visibility: "private",
      },
      {
        onSuccess: (data) => {
          if (data && data._id) {
            router.push(`/space/${data._id}`);
          }
        },
      },
    );
  };

  return (
    <div className="flex w-[232px] flex-col space-y-1">
      <Button
        className={`mb-1 w-full flex border-2 border-dashed border-primary/10 bg-transparent justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 hover:border-primary/10 underline-none text-left mt-2`}
        size="sm"
        variant="plain"
        onClick={handleCreateSpace}
      >
        <Plus className="h-4 w-4 mr-2" />
        <span>{t("spaces.addSpace")}</span>
      </Button>
      {displayedSpaces?.map((space) => (
        <Collapsible
          key={space.space._id}
          open={openSpaces[space.space._id!]}
          onOpenChange={() => toggleSpace(space.space._id!)}
        >
          <div className="flex items-center group">
            <Button
              className={`w-full flex justify-between items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left ${
                currentSpaceId === space.space._id && !params.contentId
                  ? "bg-primary/5 dark:bg-primary/10 text-primary font-medium"
                  : ""
              }`}
              size="sm"
              variant="plain"
              onClick={() => router.push(`/space/${space.space._id}`)}
            >
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <div
                    className="mr-2 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box className="h-4 w-4 flex-shrink-0 hidden xl:block xl:group-hover:hidden" />
                    {openSpaces[space.space._id!] ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 block xl:hidden xl:group-hover:block" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0 block xl:hidden xl:group-hover:block" />
                    )}
                  </div>
                </CollapsibleTrigger>
                {isSpaceEditing(space.space._id!) ? (
                  <input
                    className="text-sm font-normal bg-primary/5 px-2 py-1 rounded outline-none max-w-[160px]"
                    value={editingState?.title}
                    onChange={(e) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, title: e.target.value } : null,
                      )
                    }
                    onKeyDown={(e) => handleTitleEdit(e, space.space._id!)}
                    onBlur={handleBlur}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate max-w-[160px] text-sm font-normal">
                    {space.space.name}
                  </span>
                )}
              </div>
              <SidebarOptions
                spaceId={space.space._id!}
                spaceName={space.space.name}
                visibility={space.space.visibility}
                handleEdit={() =>
                  handleEdit(undefined, space.space.name, space.space._id)
                }
              />
            </Button>
          </div>
          <CollapsibleContent>
            <SidebarSpaceContent space={space.space._id!} />
          </CollapsibleContent>
        </Collapsible>
      ))}
      {spaces && spaces.length > 3 && (
        <Button
          className="w-[232px] p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none space-x-2 justify-start text-left"
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

export default LeftSidebarSpaces;
