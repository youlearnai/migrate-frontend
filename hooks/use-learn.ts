import { useTabStore } from "@/hooks/use-tab";
import { LearnStore, WebsocketEvent } from "@/lib/types";
import { getWebsocketUrl } from "@/lib/utils";
import { WavRecorder, WavStreamPlayer } from "@/lib/wavtools/index.js";
import { RealtimeClient } from "@openai/realtime-api-beta";
import { ItemType } from "@openai/realtime-api-beta/dist/lib/client.js";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { useModalStore } from "./use-modal-store";

export const useLearnStore = create<LearnStore>((set, get) => {
  const clientRef = { current: null as RealtimeClient | null };
  const wavRecorderRef = { current: null as WavRecorder | null };
  const wavStreamPlayerRef = { current: null as WavStreamPlayer | null };

  const initializeRefs = (
    userId: string,
    contentId: string,
    spaceId: string,
    chatbotType: string,
    queryClient: QueryClient,
  ) => {
    const wsUrl = `${getWebsocketUrl()}/ws?user_id=${userId}&content_id=${contentId}`;
    clientRef.current = new RealtimeClient({
      url: wsUrl,
    });

    if (!wavRecorderRef.current) {
      wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    }

    if (!wavStreamPlayerRef.current) {
      wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });
    }

    const handleError = (event: Error) => {};

    const handleInterrupted = async () => {
      const trackSampleOffset = await wavStreamPlayerRef.current?.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await clientRef.current?.cancelResponse(trackId, offset);
      }
    };

    const handleConversationUpdated = async ({
      item,
      delta,
    }: {
      item: ItemType;
      delta: {
        audio?: Uint8Array;
        text?: string;
      };
    }) => {
      if (!clientRef.current || !wavStreamPlayerRef.current) {
        return;
      }

      if (delta?.audio) {
        wavStreamPlayerRef.current.add16BitPCM(delta.audio, item.id);
      }

      if (
        "status" in item &&
        item.status === "completed" &&
        item.formatted.audio?.length
      ) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000,
        );
        item.formatted.file = wavFile;
      }

      const items = clientRef.current.conversation.getItems();
      set({ items });
    };

    const handleServerEvent = async (event: WebsocketEvent) => {
      switch (event.type) {
        case "updated_chat_history":
          queryClient.invalidateQueries({
            queryKey: ["chatHistory", chatbotType, contentId, spaceId],
          });
          break;
        case "voice_limit_warning":
          toast.warning("Your session is ending soon");
          queryClient.invalidateQueries({
            queryKey: ["voiceChatLimit"],
          });
          break;
        case "voice_limit_reached":
          toast.error("Voice limit reached");
          await get().disconnectConversation();
          set({ isLearnMode: false });
          set({ minimized: false });
          queryClient.invalidateQueries({
            queryKey: ["voiceChatLimit"],
          });
          const { setCurrentTab } = useTabStore.getState();
          const { onOpen } = useModalStore.getState();
          setCurrentTab("chat");
          onOpen("voiceLimit");
          break;
        case "tool_call_start":
          set({ isLoading: true, concepts: [] });
          break;
        case "tool_call_end":
          set({ isLoading: false });
          handleToolCallEnd(event);
          break;
        default:
          break;
      }
    };

    const handleToolCallEnd = (event: WebsocketEvent) => {
      switch (event.function) {
        case "retrieve_content_sections":
          set({
            concepts: event.output.key_concepts,
          });
          break;
        case "retrieve_content_information":
          set({
            concepts: event.output.key_concepts,
          });
          break;
        case "update_whiteboard":
          set({
            whiteboard: event.output.whiteboard,
          });
          break;
        default:
          break;
      }
    };

    if (clientRef.current) {
      clientRef.current.on("error", handleError);
      clientRef.current.on("conversation.interrupted", handleInterrupted);
      clientRef.current.on("conversation.updated", handleConversationUpdated);
      clientRef.current.on(
        "realtime.event",
        ({
          time,
          source,
          event,
        }: {
          time: string;
          source: string;
          event: WebsocketEvent;
        }) => {
          // Custom events for handling server events
          if (source === "server") {
            handleServerEvent(event);
          }
        },
      );
    }
  };

  return {
    minimized: false,
    setMinimized: (minimized: boolean) => set({ minimized }),
    isLearnMode: false,
    setIsLearnMode: (isLearnMode: boolean) => set({ isLearnMode }),
    isConnected: false,
    setIsConnected: (isConnected: boolean) => set({ isConnected }),
    isMuted: false,
    setIsMuted: (isMuted: boolean) => set({ isMuted }),
    items: [] as ItemType[],
    setItems: (items: ItemType[]) => set({ items }),
    clientRef,
    wavRecorderRef,
    wavStreamPlayerRef,
    concepts: null,
    whiteboard: null,
    isLoading: false,

    connectConversation: async (
      userId: string,
      contentId: string,
      spaceId: string,
      chatbotType: string,
      queryClient: QueryClient,
    ) => {
      try {
        initializeRefs(userId, contentId, spaceId, chatbotType, queryClient);
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (!client || !wavRecorder || !wavStreamPlayer) {
          return;
        }

        await client.connect();

        client.updateSession({
          turn_detection: { type: "server_vad" },
          input_audio_transcription: { model: "whisper-1" },
          modalities: ["text", "audio"],
        });

        await wavRecorder.begin();
        await wavStreamPlayer.connect();

        set({ isConnected: true, isMuted: false });
        const items = client.conversation.getItems();
        set({ items });

        // await client.sendUserMessageContent([
        //   {
        //     type: "input_text",
        //     text: "Respond with just 'Hi!'",
        //   },
        // ]);

        if (client.getTurnDetectionType() === "server_vad") {
          await wavRecorder.record((data: { mono: Int16Array }) => {
            const store = get();
            if (client.isConnected() && !store.isMuted) {
              client.appendInputAudio(data.mono);
            }
          });
        }
      } catch (error) {
        const store = get();
        await store.disconnectConversation();
      }
    },

    toggleMute: async () => {
      const store = get();
      set({ isMuted: !store.isMuted });
    },

    disconnectConversation: async () => {
      try {
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (wavRecorder) await wavRecorder.end();
        if (wavStreamPlayer) await wavStreamPlayer.interrupt();
        if (client) await client.disconnect();
        set({
          isConnected: false,
          isMuted: false,
          concepts: null,
          whiteboard: null,
        });
      } catch (error) {}
    },

    handleStop: async () => {
      try {
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (wavRecorder) await wavRecorder.end();
        if (wavStreamPlayer) await wavStreamPlayer.interrupt();
        if (client) {
          await client.disconnect();
          client.reset();
          clientRef.current = null;
        }
        set({
          isConnected: false,
          isMuted: false,
          concepts: null,
          whiteboard: null,
        });
      } catch (error) {}
    },
  };
});
