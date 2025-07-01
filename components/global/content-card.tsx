import { ContentCardProps } from "@/lib/types";
import { cn, getContentTypeIcon } from "@/lib/utils";
import { useUpdateContent } from "@/query-hooks/content";
import { useUpdateSpaceContent } from "@/query-hooks/space";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Lock, Pencil } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import Options, { defaultDropdownItems } from "./options-dropdown";
import * as locales from "date-fns/locale";
import { useParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ContentCard = ({
  priority = false,
  className,
  spaceId,
  dropdownItems = defaultDropdownItems,
  indicator,
  view = "grid",
  onTitleEditStart,
  onTitleEditEnd,
  ...props
}: ContentCardProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(props.title);
  const { mutate: updateSpaceContent } = useUpdateSpaceContent();
  const { mutate: updateContent } = useUpdateContent();
  const locale = params.locale as string;
  const queryClient = useQueryClient();

  useEffect(() => {
    setEditedTitle(props.title);
  }, [props.title]);

  const handleSaveTitle = () => {
    if (spaceId) {
      updateSpaceContent(
        {
          spaceId: spaceId!,
          spaceContents: [
            {
              content_id: props.content_id,
              content_title: editedTitle,
            },
          ],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
          },
        },
      );
    } else {
      updateContent(
        {
          contentId: props.content_id,
          content: { content_title: editedTitle },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
          },
        },
      );
    }
    setIsEditingTitle(false);
    onTitleEditEnd?.();
  };

  const handleTitleEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSaveTitle();
    }
    if (e.key === "Escape") {
      setIsEditingTitle(false);
      onTitleEditEnd?.();
    }
  };

  const isEditable =
    dropdownItems?.length > 0 &&
    dropdownItems.find((item) => item.type === "edit");

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isClickingCheck =
      (e.relatedTarget as HTMLElement)?.getAttribute("aria-label") ===
      "check icon";
    if (!isClickingCheck) {
      setIsEditingTitle(false);
      onTitleEditEnd?.();
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditingTitle(true);
    setEditedTitle(props.title);
    onTitleEditStart?.();
  };

  if (view === "list") {
    return (
      <div className="flex flex-row items-center justify-between w-full h-full">
        <span>{props.type}</span>
        <span>{props.title}</span>
        <span>{props.author}</span>
        <span>{props.created_at}</span>
        <span>{props.visibility}</span>
      </div>
    );
  }

  const editedDropdownItems =
    props.type === "conversation"
      ? dropdownItems.filter((item) => item.type !== "move")
      : dropdownItems;

  return (
    <div
      className={cn(
        "relative cursor-pointer flex-col justify-center items-center rounded-lg transition duration-200 dark:border-primary group w-full",
        className,
      )}
      role="article"
      aria-label={props.title}
    >
      {dropdownItems?.length > 0 && (
        <div
          aria-label="Options"
          className="absolute z-30 top-2.5 right-2.5 p-1 hover:scale-110 duration-200 cursor-pointer rounded-full dark:bg-primary lg:bg-transparent lg:dark:bg-transparent group-hover:bg-white group-hover:dark:bg-primary transition-all"
        >
          <Options
            aria-label="options menu"
            contentUrl={props.content_url}
            contentId={(props._id || props.id)!}
            contentTitle={props.title}
            spaceId={spaceId}
            dropdownItems={editedDropdownItems}
            visibility={props.visibility}
          />
        </div>
      )}
      {props.visibility === "private" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2.5 right-10 bg-white/60 backdrop-blur-sm text-neutral-800 p-1.5 rounded-full opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                <Lock className="w-3 h-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">
                {t("shareSpace.privacyOptions.private.value")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div
        aria-label="thumbnail"
        className="rounded-t-2xl border-b overflow-hidden relative"
      >
        <Image
          unoptimized={true}
          priority={priority}
          draggable={false}
          src={props.thumbnail_url!}
          width={360}
          height={200}
          alt="thumbnailUrl"
          className="aspect-video w-full object-cover"
        />
        {indicator}
      </div>
      <div className="w-full my-2.5 flex gap-2 px-3 py-1 relative group items-center">
        {/* Content type icon on the left */}
        {(() => {
          const IconComponent = getContentTypeIcon(props.type);
          return (
            <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0 mr-1" />
          );
        })()}

        {/* Title and timestamp on the right */}
        <div className="flex-1 min-w-0">
          {isEditable ? (
            isEditingTitle ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 w-full">
                  <input
                    className="text-sm font-medium w-full outline-none bg-transparent tracking-wide rounded flex-1"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleEdit}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    onBlur={handleBlur}
                    aria-label="title input"
                    autoFocus
                  />
                  <Check
                    aria-label="check icon"
                    tabIndex={0}
                    className="w-4 h-4 text-success/80 hover:text-success cursor-pointer flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveTitle();
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {props?.created_at &&
                    formatDistanceToNow(
                      new Date(
                        props.created_at.endsWith("Z")
                          ? props.created_at
                          : `${props.created_at}Z`,
                      ),
                      {
                        addSuffix: true,
                        locale: locales[locale as keyof typeof locales],
                      },
                    )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 w-full">
                  <h5
                    aria-label="title"
                    className="text-sm font-medium truncate tracking-wide flex-1 text-primary/80 group-hover:text-primary"
                  >
                    {props.title}
                  </h5>
                  <Pencil
                    aria-label="pencil icon"
                    className="w-4 h-4 text-primary/40 opacity-100 xl:opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0 transition-opacity duration-200 hover:text-primary"
                    onClick={startEditing}
                  />
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {props?.created_at &&
                    formatDistanceToNow(
                      new Date(
                        props.created_at.endsWith("Z")
                          ? props.created_at
                          : `${props.created_at}Z`,
                      ),
                      {
                        addSuffix: true,
                        locale: locales[locale as keyof typeof locales],
                      },
                    )}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-1">
              <h5
                aria-label="title"
                className="text-sm font-medium truncate tracking-wide text-primary/80 group-hover:text-primary"
              >
                {props.title}
              </h5>
              <div className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(
                  new Date(
                    props.created_at.endsWith("Z")
                      ? props.created_at
                      : `${props.created_at}Z`,
                  ),
                  {
                    addSuffix: true,
                    locale: locales[locale as keyof typeof locales],
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
