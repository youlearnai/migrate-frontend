import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModalStore } from "@/hooks/use-modal-store";
import { cn } from "@/lib/utils";
import { useVoiceChatLimit } from "@/query-hooks/limit";
import { useTranslation } from "react-i18next";

const LIMIT_THRESHOLD = 50;
const SHOW_LIMIT_THRESHOLD = 70;

const VoiceLimit = () => {
  const { onOpen } = useModalStore();
  const { t } = useTranslation();
  const { data: voiceChatLimit } = useVoiceChatLimit();

  if (!voiceChatLimit || voiceChatLimit.limit === 0) return null;

  const percentage = Number(
    Math.min(
      (voiceChatLimit.current_usage / voiceChatLimit.limit) * 100,
      100,
    ).toFixed(2),
  );

  const size = 32;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (percentage / 100) * circumference;
  const gap = circumference - dash;

  const handleRequestClick = () => {
    onOpen("voiceLimit");
  };

  if (percentage <= SHOW_LIMIT_THRESHOLD) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="relative w-8 h-8">
            <svg width={size} height={size}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-muted"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  percentage >= 70 ? "stroke-destructive" : "stroke-primary",
                )}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  percentage === 100 ? "text-[8px]" : "text-[10px]",
                  "font-semibold",
                  percentage >= 70
                    ? "text-destructive dark:text-red-500"
                    : "text-primary",
                )}
              >
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">{t("voiceLimit.limit")}</div>
            {percentage === 100 ? (
              <div className="text-muted-foreground">
                {t("voiceLimit.limitReached")}{" "}
                <span
                  onClick={handleRequestClick}
                  className="cursor-pointer text-green-500 dark:text-[#7DFF97]/100 hover:text-green-600 dark:hover:text-[#7DFF97]"
                >
                  {t("voiceLimit.request")}
                </span>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-1">
                <span>{percentage}% used</span>
                {percentage >= LIMIT_THRESHOLD && (
                  <span
                    onClick={handleRequestClick}
                    className="cursor-pointer text-green-500 dark:text-[#7DFF97]/100 hover:text-green-600 dark:hover:text-[#7DFF97]"
                  >
                    {t("voiceLimit.feedback")}
                  </span>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VoiceLimit;
