import React from "react";
import {
  BarVisualizer,
  TrackReferenceOrPlaceholder,
  TrackToggle,
  useDataChannel,
  useLocalParticipant,
  usePersistentUserChoices,
  useRemoteParticipants,
  useTrackToggle,
  useVoiceAssistant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "../ui/button";
import { Mic, MicOff, X } from "lucide-react";
import { useDisconnectButton } from "@livekit/components-react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdvancedVoiceSkeleton } from "../skeleton/voice-skeleton";
import { useErrorStore } from "@/hooks/use-error-store";
import { Track } from "livekit-client";
import { useCustomChatLoadingStore } from "@/hooks/use-custom-chat-loading-store";

const processedChatHistoryIds = new Set<string>();
const processedSubscriptionTierIds = new Set<string>();
const processedMessageStartIds = new Set<string>();

// Define custom CSS for the buttons
const buttonStyles = `
  .voice-control-button {
    background-color: rgba(0, 0, 0, 0.05) !important;
  }
  .voice-control-button:hover {
    background-color: rgba(0, 0, 0, 0.1) !important;
  }
  .dark .voice-control-button {
    background-color: rgba(255, 255, 255, 0.05) !important;
  }
  .dark .voice-control-button:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
`;

const AdvancedVoice = () => {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const queryClient = useQueryClient();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const contentId = params.contentId as string;
  const queryKey = [
    "chatHistory",
    spaceId ? "space" : "content",
    contentId,
    spaceId,
  ];
  const { buttonProps: disconnectButtonProps } = useDisconnectButton({
    className:
      "rounded-full h-12 w-12 text-muted-foreground hover:bg-foreground/20",
  });
  const { openModal } = useErrorStore();
  const participants = useRemoteParticipants();
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  const { setIsLoading, setType } = useCustomChatLoadingStore();

  const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);

  const { saveAudioInputEnabled } = usePersistentUserChoices({
    preventSave: false,
  });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) => {
      if (isUserInitiated) {
        saveAudioInputEnabled(enabled);
      }
    },
    [saveAudioInputEnabled],
  );

  useDataChannel("chat_history_updated", (msg) => {
    if (!msg.payload) return;

    const decoded = new TextDecoder().decode(msg.payload);

    if (processedChatHistoryIds.has(decoded)) {
      return;
    }

    processedChatHistoryIds.add(decoded);

    queryClient.invalidateQueries({ queryKey });
    setType("message");
    setIsLoading(false);
  });

  useDataChannel("subscription_tier_limit", (msg) => {
    if (!msg.payload) return;

    const decoded = new TextDecoder().decode(msg.payload);

    if (processedSubscriptionTierIds.has(decoded)) {
      return;
    }

    openModal(
      {
        status: 402,
        statusText: "Payment Required",
        service: "chat_voice",
      },
      {
        source: "advanced-voice-subscription-tier-limit",
      },
    );
    queryClient.invalidateQueries({
      queryKey: ["voiceChatLimit"],
    });
    setIsLoading(false);
  });

  useDataChannel("message_start", (msg) => {
    if (!msg.payload) return;

    const decoded = new TextDecoder().decode(msg.payload);

    if (processedMessageStartIds.has(decoded)) {
      return;
    }

    processedMessageStartIds.add(decoded);

    setType("message");
    setIsLoading(true);
  });

  const { enabled, buttonProps: microphoneButtonProps } = useTrackToggle({
    source: Track.Source.Microphone,
    onChange: microphoneOnChange,
    className: "rounded-full h-12 w-12 bg-primary/5 hover:bg-foreground/20",
  });

  if (
    participants &&
    participants.length > 0 &&
    !participants[0]?.isMicrophoneEnabled
  ) {
    return <AdvancedVoiceSkeleton />;
  }

  return (
    <div className="h-[82px] flex w-full justify-between mt-4 px-4 border overflow-y-auto rounded-2xl">
      <style>{buttonStyles}</style>
      <div className="w-fit">
        <BarVisualizer
          state={agentState}
          barCount={3}
          trackRef={audioTrack}
          className="agent-visualizer"
          options={{ minHeight: 24 }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <BarVisualizer trackRef={micTrackRef} barCount={3} />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="voice-control-button rounded-full h-12 w-12"
            onClick={(e) => {
              // We need to manually handle the click since we're not using the buttonProps directly
              if (microphoneButtonProps.onClick) {
                microphoneButtonProps.onClick(e);
              }
            }}
          >
            {enabled ? (
              <Mic className="h-5 w-5 text-primary" />
            ) : (
              <MicOff className="h-5 w-5 text-primary" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="voice-control-button rounded-full h-12 w-12"
            onClick={(e) => {
              // We need to manually handle the click since we're not using the buttonProps directly
              if (disconnectButtonProps.onClick) {
                disconnectButtonProps.onClick(e);
                queryClient.invalidateQueries({
                  queryKey: ["voiceChatLimit"],
                });
                setType("message");
                setIsLoading(false);
              }
            }}
          >
            <X className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVoice;
