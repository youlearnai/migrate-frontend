import { customFetch } from "@/lib/custom-fetch";
import { TTSCacheResponse } from "@/lib/types";

export const checkTTSCache = async (
  userId: string,
  hash: string,
): Promise<TTSCacheResponse> => {
  const data = {
    hash: hash,
    user_id: userId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/utils/tts/cache/get`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  return await response.json();
};

export const storeTTSCache = async (
  userId: string,
  hash: string,
  audioUrl: string,
) => {
  const data = {
    user_id: userId,
    audio_url: audioUrl,
    hash: hash,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/utils/tts/cache`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );
  return await response.json();
};
