"use client";
import { getAssemblyToken } from "@/endpoints/stt";
import { useMicStore } from "@/hooks/use-mic-store";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { PRO_RECORDING_MAX_DURATION_SECONDS } from "@/lib/utils";
import { Transcript, TranscriptMap } from "@/lib/types";
import { formatMilliseconds } from "@/lib/utils";
import { useAddSTT, useEndSTT } from "@/query-hooks/content";
import { useUploadAudio } from "@/query-hooks/upload";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeTranscriber, RealtimeTranscript } from "assemblyai";
import { useNavigationGuard } from "next-navigation-guard";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as RecordRTC from "recordrtc";
import { toast } from "sonner";
import Spinner from "../global/spinner";
import WaveControls from "./wave-controls";
import MediaInputDropdown from "../global/media-input-dropdown";
import { Button } from "../ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useLocalStorage } from "usehooks-ts";
import { CircleHelp, Info } from "lucide-react";
import { useErrorStore } from "@/hooks/use-error-store";
import { CustomError } from "@/lib/custom-fetch";
const WARNING_TIMES = [10, 5, 1]; // in minutes

const RECORDING_INSTRUCTIONS_KEY = "hasSeenBrowserTabRecordingInstructions";

type WaveFormProps = {
  isBrowserTabAudio?: boolean;
};

