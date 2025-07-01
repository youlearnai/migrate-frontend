import { useCallback, useState, useRef, useEffect } from "react";
import { PlayerState, TTSCacheResponse } from "@/lib/types";
import { useCheckTTSCache, useStoreTTSCache } from "@/query-hooks/utils";
import { useUploadAudio } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { useTTSStore } from "@/stores/tts-store";
import { playTTS, playCachedAudio, stopAll, TTSSession } from "@/lib/tts";
import { generateTextHash } from "@/lib/utils";
import { toast } from "sonner";

export function useTTS(content: string, chatId: string) {
  const [state, setState] = useState<PlayerState>("idle");
  const sessionIdRef = useRef<string | null>(null);

  const { activeChatId, setActiveChat } = useTTSStore();
  const { mutateAsync: checkCache } = useCheckTTSCache();
  const { mutate: storeCache } = useStoreTTSCache();
  const { mutate: uploadAudio } = useUploadAudio();
  const { uploadMultipartToS3 } = useS3Upload();

  const isThisChatActive = activeChatId === chatId;
  const isPlaying = state === "playing" && isThisChatActive;
  const isLoading = state === "loading" && isThisChatActive;

  const uploadAndCacheAudioStable = useCallback(
    (audioBlob: Blob, hash: string) => {
      uploadAudio(
        { mimeType: "audio/wav" },
        {
          onSuccess: async (result) => {
            try {
              const url = await uploadMultipartToS3(audioBlob, result, true);
              if (url) {
                storeCache({ hash, audioUrl: url });
              }
            } catch (error) {
              console.error("Failed to upload TTS audio:", error);
            }
          },
          onError: (error) => {
            console.error("Failed to get upload parameters:", error);
          },
        },
      );
    },
    [uploadAudio, uploadMultipartToS3, storeCache],
  );

  const cleanContent = content
    ?.replace(/【[^】]*】/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_~#`]/g, "");

  const play = useCallback(async () => {
    if (isThisChatActive && state !== "idle") {
      stopAll();
      setState("idle");
      setActiveChat(null);
      return;
    }

    if (activeChatId && activeChatId !== chatId) {
      stopAll();
    }

    setState("loading");
    setActiveChat(chatId);

    try {
      const hash = await generateTextHash(cleanContent);
      let cacheResponse: TTSCacheResponse | null = null;

      try {
        cacheResponse = await checkCache({ hash });
      } catch {
        cacheResponse = null;
      }

      if (cacheResponse?.audio_url) {
        await playCachedAudio(cacheResponse.audio_url, {
          onStateChange: (newState: "loading" | "playing" | "idle") => {
            setState(newState as PlayerState);
            if (newState === "playing") {
              setActiveChat(chatId, "cached");
            } else if (newState === "idle") {
              setActiveChat(null);
            }
          },
        });
      } else {
        sessionIdRef.current = await playTTS(cleanContent, {
          onCapture: (audioBlob) => {
            uploadAndCacheAudioStable(audioBlob, hash);
          },
          onStateChange: (newState: PlayerState) => {
            setState(newState === "stopping" ? "idle" : newState);
            if (newState === "playing") {
              setActiveChat(chatId, "tts");
            } else if (newState === "idle" || newState === "stopping") {
              setActiveChat(null);
              sessionIdRef.current = null;
            }
          },
        });
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      toast.error("Failed to play audio");
      setState("idle");
      setActiveChat(null);
      sessionIdRef.current = null;
    }
  }, [
    isThisChatActive,
    state,
    chatId,
    activeChatId,
    cleanContent,
    checkCache,
    uploadAndCacheAudioStable,
    setActiveChat,
  ]);

  const stop = useCallback(() => {
    stopAll();
    setState("idle");
    setActiveChat(null);
    sessionIdRef.current = null;
  }, [setActiveChat]);

  const togglePlay = useCallback(() => {
    if (state === "playing" || state === "loading") {
      stop();
    } else {
      play();
    }
  }, [state, play, stop]);

  useEffect(() => {
    return () => {
      if (activeChatId === chatId) {
        stopAll();
      }
    };
  }, []);

  return {
    state,
    isPlaying,
    isLoading,
    play,
    stop,
    togglePlay,
  };
}

export function useTTSSession() {
  const [session, setSession] = useState<TTSSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { setActiveChat } = useTTSStore();

  const startSession = useCallback(
    async (text: string) => {
      if (session) {
        session.stop();
      }

      const newSession = new TTSSession();
      setSession(newSession);

      newSession.subscribe(() => {
        setIsPlaying(newSession.getIsPlaying());

        if (newSession.getState() === "playing") {
          setActiveChat(newSession.getId(), "tts");
        } else if (newSession.getState() === "idle") {
          setActiveChat(null);
        }
      });

      try {
        await newSession.start(text);
        return newSession;
      } catch (error) {
        console.error("Failed to start TTS session:", error);
        setSession(null);
        throw error;
      }
    },
    [session, setActiveChat],
  );

  const stopSession = useCallback(() => {
    if (session) {
      session.stop();
      setSession(null);
      setIsPlaying(false);
      setActiveChat(null);
    }
  }, [session, setActiveChat]);

  useEffect(() => {
    return () => {
      if (session) {
        session.stop();
      }
    };
  }, [session]);

  return {
    session,
    isPlaying,
    startSession,
    stopSession,
  };
}
