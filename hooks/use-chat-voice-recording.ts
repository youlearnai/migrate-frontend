import { useRef, useState, useEffect, useCallback } from "react";
import { WavRecorder } from "@/lib/wavtools/utils/wav_recorder.js";
import { RecordingState } from "@/lib/types";
import { useTranscribeAudio } from "@/query-hooks/stt";

export const useChatVoiceRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");

  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const amplitudeBufferRef = useRef<number[]>([]);
  const frameCountRef = useRef<number>(0);

  const BAR_WIDTH = 3;
  const SILENCE_THRESHOLD = 0.08;
  const MAX_BAR_HEIGHT_RATIO = 0.4;
  const FRAME_SKIP = 3;
  const AMPLITUDE_SCALE = 2;

  const transcribeMutation = useTranscribeAudio();

  useEffect(() => {
    wavRecorderRef.current = new WavRecorder({
      sampleRate: 44100,
      outputToSpeakers: false,
      debug: false,
    });

    return () => {
      if (wavRecorderRef.current) {
        wavRecorderRef.current.quit();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const drawWaveform = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      theme: string | undefined,
    ) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const maxBars = Math.floor(canvas.width / BAR_WIDTH);
      const maxBarHeight = canvas.height * MAX_BAR_HEIGHT_RATIO;

      ctx.strokeStyle = theme === "dark" ? "#4a5568" : "#cbd5e0";
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < maxBars; i++) {
        const x = i * BAR_WIDTH;
        const amplitudeIndex = amplitudeBufferRef.current.length - maxBars + i;

        if (
          amplitudeIndex >= 0 &&
          amplitudeIndex < amplitudeBufferRef.current.length
        ) {
          const amplitude = amplitudeBufferRef.current[amplitudeIndex];

          if (amplitude < SILENCE_THRESHOLD) {
            ctx.fillStyle = theme === "dark" ? "#718096" : "#a0aec0";
            ctx.beginPath();
            ctx.arc(x + BAR_WIDTH / 2, centerY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const barHeight = Math.min(
              amplitude * maxBarHeight * AMPLITUDE_SCALE,
              maxBarHeight,
            );
            ctx.fillStyle = theme === "dark" ? "#ffffff" : "#2d3748";

            ctx.fillRect(x, centerY - barHeight / 2, BAR_WIDTH - 1, barHeight);
          }
        } else {
          ctx.fillStyle = theme === "dark" ? "#4a5568" : "#cbd5e0";
          ctx.beginPath();
          ctx.arc(x + BAR_WIDTH / 2, centerY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [BAR_WIDTH, SILENCE_THRESHOLD, MAX_BAR_HEIGHT_RATIO, AMPLITUDE_SCALE],
  );

  useEffect(() => {
    if (recordingState !== "recording") return;

    const render = () => {
      const canvas = document.querySelector(
        'canvas[data-voice-canvas="true"]',
      ) as HTMLCanvasElement;
      const wavRecorder = wavRecorderRef.current;

      if (canvas && wavRecorder) {
        if (!canvas.width || !canvas.height) {
          canvas.width = canvas.offsetWidth * window.devicePixelRatio;
          canvas.height = canvas.offsetHeight * window.devicePixelRatio;
          canvas.style.width = `${canvas.offsetWidth}px`;
          canvas.style.height = `${canvas.offsetHeight}px`;
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          try {
            frameCountRef.current++;
            const shouldUpdate = frameCountRef.current % FRAME_SKIP === 0;

            if (shouldUpdate) {
              const result = wavRecorder.getFrequencies("voice");
              const frequencies = Array.from(result.values);

              let rawAmplitude =
                frequencies.length > 0
                  ? Math.sqrt(
                      frequencies.reduce((sum, val) => sum + val * val, 0) /
                        frequencies.length,
                    )
                  : 0;

              const amplitude =
                rawAmplitude < SILENCE_THRESHOLD
                  ? 0
                  : Math.min((rawAmplitude - SILENCE_THRESHOLD) * 0.8, 1);

              const maxBars = Math.floor(canvas.width / BAR_WIDTH);
              if (amplitudeBufferRef.current.length >= maxBars) {
                amplitudeBufferRef.current.shift();
              }
              amplitudeBufferRef.current.push(amplitude);
            }

            const theme = document.documentElement.classList.contains("dark")
              ? "dark"
              : "light";
            drawWaveform(ctx, canvas, theme);
          } catch (error) {
            console.error("Error getting recorder frequencies:", error);
          }
        }
      }

      if (recordingState === "recording") {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [recordingState, drawWaveform, BAR_WIDTH, SILENCE_THRESHOLD, FRAME_SKIP]);

  const startRecording = useCallback(async () => {
    try {
      if (!wavRecorderRef.current) return;

      amplitudeBufferRef.current = [];
      frameCountRef.current = 0;
      await wavRecorderRef.current.begin();
      await wavRecorderRef.current.record();
      setRecordingState("recording");
    } catch (err) {
      console.error("Recording start error:", err);
    }
  }, []);

  const stopAndTranscribe = useCallback(
    async (onSuccess: (text: string) => void) => {
      try {
        if (!wavRecorderRef.current || recordingState !== "recording") return;

        setRecordingState("processing");
        const audioData = await wavRecorderRef.current.end();
        const result = await transcribeMutation.mutateAsync(audioData.blob);

        if (result.text) {
          onSuccess(result.text);
        }
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setRecordingState("idle");
      }
    },
    [recordingState, transcribeMutation],
  );

  const cancelRecording = useCallback(async () => {
    try {
      if (!wavRecorderRef.current || recordingState !== "recording") return;

      await wavRecorderRef.current.end();
      setRecordingState("idle");
      amplitudeBufferRef.current = [];
    } catch (err) {
      console.error("Cancel recording error:", err);
      setRecordingState("idle");
    }
  }, [recordingState]);

  return {
    recordingState,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
  };
};
