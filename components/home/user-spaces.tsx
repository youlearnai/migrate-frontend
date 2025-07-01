"use client";
import { Box, MoveUpRight, Trash, Plus } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";
import { ModalData, Space } from "@/lib/types";
import Link from "next/link";
import { useAddSpace } from "@/query-hooks/space";
import { useUserSpaces } from "@/query-hooks/user";
import { Skeleton } from "../ui/skeleton";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const SpaceCard = ({
  space,
  index,
  contentCount,
}: {
  space: Space;
  index: number;
  contentCount: number;
}) => {
  const { t } = useTranslation();
  const { onOpen } = useModalStore();

  const handleDelete = (spaceId: string, spaceName: string) => {
    const userSpacesData: ModalData = {
      spaceId: spaceId,
      spaceName: spaceName,
    };
    onOpen("spaceDelete", userSpacesData);
  };

  return (
    <Link
      href={`/space/${space._id}`}
      key={index}
      className="group w-full text-primary/80 hover:text-primary flex flex-row justify-between items-center p-3 rounded-2xl border shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 cursor-pointer transition-all duration-200"
    >
      <div className="flex flex-row space-x-3 items-center flex-1 truncate">
        <Box className="flex-shrink-0 h-4 w-4" />
        <div className="flex flex-col space-y-1 truncate flex-1">
          <span className="truncate text-sm tracking-wide font-medium">
            {space.name}
          </span>
          <div className="text-xs text-muted-foreground">
            {contentCount}{" "}
            <span className="lowercase">
              {contentCount === 1
                ? t("contentTypes.content")
                : t("spaces.contents")}
            </span>
          </div>
        </div>
      </div>
      <Trash
        onClick={(e) => {
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
          handleDelete(space._id!, space.name);
        }}
        className="h-4 w-4 ml-2 text-primary/80 hover:text-primary transition-all duration-200 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
      />
    </Link>
  );
};

const UserSpaces = () => {
  const { t } = useTranslation();
  const { data: spaces, isLoading } = useUserSpaces();
  const { mutate: addSpace } = useAddSpace();
  const router = useRouter();

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

  if (isLoading)
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className={`h-${t("userSpaces.loadingSkeleton.height")}`} />
        <Skeleton className={`h-${t("userSpaces.loadingSkeleton.height")}`} />
        <Skeleton className={`h-${t("userSpaces.loadingSkeleton.height")}`} />
        <Skeleton className={`h-${t("userSpaces.loadingSkeleton.height")}`} />
      </div>
    );

  return (
    <>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 py-1">
        {spaces?.map((space, index) => (
          <SpaceCard
            key={space.space._id || index}
            space={space.space}
            index={index}
            contentCount={space.content_count}
          />
        ))}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCreateSpace}
                className="w-full lg:w-[66px] h-[66px] bg-transparent hover:border-primary/20 dark:text-neutral-400 text-neutral-600 dark:hover:text-neutral-50 hover:text-neutral-900 hover:text-primary border-dashed border-2 border-primary/10 dark:border-primary/20 flex items-center justify-start lg:justify-center p-3.5 cursor-pointer transition-all duration-200 rounded-2xl drop-shadow-sm gap-2"
              >
                <Plus className="h-6 w-6" />
                <span className="lg:hidden block text-sm font-medium">
                  {t("spaces.addSpace")}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("spaces.addSpaceTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};

export default UserSpaces;
