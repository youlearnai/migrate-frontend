import VoiceSkeleton from "@/components/skeleton/voice-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearnStore } from "@/hooks/use-learn";
import { useSourceStore } from "@/hooks/use-source-store";
import { useTabStore } from "@/hooks/use-tab";
import { ContentType } from "@/lib/types";
import { convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Maximize, Mic, MicOff, Minimize, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WavRenderer } from "./wav-renderer";
import { isDocumentType } from "@/lib/utils";

const Voice = ({
  mini,
  contentType,
  showContent,
}: {
  mini?: boolean;
  contentType: ContentType;
  showContent: boolean;
}) => {
  const { t } = useTranslation();
  const { setCurrentTab } = useTabStore();
  const {
    setIsLearnMode,
    isConnected,
    isMuted,
    handleStop,
    toggleMute,
    setItems,
    wavRecorderRef,
    wavStreamPlayerRef,
    setMinimized,
    concepts,
    whiteboard,
    isLoading,
  } = useLearnStore();

  const { theme } = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const { onSource } = useSourceStore();
  const queryClient = useQueryClient();

  const setupAudioAnalysis = async () => {
    try {
      // Clean up existing context if any
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Create new context and analyzer
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Get media stream first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Double check context still exists after async operation
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }
    } catch (err) {
      console.error("Error in setupAudioAnalysis:", err);
      // Clean up on error
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      if (isConnected && !isMuted && mounted) {
        await setupAudioAnalysis();
      }
    };

    initAudio();

    return () => {
      mounted = false;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [isConnected, isMuted]);

  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true;
    let animationFrameId: number;

    const render = () => {
      if (isLoaded) {
        const clientCanvas = clientCanvasRef.current;
        const serverCanvas = serverCanvasRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (clientCanvas && wavRecorder) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width =
              clientCanvas.offsetWidth * window.devicePixelRatio;
            clientCanvas.height =
              clientCanvas.offsetHeight * window.devicePixelRatio;
            clientCanvas.style.width = `${clientCanvas.offsetWidth}px`;
            clientCanvas.style.height = `${clientCanvas.offsetHeight}px`;
          }
          // const clientCtx = clientCanvas.getContext("2d");
          // if (clientCtx) {
          //   clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
          //   try {
          //     const result =
          //       !isMuted && isConnected
          //         ? wavRecorder.getFrequencies("voice")
          //         : { values: new Float32Array([0]) };
          //     WavRenderer.drawBars(
          //       clientCanvas,
          //       clientCtx,
          //       result.values,
          //       theme === "dark" ? "#3CB371" : "#22c55e",
          //       mini ? 12 : 3,
          //       24,
          //       mini ? 24 : 12,
          //     );
          //   } catch (error) {
          //     console.error("Error getting recorder frequencies:", error);
          //   }
          // }
        }

        if (serverCanvas && wavStreamPlayer) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width =
              serverCanvas.offsetWidth * window.devicePixelRatio;
            serverCanvas.height =
              serverCanvas.offsetHeight * window.devicePixelRatio;
            serverCanvas.style.width = `${serverCanvas.offsetWidth}px`;
            serverCanvas.style.height = `${serverCanvas.offsetHeight}px`;
          }
          const serverCtx = serverCanvas.getContext("2d");
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            try {
              const result = wavStreamPlayer.analyser
                ? wavStreamPlayer.getFrequencies("voice")
                : { values: new Float32Array([0]) };

              const isQuiet =
                result.values.reduce((sum, value) => sum + value, 0) /
                  result.values.length <
                0.005;

              const themeColor = theme === "dark" ? "#FFFFFF" : "#000000";

              // Get or create dots container
              let dotsContainer = serverCanvas.parentElement?.querySelector(
                ".dots-container",
              ) as HTMLElement;
              if (!dotsContainer) {
                dotsContainer = document.createElement("div");
                dotsContainer.className = `dots-container flex items-center justify-center ${
                  mini ? "gap-2 pl-20" : "gap-8 left-1/2"
                } absolute ${
                  mini ? "top-[50%]" : "sm:top-[20%] top-[25%]"
                } -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 transition-opacity duration-150 ease-in-out`;
                dotsContainer.innerHTML = `
                  <div class="${mini ? "w-4 h-4" : "w-8 h-8"} rounded-full animate-[scale_2s_ease-in-out_infinite]" style="background-color: ${themeColor}"></div>
                  <div class="${mini ? "w-4 h-4" : "w-8 h-8"} rounded-full animate-[scale_2s_ease-in-out_0.5s_infinite]" style="background-color: ${themeColor}"></div>
                  <div class="${mini ? "w-4 h-4" : "w-8 h-8"} rounded-full animate-[scale_2s_ease-in-out_1s_infinite]" style="background-color: ${themeColor}"></div>
                `;
                serverCanvas.parentElement?.appendChild(dotsContainer);
              }

              // Toggle visibility instead of removing/adding elements
              if (isQuiet) {
                serverCanvas.style.opacity = "0";
                dotsContainer.style.opacity = "1";
              } else {
                serverCanvas.style.opacity = "1";
                dotsContainer.style.opacity = "0";

                // Position the canvas in the same place as the dots
                serverCanvas.style.position = "absolute";
                serverCanvas.style.left = mini ? "unset" : "50%";
                serverCanvas.style.paddingLeft = mini ? "5rem" : "0";
                serverCanvas.style.top = mini
                  ? "50%"
                  : window.innerWidth >= 640
                    ? "20%"
                    : "25%";
                serverCanvas.style.transform = "translate(-50%, -50%)";

                WavRenderer.drawBars(
                  serverCanvas,
                  serverCtx,
                  result.values,
                  themeColor,
                  mini ? 3 : 3,
                  mini ? 12 : 40,
                  mini ? 10 : 20,
                );
              }
            } catch (error) {
              console.error("Error getting player frequencies:", error);
            }
          }
        }

        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isLoaded = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isConnected,
    isMuted,
    wavRecorderRef.current,
    wavStreamPlayerRef.current,
    theme,
  ]);

  const onStop = async () => {
    // Store the current minimized state before stopping
    const wasMinimized = mini;
    localStorage.setItem("voiceModeMinimized", wasMinimized ? "true" : "false");

    await handleStop();
    queryClient.invalidateQueries({
      queryKey: ["voiceChatLimit"],
    });
    setItems([]);
    setCurrentTab("chat");
    setIsLearnMode(false);
    setMinimized(false);
  };

  const handleMinimize = () => {
    setCurrentTab("chat");
    setMinimized(true);
  };

  const handleExpand = () => {
    setCurrentTab("voice");
    setMinimized(false);
  };

  if (mini) {
    return (
      <div className="relative mt-4">
        <Button
          variant="ghost"
          className="absolute flex items-center rounded-b-none gap-2 -top-8 -right-0 px-4 h-8 bg-background border border-b-0 shadow-sm"
          onClick={handleExpand}
        >
          <Maximize className="h-3.5 w-3.5" />
          <span className="text-xs">{t("voiceMode.expand")}</span>
        </Button>
        <div className="flex rounded-tr-none p-2 w-full items-center transition-all duration-150 border rounded-2xl focus-within:border">
          {!isConnected ? (
            <VoiceSkeleton mini />
          ) : (
            <div className="flex-1 flex items-center min-w-0">
              <div className="flex-1 min-w-0 flex gap-2 mr-3">
                <canvas
                  ref={serverCanvasRef}
                  className="w-fit h-14 transition-opacity duration-150 ease-in-out flex-shrink"
                />
                <canvas
                  ref={clientCanvasRef}
                  className="w-fit h-14 flex-shrink"
                />
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {isMuted ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full h-12 w-12 bg-foreground hover:bg-foreground/80"
                    onClick={toggleMute}
                    disabled={!isConnected}
                  >
                    <MicOff className="h-5 w-5 text-primary-foreground" />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full h-12 w-12 hover:bg-foreground/20"
                    onClick={toggleMute}
                    disabled={!isConnected}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-12 w-12 text-muted-foreground hover:bg-foreground/20"
                  onClick={onStop}
                >
                  <X className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:h-[calc(100vh-150px)] relative items-center h-full flex flex-col">
      <div className="absolute top-0 right-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="flex items-center gap-2 text-xs"
        >
          <Minimize className="h-3.5 w-3.5" />
          <span>{t("voiceMode.minimize")}</span>
        </Button>
      </div>

      {!isConnected ? (
        <VoiceSkeleton />
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center flex-col w-full max-w-2xl mx-auto px-4 mb-4">
            <canvas
              ref={serverCanvasRef}
              className="w-fit h-fit transition-opacity duration-150 ease-in-out"
            />
          </div>

          {(concepts || isLoading) && (
            <div className="relative flex flex-col items-center w-full sm:mb-8 text-center md:h-[calc(100vh-150px-24rem)]">
              <div className="h-[25%] md:h-[30%]" />
              <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                {concepts && concepts.length > 0 ? (
                  concepts.slice(0, 3).map((concept, index) => (
                    <div
                      className="flex items-center gap-3"
                      key={`concept-${index}`}
                    >
                      <p className="text-md font-medium lg:text-lg">
                        {concept.concept}
                      </p>
                      <Badge
                        key={`source-badge-${index}`}
                        variant="secondary"
                        className="cursor-pointer font-medium rounded-sm text-foreground/80 bg-foreground/5 hover:text-foreground hover:bg-foreground/10"
                        onClick={(e) =>
                          onSource(
                            concept.source,
                            concept.bbox
                              ? convertStringToBbox(concept.bbox)
                              : undefined,
                          )
                        }
                      >
                        {isDocumentType(contentType)
                          ? `${t("flashcards.page")} ${concept.source}`
                          : formatMilliseconds(concept.source)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center w-full"
                      >
                        <Skeleton className="h-8 w-1/2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* {whiteboard && (
        <div className="flex flex-col items-center w-full justify-center gap-2 mb-8 text-center">
          <Markdown className="text-lg font-medium">{whiteboard}</Markdown>
        </div>
      )} */}

      <div
        className={`${
          showContent ? (isDocumentType(contentType) ? "h-36" : "h-56") : "h-36"
        } flex items-end justify-end relative z-10`}
      >
        <div className="flex flex-row items-center gap-8 text-center max-w-md mx-auto px-4">
          {isMuted ? (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full h-12 w-12 bg-foreground hover:bg-foreground/80"
              onClick={toggleMute}
              disabled={!isConnected}
            >
              <MicOff className="h-5 w-5 text-primary-foreground" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full h-12 w-12 hover:bg-foreground/20"
              onClick={toggleMute}
              disabled={!isConnected}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full h-12 w-12 text-muted-foreground hover:bg-foreground/20"
            onClick={onStop}
          >
            <X className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>
      <div className="flex items-center h-12 mb-4 w-full max-w-[200px] justify-center gap-4">
        <canvas ref={clientCanvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Voice;
