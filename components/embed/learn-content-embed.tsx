"use client";
import { useSourceStore } from "@/hooks/use-source-store";
import { useGetContent } from "@/query-hooks/content";
import { useParams, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import WaveForm from "@/components/learn/wave-form";
import WavePlayer from "@/components/learn/wave-player";
import { cn, isAudioType, isDocumentType, isVideoType } from "@/lib/utils";
import { ContentType } from "@/lib/types";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import dynamic from "next/dynamic";
import {
  Loader2,
  FileText,
  Video,
  Music,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import EmbedWatermark from "./watermark";
import { getAppBaseUrl } from "@/lib/domains";

const PDFViewer = dynamic(() => import("@/components/learn/pdf-viewer"), {
  ssr: false,
  loading: () => <LoadingState type="document" />,
});

const LoadingState = ({ type }: { type: "video" | "document" | "audio" }) => {
  const icons = {
    video: <Video className="w-12 h-12 text-neutral-400" />,
    document: <FileText className="w-12 h-12 text-neutral-400" />,
    audio: <Music className="w-12 h-12 text-neutral-400" />,
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {icons[type]}
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        <p className="text-sm text-neutral-500">Loading content...</p>
      </div>
    </div>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  const params = useParams();
  const contentId = params.contentId;
  const spaceId = params.spaceId;

  const youLearnLink = () => {
    const base = getAppBaseUrl();
    if (spaceId) {
      return `${base}/learn/space/${spaceId}/content/${contentId}`;
    }
    return `${base}/learn/content/${contentId}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-8">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="p-4 bg-red-100 rounded-full">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-red-900">
            Unable to load content
          </h3>
          <p className="text-sm text-red-700">
            {message ||
              "We couldn't load this content. It may have been moved or deleted."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <a
            href={youLearnLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
          >
            <ExternalLink className="w-4 h-4" />
            Open in YouLearn
          </a>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 hover text-neutral-700 font-medium rounded-lg border border-neutral-300 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

const LearnContentEmbed = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { source, lastUpdated } = useSourceStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const { setCurrentSource } = useCurrentSourceStore();
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<ReactPlayer>(null);
  const wavePlayerRef = useRef<{ seekTo: (time: number) => void }>(null);

  const isBrowserTabAudio = searchParams.get("browserTabAudio") === "true";

  const {
    data,
    isLoading,
    error: fetchError,
  } = useGetContent(
    params.spaceId as string | undefined,
    params.contentId as string,
  );

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
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
      if (wavePlayerRef.current) {
        wavePlayerRef.current.seekTo(0);
      }
    };
  }, [source, data?.type, seekToTime, lastUpdated, setCurrentSource]);

  if (fetchError || error) {
    return (
      <ErrorState
        message={fetchError?.message || error || "An unexpected error occurred"}
      />
    );
  }

  if (!data || isLoading) {
    return <LoadingState type="document" />;
  }

  const fileUrl =
    data.type === "arxiv"
      ? data.content_url.replace(".pdf", "")
      : data.content_url;

  return (
    <div className="h-full flex flex-col rounded-lg shadow-sm overflow-hidden w-full">
      {/* Header Bar */}
      <div className="pb-1 flex justify-between items-center">
        <h1 className="text-sm font-medium truncate">
          {data.title || "Untitled Content"}
        </h1>
        <EmbedWatermark />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isVideoType(data?.type as ContentType) && (
          <div className="h-full w-full flex items-center justify-center">
            <ReactPlayer
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
              onError={(e) => setError("Failed to load video")}
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
          <div className="w-full h-full">
            <PDFViewer fileUrl={fileUrl} />
          </div>
        )}

        {(data.type === "audio" ||
          (data.type === "stt" &&
            data.content_url !== "stt" &&
            data.content_url !== null)) && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-2xl rounded-lg shadow-sm p-6">
              <WavePlayer ref={wavePlayerRef} audioUrl={data.content_url} />
            </div>
          </div>
        )}

        {data.type === "stt" && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-2xl rounded-lg shadow-sm p-6">
              <WaveForm isBrowserTabAudio={isBrowserTabAudio} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LearnContentEmbed);
