import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  ForwardedRef,
  useImperativeHandle,
} from "react";
import { Play, Pause } from "lucide-react";
import { cn, formatMilliseconds } from "@/lib/utils";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTranslation } from "react-i18next";

const WavePlayer = forwardRef(
  (
    { audioUrl }: { audioUrl: string },
    ref: ForwardedRef<{ seekTo: (time: number) => void }>,
  ) => {
    const { currentSource, setCurrentSource } = useCurrentSourceStore();
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [numBars, setNumBars] = useState(120);
    const [smoothCurrentTime, setSmoothCurrentTime] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const speedOptions = [
      { value: 0.5, label: "0.5x" },
      { value: 0.75, label: "0.75x" },
      { value: 1, label: "1x" },
      { value: 1.25, label: "1.25x" },
      { value: 1.5, label: "1.5x" },
    ];

    useEffect(() => {
      if (audioUrl) {
        analyzeAudio(audioUrl);
      }
    }, [audioUrl, numBars]);

    useEffect(() => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      }
    }, [isPlaying]);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
      }
    }, [playbackRate]);

    useEffect(() => {
      if (containerRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const width = entry.contentRect.width;
            const barSpacing = 4;
            const barWidth = 4;
            const totalBarWidth = barWidth + barSpacing;
            setNumBars(Math.floor(width / totalBarWidth));
          }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
          resizeObserver.disconnect();
        };
      }
    }, []);

    const analyzeAudio = async (url: string) => {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / numBars);
      const waveform = [];

      for (let i = 0; i < numBars; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j]);
        }
        waveform.push(sum / blockSize);
      }

      const multiplier = Math.pow(Math.max(...waveform), -1);
      setWaveformData(waveform.map((n) => n * multiplier));
    };

    const drawWaveform = () => {
      if (canvasRef.current && waveformData.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const padding = 20;

        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = (canvas.offsetHeight + padding * 2) * dpr;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr - padding * 2;
        const barSpacing = 4;
        const barWidth = 4; // Fixed bar width
        const centerY = height / 2 + padding;
        const cornerRadius = Math.min(barWidth / 2, 2);
        const minBarHeight = 2;
        const amplitudeMultiplier = 2;

        const playedRatio = smoothCurrentTime / duration;

        const isDarkMode = document.documentElement.classList.contains("dark");

        const playedColor = isDarkMode ? "#7DFF97" : "#4ade80";
        const unplayedColor = isDarkMode ? "#333333" : "#d4d4d8";
        const totalBarWidth = barWidth + barSpacing;
        const visibleBars = Math.floor(width / totalBarWidth);

        for (let i = 0; i < visibleBars; i++) {
          const x = i * totalBarWidth;
          const dataIndex = Math.floor((i / visibleBars) * waveformData.length);
          const rawBarHeight =
            waveformData[dataIndex] * height * amplitudeMultiplier;
          const barHeight = Math.max(rawBarHeight, minBarHeight);
          const barTop = centerY - barHeight / 2;
          const barBottom = centerY + barHeight / 2;

          const barStartRatio = i / visibleBars;
          ctx.fillStyle =
            playedRatio > barStartRatio ? playedColor : unplayedColor;

          ctx.beginPath();
          if (cornerRadius > 0 && barHeight > cornerRadius * 2) {
            ctx.moveTo(x + cornerRadius, barTop);
            ctx.arcTo(
              x + barWidth,
              barTop,
              x + barWidth,
              barTop + cornerRadius,
              cornerRadius,
            );
            ctx.arcTo(
              x + barWidth,
              barBottom,
              x + barWidth - cornerRadius,
              barBottom,
              cornerRadius,
            );
            ctx.arcTo(x, barBottom, x, barBottom - cornerRadius, cornerRadius);
            ctx.arcTo(x, barTop, x + cornerRadius, barTop, cornerRadius);
          } else {
            ctx.rect(x, barTop, barWidth, barHeight);
          }
          ctx.fill();
        }

        const playbackX = playedRatio * width;
        ctx.fillStyle = isDarkMode
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(playbackX - 1, 0, 2, canvas.height / dpr);
      }
    };

    useEffect(() => {
      drawWaveform();
    }, [waveformData, smoothCurrentTime]);

    const handleWaveformMouseDown = (
      e: React.MouseEvent<HTMLCanvasElement>,
    ) => {
      setIsDragging(true);
      setWasPlayingBeforeDrag(isPlaying);
      if (isPlaying) {
        setIsPlaying(false);
        audioRef.current?.pause();
      }
      handleWaveformInteraction(e);
    };

    const handleWaveformMouseMove = (
      e: React.MouseEvent<HTMLCanvasElement>,
    ) => {
      if (isDragging) {
        handleWaveformInteraction(e);
      }
    };

    const handleWaveformMouseUp = () => {
      setIsDragging(false);
      if (wasPlayingBeforeDrag) {
        setIsPlaying(true);
        audioRef.current?.play();
      }
    };

    const handleWaveformMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        if (wasPlayingBeforeDrag) {
          setIsPlaying(true);
          audioRef.current?.play();
        }
      }
    };

    const handleWaveformInteraction = (
      e: React.MouseEvent<HTMLCanvasElement>,
    ) => {
      if (canvasRef.current && audioRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickPosition = x / rect.width;
        const newTime = clickPosition * duration;
        setCurrentSource(newTime);
        setSmoothCurrentTime(newTime);
        audioRef.current.currentTime = newTime;
      }
    };

    useEffect(() => {
      const updateSmoothTime = () => {
        if (audioRef.current && isPlaying) {
          setSmoothCurrentTime((prevTime) => {
            const targetTime = audioRef.current!.currentTime;
            return prevTime + (targetTime - prevTime) * 0.1;
          });
          animationFrameRef.current = requestAnimationFrame(updateSmoothTime);
        }
      };

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothTime);
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isPlaying]);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.addEventListener("loadedmetadata", () => {
          const endTime = audioRef?.current?.duration!;
          setCurrentSource(endTime);
          setSmoothCurrentTime(endTime);
          drawWaveform();
        });
      }
    }, []);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentSource(time);
          setSmoothCurrentTime(time);
        }
      },
    }));

    if (!waveformData?.length)
      return <Skeleton className="w-full h-12 rounded-md" />;

    return (
      <TooltipProvider>
        <div
          className="w-full bg-neutral-50 dark:bg-primary/5 rounded-lg p-4"
          ref={containerRef}
        >
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="focus:outline-none p-2 rounded-lg bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause
                      size={20}
                      className="text-primary/60 hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary"
                    />
                  ) : (
                    <Play
                      size={20}
                      className="text-primary/60 hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary"
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isPlaying
                    ? t("record.pause", { defaultValue: "Pause recording" })
                    : t("record.resume", { defaultValue: "Resume recording" })}
                </p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-grow">
              <canvas
                ref={canvasRef}
                onMouseDown={handleWaveformMouseDown}
                onMouseMove={handleWaveformMouseMove}
                onMouseUp={handleWaveformMouseUp}
                onMouseLeave={handleWaveformMouseLeave}
                className="w-full h-8 cursor-pointer"
              />
            </div>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none px-2 py-1 rounded-md bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-xs text-primary/70 hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary w-fit text-center">
                      {
                        speedOptions.find(
                          (option) => option.value === playbackRate,
                        )?.label
                      }
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("record.speed", { defaultValue: "Playback speed" })}</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="center"
                className="min-w-full space-y-1"
              >
                {speedOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setPlaybackRate(option.value)}
                    className={cn(
                      "text-center w-full justify-center",
                      playbackRate === option.value
                        ? "bg-primary/10 text-primary"
                        : "",
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="text-sm text-primary/70 w-10 text-center whitespace-nowrap">
              {formatMilliseconds(Math.floor(currentSource))}
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (audioRef.current) {
                const currentTime = audioRef.current.currentTime;
                setCurrentSource(currentTime);
                setCurrentSource(currentTime);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            hidden
          />
        </div>
      </TooltipProvider>
    );
  },
);

export default WavePlayer;
