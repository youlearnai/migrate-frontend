import { WaveControlsProps } from "@/lib/types";
import { Square, Mic, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../global/spinner";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";

const WaveControls: React.FC<WaveControlsProps> = ({
  isRecording,
  isPaused,
  audioLevels,
  mockAudioLevels,
  handleStartRecording,
  resumeRecording,
  pauseRecording,
  endRecording,
  isPending,
  isBrowserTabAudio = false,
}) => {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className="flex items-center overflow-hidden space-x-2 justify-between w-full ">
        <div className="flex space-x-2 items-center">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={isPending}
              variant="default"
              size="sm"
              className="text-sm font-medium bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-500 dark:text-red-300 flex items-center gap-2"
            >
              {isPending ? (
                <Spinner />
              ) : (
                <>
                  <div className="h-2.5 w-2.5 rounded-full bg-current" />
                  <div key={t("record.start")}>
                    {isBrowserTabAudio
                      ? t("record.startBrowserTab", {
                          defaultValue: "Start Browser Tab Recording",
                        })
                      : t("record.start")}
                  </div>
                </>
              )}
            </Button>
          ) : (
            <div className="flex space-x-2">
              {!isPaused ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={pauseRecording}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto w-auto rounded-lg bg-blue-400/10 hover:bg-blue-400/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors"
                    >
                      <Pause
                        size={20}
                        className="text-blue-500/60 hover:text-blue-400 dark:text-blue-500/80 dark:hover:text-blue-500"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {t("record.pause", { defaultValue: "Pause recording" })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={resumeRecording}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto w-auto rounded-lg bg-green-400/10 hover:bg-green-400/20 dark:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors"
                    >
                      <Play
                        size={20}
                        className="text-green-500/60 hover:text-green-400 dark:text-green-500/80 dark:hover:text-green-500"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {t("record.resume", { defaultValue: "Resume recording" })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={endRecording}
                    variant="ghost"
                    size="sm"
                    className="p-2 h-auto w-auto rounded-lg bg-red-400/10 hover:bg-red-400/20 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <Square
                      size={20}
                      className="text-red-500/60 hover:text-red-400 dark:text-red-500/80 dark:hover:text-red-500"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("record.stop", { defaultValue: "Stop recording" })}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="flex items-center h-6 flex-grow mx-2">
          <AnimatePresence initial={false}>
            {(isRecording || isPaused ? audioLevels : mockAudioLevels).map(
              (level, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "w-[3px] rounded-full mx-[3px]",
                    isRecording && !isPaused
                      ? "bg-green-400 dark:bg-[#7DFF97]"
                      : "bg-primary/20 dark:bg-primary/30",
                    isPaused && "bg-primary/20 dark:bg-primary/30",
                  )}
                  initial={{ height: 0 }}
                  animate={{
                    height: isRecording
                      ? level < 75
                        ? level / (9 - level / 10)
                        : level * (1 + (level - 75) / 200)
                      : level,
                  }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.1 }}
                />
              ),
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WaveControls;
