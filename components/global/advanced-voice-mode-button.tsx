import React, { useMemo } from "react";
import { useRoomContext } from "@livekit/components-react";
import { useCreateLivekitConnection } from "@/query-hooks/generation";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import Spinner from "./spinner";
import { Button } from "../ui/button";
import { AudioLines } from "lucide-react";
import { useVoiceChatLimit } from "@/query-hooks/limit";
import { useGetTier, useGetUserIsNew, useUser } from "@/query-hooks/user";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useErrorStore } from "@/hooks/use-error-store";

const AdvancedVoiceModeButton = () => {
  const { t } = useTranslation();
  const params = useParams();
  const contentId = params.contentId as string;
  const spaceId = params.spaceId as string;
  const {
    mutate: createLivekitConnection,
    isPending: isCreatingLivekitConnection,
  } = useCreateLivekitConnection();
  const room = useRoomContext();
  const { data: limitData } = useVoiceChatLimit();
  const { data: tier } = useGetTier();
  const { openModal } = useErrorStore();

  const { data: isNewUser } = useGetUserIsNew();

  const isVoiceLimitReached = useMemo(() => {
    if (!limitData) return false;
    if (limitData.limit === null) return false;
    return limitData?.current_usage >= limitData?.limit;
  }, [limitData, tier, limitData]);

  const handleClick = async () => {
    if (isVoiceLimitReached) {
      toast.error(t("voiceMode.limitReached"));
      openModal(
        {
          status: 402,
          statusText: t("voiceMode.limitReached"),
        },
        {
          source: "advanced-voice-mode-button",
        },
      );
      return;
    }
    createLivekitConnection(
      {
        contentId,
        spaceId,
      },
      {
        onSuccess: async (data) => {
          await room?.connect(
            process.env.NEXT_PUBLIC_LIVEKIT_URL as string,
            data.token,
          );
          await room.localParticipant.setMicrophoneEnabled(true);
        },
      },
    );
  };

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            className={cn(
              "rounded-full p-1.5 space-x-1 h-fit mb-2 relative",
              isNewUser && "px-2",
              isVoiceLimitReached && "cursor-not-allowed opacity-50",
            )}
            title={t("voiceMode.button")}
            aria-label={t("voiceMode.button")}
            disabled={isCreatingLivekitConnection}
          >
            {isCreatingLivekitConnection ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <AudioLines className="h-5 w-5" />
            )}
            {isNewUser && <span className="text-sm">{t("voice")}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("voiceMode.tooltip")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AdvancedVoiceModeButton;
