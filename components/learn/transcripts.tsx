"use client";
import { useMicStore } from "@/hooks/use-mic-store";
import { useSourceStore } from "@/hooks/use-source-store";
import { BackendError, ContentType, Transcript } from "@/lib/types";
import { formatMilliseconds } from "@/lib/utils";
import { SafeHighlightPopover } from "./safe-highlight-popover";
import { useTranslation } from "react-i18next";
import { AdvancedPopover } from "../global/popovers";
import { Skeleton } from "../ui/skeleton";
import { TextHighlighter } from "./text-highlighter";
import { isAudioType, isVideoType } from "@/lib/utils";

const Transcripts = ({
  data,
  error,
  isError,
  type,
}: {
  data: Transcript[] | undefined;
  error: BackendError | null;
  isError: boolean;
  type: ContentType;
}) => {
  const { t } = useTranslation();
  const { isRecording, isPending } = useMicStore();
  const { onSource } = useSourceStore();

  if (isError || error)
    return (
      <div className="w-full flex my-8 pb-6 justify-center overflow-y-auto overscroll-y-none">
        <div className="w-full 2xl:max-w-5xl max-w-4xl px-4">
          <div className="flex items-center h-full gap-3 justify-center mt-4">
            <p className="text-xl">
              {error!.message || `${t("errorModal.defaultTitle")}`}
            </p>
          </div>
        </div>
      </div>
    );

  if (!isRecording && type === "stt" && data && data?.length === 0) {
    return (
      <div className="flex my-4 justify-center h-full">
        <p className="text-primary/70 mt-6">
          {type === "stt"
            ? t("transcripts.record")
            : t("transcripts.noTranscripts")}
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-40" />
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg bg-background overflow-y-auto overscroll-y-none px-4 sm:px-0">
      <div className="">
        {data && data?.length > 0
          ? data?.map((item, index) => (
              <div
                key={index}
                className="p-3 group border border-transparent hover:bg-primary/5 mb-4 rounded-2xl cursor-pointer"
                onClick={() => onSource(item?.source)}
              >
                <p className="text-current/90 opacity-95 text-sm mb-2 text-primary/80 group-hover:underline">
                  {isVideoType(type) || isAudioType(type)
                    ? formatMilliseconds(item?.source)
                    : item?.source}
                </p>
                <h3 className="text-sm leading-relaxed text-primary/95">
                  <SafeHighlightPopover
                    renderPopover={({ selection }: { selection: string }) => (
                      <AdvancedPopover text={selection} />
                    )}
                    offset={{ x: 0, y: -20 }}
                    alignment="left"
                    zIndex={90}
                    minSelectionLength={1}
                  >
                    <TextHighlighter text={item?.page_content} />
                  </SafeHighlightPopover>
                </h3>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default Transcripts;
