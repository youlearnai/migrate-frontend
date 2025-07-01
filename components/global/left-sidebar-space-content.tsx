import { useGetSpace } from "@/query-hooks/space";
import { AudioLines, MessageSquareText, Mic, Play, Text } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import SidebarOptions from "./left-sidebar-options";
import { isVideoType } from "@/lib/utils";

const LeftSidebarSpaceContent = ({ space }: { space: string }) => {
  const { data: spaceDetails, isLoading } = useGetSpace(space);
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  if (isLoading || !spaceDetails)
    return (
      <div className="flex flex-col ml-6 mt-1 space-y-1">
        <Skeleton className="w-[216px] h-9" />
        <Skeleton className="w-[216px] h-9" />
        <Skeleton className="w-[216px] h-9" />
      </div>
    );

  if (spaceDetails.contents.length === 0)
    return (
      <div className="ml-6 mt-1 text-sm text-primary/50 font-normal">
        {t("noContent.message")}
      </div>
    );

  return (
    <div className="flex ml-4 mt-1 flex-col space-y-1">
      {spaceDetails.contents.map((content) => (
        <Button
          key={content.content_id}
          onClick={() =>
            router.push(`/learn/space/${space}/content/${content.content_id}`)
          }
          variant="plain"
          className={`w-[216px] items-center group p-2 h-fit truncate text-primary/80 hover:text-primary justify-between hover:bg-primary/5 space-x-2 text-left ${
            params.contentId === content.content_id && params.spaceId === space
              ? "bg-primary/5 dark:bg-primary/10 text-primary font-medium"
              : ""
          }`}
        >
          <div className="flex flex-row items-center space-x-2 w-full">
            {params.contentId === content.content_id &&
            params.spaceId === space ? (
              <div className="w-2 h-2 mx-1 flex-shrink-0 rounded-full bg-green-500" />
            ) : isVideoType(content.type) ? (
              <Play className="w-4 h-4 flex-shrink-0" />
            ) : content.type === "stt" ? (
              <Mic className="w-4 h-4 flex-shrink-0" />
            ) : content.type === "audio" ? (
              <AudioLines className="w-4 h-4 flex-shrink-0" />
            ) : content.type === "conversation" ? (
              <MessageSquareText className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Text className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate max-w-[160px] font-normal">
              {content.title}
            </span>
          </div>
          <SidebarOptions
            spaceId={space}
            contentId={content.content_id}
            contentTitle={content.title}
            contentUrl={content.content_url}
            visibility={content.visibility}
          />
        </Button>
      ))}
    </div>
  );
};

export default LeftSidebarSpaceContent;
