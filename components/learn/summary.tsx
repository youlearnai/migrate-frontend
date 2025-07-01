import { ResponseChunk } from "@/lib/types";
import { useGenerateSummary } from "@/query-hooks/generation";
import { useParams } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import LinesSkeleton from "../skeleton/lines-skeleton";
import GenUI from "./gen-ui";
import { useSummaryScrollStore } from "@/hooks/use-summary-scroll-store";
import { Plus, Settings, Sparkle } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";
import { useErrorStore as useErrorModalStore } from "@/hooks/use-error-store";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/use-auth";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { useGetContent } from "@/query-hooks/content";
import { cn, isDocumentType } from "@/lib/utils";
import { formatMilliseconds } from "@/lib/utils";
import { useResizeStore } from "@/hooks/use-resize-store";

const Summary = () => {
  const params = useParams();
  const { t } = useTranslation();
  const { onOpen: onSummaryOptionsOpen } = useModalStore();
  const { openModal: openErrorModal } = useErrorModalStore();
  const { user, loading: authLoading } = useAuth();
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isRefetching: isSummaryRefetching,
  } = useGenerateSummary(params.contentId as string);
  const { scrollPosition, contentId, setScrollData, resetScroll } =
    useSummaryScrollStore();
  const currentContentId = params.contentId as string;
  const { data: content } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
  );
  const { isFullTab } = useResizeStore();

  const contentType = content?.type;
  const maxRangeLength = content?.length;

  const isDocument = contentType && isDocumentType(contentType);

  const handleCustomizeSummary = () => {
    if (authLoading) return;

    if (!user) {
      toast.message(t("summary.signInToCreatePrompt"));
      openErrorModal({
        status: 401,
        statusText: t("errors.unauthorized"),
      });
    } else {
      onSummaryOptionsOpen("summaryOptions");
    }
  };

  const renderedSummaryContent = useMemo<ReactNode>(() => {
    if (typeof summaryData === "string") {
      return (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-muted-foreground text-center mt-4">
            {summaryData}
          </div>
        </div>
      );
    }

    if (summaryData?.summary) {
      const concatenatedSummaryText = summaryData.summary
        .map((chunk: ResponseChunk) => chunk.content)
        .join("");

      return (
        <>
          <GenUI
            chunks={summaryData.summary}
            className="border-none max-w-full mt-0"
            chatMessageId={""}
          />
        </>
      );
    }

    return (
      <div className="sm:mt-24 h-full w-full flex items-center justify-center">
        <div>
          <span className="text-shimmer">{t("summary.generating2")}</span>
        </div>
      </div>
    );
  }, [summaryData]);

  useEffect(() => {
    if (contentId && contentId !== currentContentId) {
      resetScroll();
    }
  }, [contentId, currentContentId, resetScroll]);

  if (isSummaryLoading || isSummaryRefetching || authLoading) {
    return (
      <div className="sm:mt-24 h-full w-full flex items-center justify-center">
        <div>
          <span className="text-shimmer">{t("summary.generating2")}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(ref) => {
        if (contentId && ref && contentId === currentContentId) {
          ref.scrollTop = scrollPosition;
        }
      }}
      onScroll={(e) =>
        setScrollData(e.currentTarget.scrollTop, currentContentId)
      }
      className="mt-[-16] px-4 overflow-y-auto overscroll-y-none relative h-full md:h-[calc(100vh-150px)] flex flex-col"
    >
      <div className={cn(isFullTab ? "lg:w-3/5 2xl:w-1/2 mx-auto" : "w-full")}>
        {summaryData?.summary && (
          <div className="sticky top-[-0.1px] z-10 pb-2 mb-4 bg-background flex items-center justify-between border-b">
            <div className="flex items-center flex-wrap gap-2">
              {summaryData.summary_type && (
                <Badge
                  variant="outline"
                  className="text-sm capitalize outline-none font-medium border-none text-muted-foreground"
                >
                  <span>{t("summary.promptLabel")}</span>
                  <span className="mx-0.5"></span>
                  {summaryData.summary_type === "detailed" && (
                    <span>{summaryData.summary_type}</span>
                  )}
                  {summaryData.summary_type === "custom" && (
                    <span className="truncate lg:max-w-xs max-w-[5rem]">
                      {summaryData.user_prompt?.name}
                    </span>
                  )}
                </Badge>
              )}
              {summaryData.summary_range && (
                <Badge
                  variant="outline"
                  className="text-sm font-medium border-none text-muted-foreground"
                >
                  <span className="truncate lg:max-w-xs max-w-[8rem]">
                    {summaryData.summary_range.length === 0
                      ? `${isDocument ? t("summary.pagesLabel") : t("summary.timestampLabel")}: ${t("summary.all")}`
                      : `${isDocument ? t("summary.pageLabel") : t("summary.timestampLabel")}: ${
                          isDocument
                            ? summaryData.summary_range?.join(" - ")
                            : Array.isArray(summaryData.summary_range) &&
                                summaryData.summary_range.length > 0 &&
                                Array.isArray(summaryData.summary_range[0])
                              ? summaryData.summary_range
                                  ?.map((range) => {
                                    if (
                                      Array.isArray(range) &&
                                      range.length >= 2
                                    ) {
                                      return `${formatMilliseconds(range[0])} - ${formatMilliseconds(range[1])}`;
                                    }
                                    return "";
                                  })
                                  .filter(Boolean)
                                  .join(", ")
                              : Array.isArray(summaryData.summary_range) &&
                                  summaryData.summary_range.length >= 2
                                ? `${formatMilliseconds(summaryData.summary_range[0])} - ${formatMilliseconds(summaryData.summary_range[1])}`
                                : "00:00 - 00:00"
                        }`}
                  </span>
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCustomizeSummary}
              disabled={authLoading}
              className="flex items-center gap-2 text-sm"
            >
              <Sparkle className="h-4 w-4" />
              <span>{t("summary.customizeSummary")}</span>
            </Button>
          </div>
        )}
        {renderedSummaryContent}
      </div>
    </div>
  );
};

export default Summary;
