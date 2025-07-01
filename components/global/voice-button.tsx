import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuth from "@/hooks/use-auth";
import { useErrorStore } from "@/hooks/use-error-store";
import { useLearnStore } from "@/hooks/use-learn";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTabStore } from "@/hooks/use-tab";
import { useVoiceChatLimit } from "@/query-hooks/limit";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RiMic2Line } from "react-icons/ri";
import { toast } from "sonner";
import ProLabel from "./pro-label";
import VoiceLimit from "./voice-limit";

const LIMIT_THRESHOLD = 50;

const VoiceButton = () => {
  const { t } = useTranslation();
  const {
    isLearnMode,
    setIsLearnMode,
    isConnected,
    connectConversation,
    disconnectConversation,
    handleStop,
    clientRef,
    minimized,
    setMinimized,
  } = useLearnStore();
  const { currentTab, setCurrentTab } = useTabStore();
  const { user } = useAuth();
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: voiceChatLimit } = useVoiceChatLimit();
  const { onOpen } = useModalStore();
  const { openModal } = useErrorStore();

  useEffect(() => {
    const cleanup = async () => {
      if (isConnected) {
        try {
          await handleStop();
          queryClient.invalidateQueries({
            queryKey: [
              "chatHistory",
              params.spaceId ? "space" : "content",
              params.contentId as string,
              params.spaceId as string,
            ],
          });
          // Ensure client is fully reset
          if (clientRef.current) {
            await clientRef.current.disconnect();
            clientRef.current = null;
          }
        } catch (error) {
          // Fallback to simple disconnect if audio cleanup fails
          await disconnectConversation();
        }
        queryClient.invalidateQueries({
          queryKey: ["voiceChatLimit"],
        });
        setCurrentTab("chat");
        setIsLearnMode(false);
        setMinimized(false);
      }
    };
    cleanup();
  }, [params.contentId]);

  const handleLearnMode = async () => {
    if (isLimitReached) {
      toast(t("voiceLimit.title"), {
        description: (
          <div className="text-sm">{t("voiceLimit.higherLimits")} </div>
        ),
      });

      openModal(
        {
          status: 402,
          statusText: "Upgrade to continue",
        },
        {
          source: "voice-button",
        },
      );
      return;
    }
    if (notAvailable) {
      toast(t("voiceLimit.title"), {
        description: (
          <div className="text-sm">{t("voiceLimit.notAvailable")} </div>
        ),
      });

      openModal(
        {
          status: 402,
          statusText: "Upgrade to continue",
        },
        {
          source: "voice-button",
        },
      );
      return;
    }

    if (currentTab === "voice" || minimized) {
      try {
        await handleStop();
        if (clientRef.current) {
          await clientRef.current.disconnect();
          clientRef.current = null;
        }
      } catch (error) {
        await disconnectConversation();
      }
      // Store the current state before closing
      const wasMinimized = minimized;

      setCurrentTab("chat");
      setIsLearnMode(false);
      setMinimized(false);

      // Store the last state in localStorage
      localStorage.setItem(
        "voiceModeMinimized",
        wasMinimized ? "true" : "false",
      );
    } else {
      // Retrieve the last state when reopening
      const lastMinimizedState =
        localStorage.getItem("voiceModeMinimized") === "true";

      if (lastMinimizedState) {
        setCurrentTab("chat");
        setMinimized(true);
      } else {
        setCurrentTab("voice");
        setMinimized(false);
      }

      setIsLearnMode(true);
      if (!isConnected && user?.uid && params.contentId) {
        await connectConversation(
          user.uid,
          params.contentId as string,
          params.spaceId as string,
          params.spaceId ? "space" : "content",
          queryClient,
        );
      }
    }
  };

  const handleRequestClick = () => {
    onOpen("voiceLimit");
  };

  if (!voiceChatLimit) return null;

  const isLimitReached =
    Math.min(
      (voiceChatLimit.current_usage / voiceChatLimit.limit) * 100,
      100,
    ) >= 100;

  const notAvailable = voiceChatLimit.limit === 0;

  const percentage = Number(
    Math.min(
      (voiceChatLimit.current_usage / voiceChatLimit.limit) * 100,
      100,
    ).toFixed(2),
  );

  return (
    <div className="flex items-center flex-row space-x-2">
      <div
        className={`flex items-center flex-row space-x-2 ${
          isLimitReached && "cursor-not-allowed"
        }`}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  variant="primary"
                  size="sm"
                  aria-label="Toggle semibold"
                  className={`rounded-xl font-medium p-2 sm:p-3 flex ${
                    isLimitReached && "cursor-not-allowed opacity-50"
                  }`}
                  pressed={isLearnMode || currentTab === "voice"}
                  onPressedChange={handleLearnMode}
                >
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    {t("voiceMode.button")}
                  </span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div className="font-medium flex items-center gap-2">
                  <span>{t("voiceLimit.title")}</span>
                  {notAvailable && <ProLabel />}
                </div>
                {notAvailable ? (
                  <div className="text-muted-foreground">
                    <span>{t("voiceLimit.notAvailable")}</span>
                  </div>
                ) : isLimitReached ? (
                  <div className="text-muted-foreground">
                    <span>{t("voiceLimit.limitReached")}</span>
                    <span
                      onClick={handleRequestClick}
                      className="cursor-pointer text-green-500 dark:text-[#7DFF97]/100 hover:text-green-600 dark:hover:text-[#7DFF97]"
                    >
                      {t("voiceLimit.request")}
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex items-center gap-1">
                    <span>{t("voiceMode.tooltip")}</span>
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
      </div>
      <VoiceLimit />
    </div>
  );
};

export default VoiceButton;
