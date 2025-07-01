import { customFetch } from "@/lib/custom-fetch";
import {
  CompleteMultipartUploadFile,
  InitMultipartUploadFile,
  UploadFile,
} from "@/lib/types";

export const uploadContent = async (
  userId: string,
  mimeType: string,
): Promise<UploadFile> => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
    true,
    undefined,
    [400],
  );

  const content: UploadFile = await response.json();
  return content;
};

export const initMultipartUpload = async (
  userId: string,
  mimeType: string,
  fileSize: number,
  keyPrefix: string,
  useAccelerate: boolean = false,
): Promise<InitMultipartUploadFile> => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
    file_size: fileSize,
    key_prefix: keyPrefix,
    use_accelerate: useAccelerate,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/multipart/init`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
  );

  return (await response.json()) as InitMultipartUploadFile;
};

export const completeMultipartUpload = async (
  userId: string,
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
): Promise<CompleteMultipartUploadFile> => {
  const data = {
    user_id: userId,
    upload_id: uploadId,
    key: key,
    parts: parts,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/multipart/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
  );

  return (await response.json()) as CompleteMultipartUploadFile;
};

export const uploadChatImage = async (
  userId: string,
  mimeType: string,
): Promise<UploadFile> => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/chat_image`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
    true,
    undefined,
    [400],
  );

  const content: UploadFile = await response.json();
  return content;
};

export const uploadAudio = async (userId: string, mimeType: string) => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/audio`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
  );

  return response.json();
};

export const uploadFeedback = async (userId: string, mimeType: string) => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
    true,
    undefined,
    [400],
  );

  return response.json();
};

export const uploadExamReference = async (userId: string, mimeType: string) => {
  const data = {
    user_id: userId,
    mime_type: mimeType,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/exam`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
    true,
    undefined,
    [400],
  );

  return response.json();
};