const WaveForm: React.FC<WaveFormProps> = ({ isBrowserTabAudio = false }) => {
  const params = useParams();
  const { openModal: openErrorModal } = useErrorStore();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const realtimeTranscriber = useRef<RealtimeTranscriber | null>(null);
  const recorder = useRef<RecordRTC.RecordRTCPromisesHandler | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const totalDurationRef = useRef<number>(0);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSystemAudioError, setIsSystemAudioError] = useState<boolean>(false);
  const { mutate: addTranscript } = useAddSTT();
  const { mutate: uploadAudio, isPending: isUploading } = useUploadAudio();
  const { mutate: endSTT, isPending: isEndingSTT } = useEndSTT();
  const {
    uploadMultipartToS3,
    isUploading: isUploadingToS3,
    progress: uploadProgress,
  } = useS3Upload();
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const { t } = useTranslation();
  const { onOpen: openModal } = useModalStore();
  const [hasSeenInstructions, setHasSeenInstructions] = useLocalStorage(
    RECORDING_INSTRUCTIONS_KEY,
    false,
  );
  const {
    isRecording,
    isPaused,
    isPending,
    setIsRecording,
    setIsPaused,
    setTranscript,
    setIsPending,
    selectedDevice,
    hasPermission,
    setSelectedDevice,
    isSystemAudio,
    setIsSystemAudio,
  } = useMicStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const maxBars = 100;
  const frameCounterRef = useRef(0);
  const framesPerUpdate = 3;
  const lastUpdateTimeRef = useRef(Date.now());
  const updateThrottleMs = 50;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mockAudioLevels = useMemo(
    () =>
      Array(maxBars)
        .fill(0)
        .map(() => Math.random() * 20),
    [maxBars],
  );

  const maxDurationReachedRef = useRef<boolean>(false);
  const warningShownRefs = useRef(WARNING_TIMES.map(() => false));

  useEffect(() => {
    setIsClient(true);
    // If browser tab audio is enabled, automatically set to system audio
    if (isBrowserTabAudio) {
      setIsSystemAudio(true);
      setSelectedDevice(null);
    }
  }, [isBrowserTabAudio]);

  const setupAudioAnalysis = async (providedStream?: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      try {
        let stream: MediaStream;
        if (providedStream) {
          stream = providedStream;
        } else if (isSystemAudio) {
          // For system audio, we'll get the stream from the screen capture
          // The actual stream will be provided during startTranscription
          return;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: selectedDevice
              ? { deviceId: { exact: selectedDevice.deviceId } }
              : true,
          });
        }

        const source = audioContextRef.current!.createMediaStreamSource(stream);
        source.connect(analyserRef.current!);
      } catch (err) {
        console.error("Error accessing audio:", err);
      }
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current || isPaused) return;

    const now = Date.now();
    if (now - lastUpdateTimeRef.current < updateThrottleMs) {
      requestAnimationFrame(analyzeAudio);
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const newLevel = Math.max(1, (dataArrayRef.current[0] / 420) * 100);

    frameCounterRef.current += 1;
    if (frameCounterRef.current >= framesPerUpdate) {
      setAudioLevels((prevLevels) => {
        const updatedLevels = [newLevel, ...prevLevels.slice(0, maxBars - 1)];
        return updatedLevels;
      });
      frameCounterRef.current = 0;
      lastUpdateTimeRef.current = now;
    }

    requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    if (isRecording && !isPaused) {
      // For browser tab audio resume, pass the existing media stream
      if (isSystemAudio && mediaStream.current) {
        setupAudioAnalysis(mediaStream.current);
      } else {
        setupAudioAnalysis();
      }
      analyzeAudio();
      timerRef.current = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1;
          const timeLeft = PRO_RECORDING_MAX_DURATION_SECONDS - newTime;

          WARNING_TIMES.forEach((minutes, index) => {
            const seconds = minutes * 60;
            if (timeLeft === seconds && !warningShownRefs.current[index]) {
              toast.info(t("recording.minutesLeft", { minutes }));
              warningShownRefs.current[index] = true;
            }
          });

          if (
            newTime >= PRO_RECORDING_MAX_DURATION_SECONDS &&
            !maxDurationReachedRef.current
          ) {
            maxDurationReachedRef.current = true;
            toast.warning(t("recording.maxDurationReached"));
            endTranscription();
            return PRO_RECORDING_MAX_DURATION_SECONDS;
          }
          return newTime;
        });
      }, 1000);
    } else {
      // Only close audio context if not paused (to maintain visualization during pause)
      if (!isPaused && audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, selectedDevice, isSystemAudio]);

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput",
        );
        setSelectedDevice(audioInputs[0]);
      } catch (error) {
        console.error("Error getting audio devices:", error);
      }
    };

    getAudioDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", getAudioDevices);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        getAudioDevices,
      );
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsSystemAudioError(false);
    // If it's a system audio error, reset to start screen instead of retrying
    if (isSystemAudioError) {
      setIsRecording(false);
      setIsPaused(false);
      setCurrentTime(0);
      setAudioLevels([]);
      // Reset audio context if it exists
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } else {
      startTranscription();
    }
  };

  const startTranscription = async () => {
    // Check if this is the first time for browser tab audio
    if (isBrowserTabAudio && !hasSeenInstructions) {
      openModal("recording-instructions");
      setHasSeenInstructions(true);
      setIsLoading(false);
      return; // Exit early, user will need to click start again after closing modal
    }

    setIsLoading(true);
    setError(null);
    setIsSystemAudioError(false);
    warningShownRefs.current = WARNING_TIMES.map(() => false);
    maxDurationReachedRef.current = false;

    const token = await getAssemblyToken();
    if (typeof token !== "string") {
      console.error("Invalid token");
      return;
    }

    realtimeTranscriber.current = new RealtimeTranscriber({
      token,
      sampleRate: 16000,
      endUtteranceSilenceThreshold: 1000,
    });

    const texts: TranscriptMap = {};
    realtimeTranscriber.current.on(
      "transcript",
      (transcriptEvent: RealtimeTranscript) => {
        let msg = "";
        texts[transcriptEvent.audio_start] = transcriptEvent.text;
        const keys = Object.keys(texts)
          .map(Number)
          .sort((a, b) => a - b);
        for (const key of keys) {
          if (texts[key]) {
            msg = texts[key];
          }
        }

        if (transcriptEvent.message_type === "FinalTranscript") {
          const duration = Math.abs(
            transcriptEvent.audio_end - transcriptEvent.audio_start,
          );

          totalDurationRef.current += duration;

          const newTranscript: Transcript = {
            _id: "",
            created_at: new Date().toISOString(),
            content: {
              id: "",
              collection: "",
            },
            page_content: msg.trim(),
            source: totalDurationRef?.current / 1000 || 0,
            metadata: {},
          };

          setTranscript(newTranscript);
          addTranscript({
            contentId: params.contentId as string,
            text: msg.trim(),
            startTime: (transcriptEvent.audio_start || 0) / 1000,
          });
        }
      },
    );

    realtimeTranscriber.current.on("error", (event: Error) => {
      console.error(event);
      realtimeTranscriber.current?.close();
      realtimeTranscriber.current = null;
    });

    realtimeTranscriber.current.on("close", (code: number, reason: string) => {
      realtimeTranscriber.current = null;
    });

    await realtimeTranscriber.current.connect();
    setIsLoading(false);

    try {
      let stream: MediaStream;

      if (isSystemAudio) {
        // Request screen capture with audio
        // Note: We must include video: true because browsers require it for getDisplayMedia
        // but we'll immediately stop the video track to minimize resource usage
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1,
            height: 1,
            frameRate: 1,
          }, // Minimal video requirements
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 44100,
            autoGainControl: false,
            googAutoGainControl: false,
            googNoiseSuppression: false,
            googHighpassFilter: false,
            googTypingNoiseDetection: false,
          } as MediaTrackConstraints,
        } as DisplayMediaStreamOptions);

        // Immediately stop and remove video tracks to save resources
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });

        // Check if we got audio tracks
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error(
            "No audio track found. When sharing, make sure to: 1) Select a source with audio (tab/window/screen), 2) Check 'Share audio' option if available, 3) Choose a source that has audio playing.",
          );
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedDevice
            ? { deviceId: { exact: selectedDevice.deviceId } }
            : true,
        });
      }

      mediaStream.current = stream;

      // Setup audio analysis for system audio after getting the stream
      if (isSystemAudio && stream.getAudioTracks().length > 0) {
        setupAudioAnalysis(stream);
      }

      recorder.current = new RecordRTC.RecordRTCPromisesHandler(stream, {
        type: "audio",
        mimeType: "audio/ogg",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 100,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        bufferSize: 4096,
        audioBitsPerSecond: 32000,
        ondataavailable: async (blob: Blob) => {
          if (!realtimeTranscriber.current) return;
          const buffer = await blob.arrayBuffer();
          realtimeTranscriber?.current?.sendAudio(buffer);
        },
      });
      await recorder?.current.startRecording();
    } catch (err) {
      console.error("Error accessing audio:", err);
      if (isSystemAudio) {
        setError(t("record.errorSystemAudio"));
        setIsSystemAudioError(true);
      } else {
        setError("Microphone access denied");
        setIsSystemAudioError(false);
      }
    }

    setIsRecording(true);
    setIsPaused(false);
  };

  const pauseTranscription = () => {
    if (recorder.current) {
      recorder.current.pauseRecording();
    }
    setIsPaused(true);
  };

  const resumeTranscription = async () => {
    if (recorder.current) {
      await recorder.current.resumeRecording();
    }
    setIsPaused(false);
  };

  const endTranscription = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (event) {
      event.preventDefault();
    }

    setIsPending(true);
    toast.info(t("recording.ended"));

    setIsRecording(false);
    setIsPaused(false);
    setCurrentTime(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (realtimeTranscriber.current) {
      realtimeTranscriber.current.close();
      realtimeTranscriber.current = null;
    }

    if (recorder.current) {
      try {
        await recorder.current.stopRecording();
        const blob = await recorder.current.getBlob();
        if (blob instanceof Blob) {
          await uploadAudioBlob(blob);
        } else {
          console.error("Failed to get a valid Blob from the recorder");
          setError("Failed to create audio URL");
        }
      } catch (err) {
        console.error("Error stopping recording:", err);
        setError("Error stopping recording");
      }
      recorder.current = null;
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
  };

  const uploadAudioBlob = async (blob: Blob) => {
    setIsPending(true);
    const start = new Date();
    uploadAudio(
      {
        mimeType: "audio/wav",
      },
      {
        onSuccess: async (result) => {
          try {
            const url = await uploadMultipartToS3(blob, result, true);
            const s3UploadTime = new Date().getTime() - start.getTime();

            if (url) {
              endSTT(
                {
                  contentId: params.contentId as string,
                  contentUrl: url,
                },
                {
                  onSuccess: async () => {
                    await queryClient.invalidateQueries();
                    setIsPending(false);

                    const end = new Date();
                    posthog.capture("stt_end", {
                      content_id: params.contentId,
                      total_time_taken: end.getTime() - start.getTime(),
                      s3_upload_time: s3UploadTime,
                    });
                  },
                  onError: (error) => {
                    setError(
                      error instanceof Error ? error.message : String(error),
                    );
                    setIsPending(false);
                    if (error instanceof CustomError) {
                      openErrorModal(
                        {
                          status: error.status === 404 ? 422 : error.status,
                          statusText: error.statusText,
                          message: error.message,
                          service: error.service,
                          title: error.statusText,
                        },
                        undefined,
                        error.status === 404,
                      );
                    }
                  },
                },
              );
            } else {
              posthog.capture("stt_end", {
                content_id: params.contentId,
                error: "Failed to get URL from S3 upload",
              });
              setError("Failed to end transcription");
              setIsPending(false);
            }
          } catch (error) {
            console.error("Error uploading to S3:", error);
            setError(error instanceof Error ? error.message : String(error));
            setIsPending(false);

            posthog.capture("stt_end", {
              content_id: params.contentId,
              error: "Failed to upload to S3",
              error_message:
                error instanceof Error ? error.message : String(error),
              error_stack: error instanceof Error ? error.stack : null,
              s3_upload_time: new Date().getTime() - start.getTime(),
            });
          }
        },
        onError: (error) => {
          console.error("Error getting upload parameters:", error);
          setError(error instanceof Error ? error.message : String(error));
          setIsPending(false);

          posthog.capture("stt_end", {
            content_id: params.contentId,
            error: "Failed to get upload parameters",
            error_message:
              error instanceof Error ? error.message : String(error),
            error_stack: error instanceof Error ? error.stack : null,
          });
        },
      },
    );
  };

  const handleBeforeUnload = () => {
    if (isRecording || isPaused || isPending) {
      return window.confirm(t("beforeunload.warning"));
    }
    return true;
  };

  useNavigationGuard({
    enabled: isRecording || isPaused || isPending,
    confirm: handleBeforeUnload,
  });

  useEffect(() => {
    const handleBeforeUnloadEvent = (event: BeforeUnloadEvent) => {
      if (isRecording || isPaused || isPending) {
        event.preventDefault();
        event.returnValue = t("beforeunload.warning");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnloadEvent);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnloadEvent);
    };
  }, [isRecording, isPaused, isPending, t]);

  if (isUploading || isEndingSTT || isUploadingToS3 || isPending)
    return (
      <div className="rounded-lg">
        <div className="flex w-full h-14 items-center justify-center bg-neutral-50 dark:bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-3 w-full max-w-fit">
            <span className="text-sm">{t("processing")}</span>
            {isUploadingToS3 && uploadProgress > 0 ? (
              <>
                <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {uploadProgress}%
                </span>
              </>
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      </div>
    );

  if (!isClient) return null;

  return (
    <div className="rounded-lg">
      {error ? (
        <div className="text-red-500 m-4 bg-neutral-50 dark:bg-primary/5 rounded-lg p-4">
          <div className="space-y-3">
            <p>{typeof error === "string" ? error : t("error.message")}</p>
            {isSystemAudioError && (
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {t("errorModal.errors.422.secondaryText")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 items-center space-x-2 flex justify-between bg-neutral-50 dark:bg-primary/5 rounded-lg p-4">
          <WaveControls
            isRecording={isRecording}
            isPaused={isPaused}
            isPending={isLoading}
            audioLevels={audioLevels}
            mockAudioLevels={mockAudioLevels}
            handleStartRecording={startTranscription}
            resumeRecording={resumeTranscription}
            pauseRecording={pauseTranscription}
            endRecording={endTranscription}
            isBrowserTabAudio={isBrowserTabAudio}
          />
          <div className="text-base flex w-fit font-normal text-primary/70 dark:text-primary/70 text-right">
            <span>
              {isRecording ? formatMilliseconds(currentTime) : "0:00"}
            </span>
          </div>
        </div>
      )}
      {!isRecording && !isBrowserTabAudio && (
        <div className="flex justify-start pr-2 pb-2">
          <MediaInputDropdown
            onDeviceSelect={(device) => {
              if (device === "system") {
                setIsSystemAudio(true);
                setSelectedDevice(null);
              } else {
                setIsSystemAudio(false);
                setSelectedDevice(device as MediaDeviceInfo);
              }
            }}
          />
        </div>
      )}
      {!isRecording && isBrowserTabAudio && (
        <Button
          onClick={() => openModal("recording-instructions")}
          variant="outline"
          className="flex h-fit justify-start pl-2 items-center gap-2"
        >
          <CircleHelp className="w-4 h-4 cursor-pointer text-primary/70 dark:text-primary/70" />
          <span className="text-sm text-primary/70 dark:text-primary/70">
            {t("help")}
          </span>
        </Button>
      )}
    </div>
  );
};

export default WaveForm;
