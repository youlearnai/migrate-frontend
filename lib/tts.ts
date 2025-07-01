import { PlayerState } from "./types";
class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private isFirstChunk = true;
  private state: PlayerState = "idle";
  private nextStartTime = 0;
  private completionPromise: Promise<void> | null = null;
  private completionResolver: (() => void) | null = null;
  private hasReceivedChunks = false;
  private wasManuallyStopped = false;
  private totalSourcesCreated = 0;
  private totalSourcesEnded = 0;
  private audioChunks: ArrayBuffer[] = [];
  private captureEnabled = false;
  private onAudioComplete?: (audioBlob: Blob) => void;
  private listeners = new Set<() => void>();
  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new AudioContext();
    }
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
  setState(newState: PlayerState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.notify();
    }
  }
  getState(): PlayerState {
    return this.state;
  }
  async playChunk(pcmData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      return;
    }
    if (this.captureEnabled) {
      this.audioChunks.push(pcmData.slice(0));
    }
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32Array.length,
      44100,
    );
    audioBuffer.getChannelData(0).set(float32Array);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    const currentTime = this.audioContext.currentTime;
    if (this.isFirstChunk) {
      this.completionPromise = new Promise((resolve) => {
        this.completionResolver = resolve;
      });
      source.start(0);
      this.nextStartTime = currentTime + audioBuffer.duration;
      this.isFirstChunk = false;
      this.setState("playing");
      this.hasReceivedChunks = true;
    } else {
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    }
    this.sources.push(source);
    this.totalSourcesCreated++;
    source.onended = () => {
      const index = this.sources.indexOf(source);
      if (index > -1) {
        this.sources.splice(index, 1);
      }
      this.totalSourcesEnded++;
      if (
        this.sources.length === 0 &&
        this.totalSourcesCreated > 0 &&
        this.totalSourcesCreated === this.totalSourcesEnded
      ) {
        this.setState("idle");
        if (
          this.completionResolver &&
          this.hasReceivedChunks &&
          !this.wasManuallyStopped
        ) {
          if (
            this.captureEnabled &&
            this.audioChunks.length > 0 &&
            this.onAudioComplete
          ) {
            const audioBlob = this.createWavBlob(this.audioChunks);
            this.onAudioComplete(audioBlob);
          }
          this.completionResolver();
          this.completionResolver = null;
        }
      }
    };
  }
  stop(): void {
    this.wasManuallyStopped = true;
    this.setState("stopping");
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.sources = [];
    if (this.completionResolver) {
      this.completionResolver();
      this.completionResolver = null;
    }
    this.isFirstChunk = true;
    this.setState("idle");
    this.nextStartTime = 0;
    this.hasReceivedChunks = false;
    this.wasManuallyStopped = false;
    this.totalSourcesCreated = 0;
    this.totalSourcesEnded = 0;
    this.audioChunks = [];
    this.captureEnabled = false;
  }
  getIsPlaying(): boolean {
    return this.state === "playing";
  }
  onComplete(): Promise<void> {
    if (!this.completionPromise && !this.hasReceivedChunks) {
      this.completionPromise = new Promise((resolve) => {
        this.completionResolver = resolve;
      });
    }
    return this.completionPromise || Promise.resolve();
  }
  enableCapture(onComplete: (audioBlob: Blob) => void): void {
    this.captureEnabled = true;
    this.onAudioComplete = onComplete;
    this.audioChunks = [];
  }
  private createWavBlob(chunks: ArrayBuffer[]): Blob {
    let totalLength = 0;
    chunks.forEach((chunk) => {
      totalLength += chunk.byteLength;
    });
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + totalLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, totalLength, true);
    const wavBuffer = new Uint8Array(44 + totalLength);
    wavBuffer.set(new Uint8Array(header), 0);
    let offset = 44;
    chunks.forEach((chunk) => {
      wavBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    });
    return new Blob([wavBuffer], { type: "audio/wav" });
  }
}
class WebSocketTTSClient {
  private ws: WebSocket | null = null;
  private player: StreamingAudioPlayer;
  private contextId: string;
  private isActive: boolean = true;
  constructor() {
    this.player = new StreamingAudioPlayer();
    this.contextId = this.generateContextId();
  }
  private generateContextId(): string {
    return (
      "ctx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11)
    );
  }
  async connect(): Promise<void> {
    const response = await fetch("/api/tts/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "init" }),
    });
    if (!response.ok) {
      throw new Error("Failed to get TTS token");
    }
    const { wsUrl } = await response.json();
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        resolve();
      };
      this.ws.onerror = (error) => {
        this.player.setState("idle");
        reject(error);
      };
      this.ws.onmessage = async (event) => {
        if (!this.isActive) {
          return;
        }
        const message = JSON.parse(event.data);
        if (message.type === "chunk") {
          const audioData = this.base64ToArrayBuffer(message.data);
          await this.player.playChunk(audioData);
        } else if (message.type === "done" || message.type === "complete") {
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
        }
      };
    });
  }
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  async generateSpeech(text: string): Promise<void> {
    this.player.setState("loading");
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connect();
      }
    } catch (error) {
      this.player.setState("idle");
      throw error;
    }
    const request = {
      model_id: "sonic-english",
      transcript: text,
      voice: {
        mode: "id",
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
      },
      context_id: this.contextId,
      output_format: {
        container: "raw",
        encoding: "pcm_s16le",
        sample_rate: 44100,
      },
    };
    this.ws!.send(JSON.stringify(request));
  }
  stop(): void {
    this.isActive = false;
    this.player.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  getPlayer(): StreamingAudioPlayer {
    return this.player;
  }
}
export class TTSSession {
  private client: WebSocketTTSClient;
  private player: StreamingAudioPlayer;
  private sessionId: string;
  constructor() {
    this.client = new WebSocketTTSClient();
    this.player = this.client.getPlayer();
    this.sessionId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  getId(): string {
    return this.sessionId;
  }
  subscribe(listener: () => void): () => void {
    return this.player.subscribe(listener);
  }
  getState(): PlayerState {
    return this.player.getState();
  }
  async start(text: string): Promise<void> {
    await this.client.generateSpeech(text);
  }
  stop(): void {
    this.player.stop();
    this.client.stop();
  }
  getIsPlaying(): boolean {
    return this.player.getIsPlaying();
  }
  getPlayer(): StreamingAudioPlayer {
    return this.player;
  }
  enableCapture(onComplete: (audioBlob: Blob) => void): void {
    this.player.enableCapture(onComplete);
  }
  onComplete(): Promise<void> {
    return this.player.onComplete();
  }
}
const activeSessions = new Map<string, TTSSession>();
let activeAudioElement: HTMLAudioElement | null = null;
export async function playTTS(
  text: string,
  options?: {
    onCapture?: (blob: Blob) => void;
    onStateChange?: (state: PlayerState) => void;
  },
): Promise<string> {
  stopAll();
  const session = new TTSSession();
  const sessionId = session.getId();
  activeSessions.set(sessionId, session);
  if (options?.onCapture) {
    session.enableCapture(options.onCapture);
  }
  if (options?.onStateChange) {
    const unsubscribe = session.subscribe(() => {
      options.onStateChange!(session.getState());
      if (session.getState() === "idle") {
        activeSessions.delete(sessionId);
        unsubscribe();
      }
    });
  }
  try {
    await session.start(text);
    return sessionId;
  } catch (error) {
    activeSessions.delete(sessionId);
    throw error;
  }
}
export async function playCachedAudio(
  url: string,
  options?: {
    onStateChange?: (state: "loading" | "playing" | "idle") => void;
  },
): Promise<void> {
  stopAll();
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    activeAudioElement = audio;
    if (options?.onStateChange) {
      options.onStateChange("loading");
    }
    audio.oncanplaythrough = () => {
      if (options?.onStateChange) {
        options.onStateChange("playing");
      }
    };
    audio.onended = () => {
      activeAudioElement = null;
      if (options?.onStateChange) {
        options.onStateChange("idle");
      }
      resolve();
    };
    audio.onerror = (error) => {
      activeAudioElement = null;
      if (options?.onStateChange) {
        options.onStateChange("idle");
      }
      reject(error);
    };
    audio.play().catch(reject);
  });
}
export function stopAll(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement = null;
  }
  activeSessions.forEach((session) => {
    session.stop();
  });
  activeSessions.clear();
}
export async function generateTTS(text: string): Promise<TTSSession> {
  const session = new TTSSession();
  await session.start(text);
  return session;
}
export { StreamingAudioPlayer as TTSPlayer };
