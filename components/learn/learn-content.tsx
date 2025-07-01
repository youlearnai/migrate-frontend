import { useSourceStore } from "@/hooks/use-source-store";
import { useGetContent } from "@/query-hooks/content";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { LearnContentSkeleton } from "../skeleton/learn-skeleton";
import WaveForm from "./wave-form";
import WavePlayer from "./wave-player";
import { isAudioType, isDocumentType, isVideoType } from "@/lib/utils";
import { ContentType } from "@/lib/types";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("./pdf-viewer"), { ssr: false });

const LearnContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { source, lastUpdated, onSource } = useSourceStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const { setCurrentSource } = useCurrentSourceStore();
  const [hasHandledUrlSource, setHasHandledUrlSource] = useState(false);

  const playerRef = useRef<ReactPlayer>(null);
  const wavePlayerRef = useRef<{ seekTo: (time: number) => void }>(null);

  const isBrowserTabAudio = searchParams.get("browserTabAudio") === "true";
  const urlSource = searchParams.get("source");

  const { data, isLoading: dataLoading } = useGetContent(
    params.spaceId as string | undefined,
    params.contentId as string,
  );

  useEffect(() => {
    if (urlSource && !hasHandledUrlSource && data?.content_url) {
      const sourceValue = parseFloat(urlSource);
      if (!isNaN(sourceValue)) {
        onSource(sourceValue);
        setHasHandledUrlSource(true);

        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("source");
        const newUrl = `${window.location.pathname}${newParams.toString() ? "?" + newParams.toString() : ""}`;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [
    urlSource,
    hasHandledUrlSource,
    data?.content_url,
    onSource,
    searchParams,
    router,
  ]);

  const seekToTime = useCallback(
    (time: number | string) => {
      const parsedTime = typeof time === "string" ? parseFloat(time) : time;
      if (isVideoType(data?.type as ContentType) && playerRef.current) {
        playerRef.current.seekTo(parsedTime, "seconds");
        setIsPlaying(true);
      } else if (
        isAudioType(data?.type as ContentType) &&
        wavePlayerRef.current
      ) {
        wavePlayerRef.current.seekTo(parsedTime);
      }
    },
    [data?.type],
  );

  useEffect(() => {
    let isSubscribed = true;

    if (source !== null) {
      if (
        isVideoType(data?.type as ContentType) ||
        isAudioType(data?.type as ContentType)
      ) {
        seekToTime(source);
      } else if (isDocumentType(data?.type as ContentType)) {
        setCurrentSource(Number(source) - 1);
      }
    }

    return () => {
      isSubscribed = false;
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
      if (wavePlayerRef.current) {
        wavePlayerRef.current.seekTo(0);
      }
    };
  }, [source, data?.type, seekToTime, lastUpdated]);

  if (!data || dataLoading) return <LearnContentSkeleton />;

  const fileUrl =
    data.type === "arxiv"
      ? data.content_url.replace(".pdf", "")
      : data.content_url;

  return (
    <div key="learn-content-root">
      <div key="content-container" className="md:rounded-md overflow-hidden">
        {isVideoType(data?.type as ContentType) && (
          <div key="video-player" className="aspect-video">
            <ReactPlayer
              key="video-player"
              ref={playerRef}
              url={data.content_url}
              height="100%"
              width="100%"
              controls
              muted
              playing={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onSeek={() => setIsPlaying(true)}
              onProgress={(progress) => {
                setCurrentSource(progress.playedSeconds);
              }}
              loop={false}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                  forceVideo: true,
                },
              }}
            />
          </div>
        )}
        {isDocumentType(data?.type) && (
          <div
            key="pdf-viewer"
            className={`w-full h-[50dvh] md:h-[calc(100vh-85px)]`}
          >
            <PDFViewer key="pdf-native-viewer" fileUrl={fileUrl} />
          </div>
        )}
        <div
          key="wave-container"
          className={`rounded-xl relative mb-2 sm:mb-4 md:mb-0`}
        >
          <div
            key="wave-inner-container"
            className="border-secondary/20 rounded-lg items-center h-full relative overflow-hidden"
          >
            {data.type === "audio" ||
            (data.type === "stt" &&
              data.content_url !== "stt" &&
              data.content_url !== null) ? (
              <WavePlayer
                key="wave-player"
                ref={wavePlayerRef}
                audioUrl={data.content_url}
              />
            ) : data.type === "stt" ? (
              <WaveForm key="wave-form" isBrowserTabAudio={isBrowserTabAudio} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LearnContent);
