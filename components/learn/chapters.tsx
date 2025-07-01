import { useChaptersScrollStore } from "@/hooks/use-chapters-scroll-store";
import { useMicStore } from "@/hooks/use-mic-store";
import { useSourceStore } from "@/hooks/use-source-store";
import {
  BoundingBoxData,
  type Chapter,
  ContentType,
  SourceOrigin,
} from "@/lib/types";
import { convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { useGenerateChapters } from "@/query-hooks/generation";
import { SafeHighlightPopover } from "./safe-highlight-popover";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { isDocumentType } from "@/lib/utils";
import { TextHighlighter } from "./text-highlighter";
import { AdvancedPopover } from "../global/popovers";
import { useVirtualizer } from "@tanstack/react-virtual";

const Chapter = ({
  chapter,
  index,
  type,
  onSource,
}: {
  chapter: Chapter;
  index: number;
  type: ContentType;
  onSource: (
    source: number,
    data?: BoundingBoxData | null,
    sourceOrigin?: SourceOrigin,
  ) => void;
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    onSource(
      chapter.source,
      chapter.bbox ? convertStringToBbox(chapter.bbox) : null,
    );
  };

  return (
    <div
      className="p-3 group border border-transparent hover:bg-primary/5 mb-4 rounded-2xl cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start mb-2">
        <Badge
          key={`source-badge-${index}`}
          variant="secondary"
          className="cursor-pointer font-medium rounded-md text-primary/80 bg-neutral-100 dark:bg-neutral-800 hover:text-foreground hover:bg-foreground/10"
        >
          {isDocumentType(type)
            ? `${t("flashcards.page")} ${chapter.source}`
            : formatMilliseconds(chapter.source)}
        </Badge>
      </div>
      <SafeHighlightPopover
        renderPopover={({ selection }: { selection: string }) => (
          <AdvancedPopover text={selection} />
        )}
        offset={{ x: 0, y: -20 }}
        alignment="left"
        zIndex={90}
        minSelectionLength={1}
      >
        <h3 className="text-lg mb-2 text-current line-clamp-1">
          <TextHighlighter text={chapter.heading} />
        </h3>
        <div className="text-sm leading-relaxed mt-2">
          <TextHighlighter text={chapter.summary} className="markdown-body" />
        </div>
      </SafeHighlightPopover>
    </div>
  );
};

const Chapters = ({ type }: { type: ContentType }) => {
  const params = useParams();
  const { onSource } = useSourceStore();
  const { scrollPosition, contentId, setScrollData, resetScroll } =
    useChaptersScrollStore();
  const { t } = useTranslation();
  const { transcript, isRecording, isPending } = useMicStore();
  const currentContentId = params.contentId as string;
  const { data, isLoading, refetch } = useGenerateChapters(currentContentId);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data?.length || 0,
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback(() => 150, []),
    overscan: 10,
  });

  useEffect(() => {
    if (contentId && contentId !== currentContentId) {
      resetScroll();
    }
  }, [contentId, currentContentId, resetScroll]);

  useEffect(() => {
    if (transcript) {
      refetch();
    }
  }, [transcript, refetch]);

  useEffect(() => {
    if (containerRef.current && contentId === currentContentId) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [contentId, currentContentId, scrollPosition]);

  if (
    !isRecording &&
    type === "stt" &&
    (!data || (data && data?.length === 0))
  ) {
    return (
      <div className="flex my-4 justify-center h-full">
        <p className="text-primary/70 mt-6">
          {type === "stt" ? t("chapters.record") : t("chapters.noChapters")}
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4 mt-24">
        <div>
          <span className="text-shimmer">{t("chapters.generating")}</span>
        </div>
      </div>
    );
  }

  const sortedData = data?.length
    ? [...data].sort((a, b) => (a.source > b.source ? 1 : -1))
    : [];

  return (
    <div
      ref={containerRef}
      className="flex-grow overflow-y-auto overscroll-y-none w-full h-full rounded-lg bg-background"
      onScroll={(e) =>
        setScrollData(e.currentTarget.scrollTop, currentContentId)
      }
    >
      {data && data.length > 0 ? (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const chapter = sortedData[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Chapter
                  chapter={chapter}
                  index={virtualRow.index}
                  type={type}
                  onSource={onSource}
                />
              </div>
            );
          })}
        </div>
      ) : isLoading ? (
        <div className="space-y-4 text-center items-center justify-center mt-24">
          <div>
            <span className="text-shimmer">{t("chapters.generating")}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center items-center justify-center mt-24">
          <div>
            <span className="text-shimmer">{t("chapters.generating")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chapters;
