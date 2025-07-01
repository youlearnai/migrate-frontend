import { useTouchDevice } from "@/hooks/use-touch-device";
import { cn } from "@/lib/utils";
import { useGetContent, useUpdateContent } from "@/query-hooks/content";
import { useUpdateSpaceContent } from "@/query-hooks/space";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const ContentTitle = () => {
  const params = useParams();
  const { data } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
  );
  const { mutate: updateSpaceContent } = useUpdateSpaceContent();
  const { mutate: updateContent } = useUpdateContent();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const isTouch = useTouchDevice();

  useEffect(() => {
    if (data?.title) {
      setEditedTitle(data.title);
    }
  }, [data?.title]);

  const handleSaveTitle = () => {
    if (!data?.title || editedTitle === data.title) {
      setIsEditing(false);
      return;
    }

    if (params.spaceId) {
      updateSpaceContent(
        {
          spaceId: params.spaceId as string,
          spaceContents: [
            {
              content_id: params.contentId as string,
              content_title: editedTitle,
            },
          ],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [
                "getContent",
                params.contentId as string,
                params.spaceId as string,
              ],
            });
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
            setIsEditing(false);
          },
        },
      );
    } else {
      updateContent(
        {
          contentId: params.contentId as string,
          content: { content_title: editedTitle },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [
                "getContent",
                params.contentId as string,
                params.spaceId as string,
              ],
            });
            queryClient.invalidateQueries({ queryKey: ["getHistory"] });
            setIsEditing(false);
          },
        },
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSaveTitle();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditedTitle(data?.title || "");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isClickingCheck =
      (e.relatedTarget as HTMLElement)?.getAttribute("aria-label") ===
      "check icon";
    if (!isClickingCheck) {
      handleSaveTitle();
    }
  };

  return (
    <div className="px-2 text-md font-normal flex group flex-row items-center gap-2 text-primary tracking-tight lg:w-[500px] xl:w-[600px]">
      {isEditing ? (
        <>
          <input
            className="border px-2 py-1 rounded-lg outline-none flex-1"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
          />
          <Pencil className="w-4 text-muted-foreground" />
          {isTouch && (
            <Check
              aria-label="check icon"
              tabIndex={0}
              className="w-5 h-5 text-success/80 hover:text-success cursor-pointer"
              onClick={handleSaveTitle}
            />
          )}
        </>
      ) : (
        <>
          <span
            className={cn(
              "truncate w-full flex-1 cursor-pointer border hover:border-primary/20 border-transparent px-2 py-1 rounded-lg",
            )}
            onClick={() => {
              setIsEditing(true);
              setEditedTitle(data?.title || "");
            }}
          >
            {data?.title}
          </span>
          <Pencil
            onClick={() => {
              setIsEditing(true);
              setEditedTitle(data?.title || "");
            }}
            className={cn(
              "w-4 cursor-pointer text-muted-foreground",
              !isTouch && "opacity-0 group-hover:opacity-100",
            )}
          />
        </>
      )}
    </div>
  );
};
export default ContentTitle;
