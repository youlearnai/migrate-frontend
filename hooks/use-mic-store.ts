import { MicState } from "@/lib/types";
import { create } from "zustand";

export const useMicStore = create<MicState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  transcript: null,
  isPending: false,
  selectedDevice: null,
  hasPermission: null,
  audioDevices: [],
  isSystemAudio: false,

  setIsRecording: (value) =>
    set((state) => ({
      isRecording: value,
      transcript: value ? null : state.transcript,
    })),
  setIsPaused: (value) => set({ isPaused: value }),
  setTranscript: (value) => set({ transcript: value }),
  setIsPending: (value) => set({ isPending: value }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setHasPermission: (value) => set({ hasPermission: value }),
  setAudioDevices: (devices) => set({ audioDevices: devices }),
  setIsSystemAudio: (value) => set({ isSystemAudio: value }),

  requestMicrophoneAccess: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      set({ hasPermission: true });
      get().getAudioDevices();
    } catch (error) {
      console.error("Error requesting microphone access:", error);
      set({ hasPermission: false });
    }
  },

  getAudioDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput",
      );
      set({ audioDevices: audioInputs });

      // Set default device if available
      const defaultDevice = audioInputs.find(
        (device) => device.deviceId === "default",
      );
      if (defaultDevice) {
        set({ selectedDevice: defaultDevice });
      } else if (audioInputs.length > 0) {
        set({ selectedDevice: audioInputs[0] });
      }
    } catch (error) {
      console.error("Error getting audio devices:", error);
    }
  },
}));
