import {
  uploadAudio,
  uploadChatImage,
  uploadContent,
  uploadExamReference,
  uploadFeedback,
  initMultipartUpload,
  completeMultipartUpload,
} from "@/endpoints/upload";
import useAuth from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

export const useUploadContent = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mimeType }: { mimeType: string }) =>
      await uploadContent(user?.uid ? user?.uid! : "anonymous", mimeType),
    mutationKey: ["uploadContent"],
  });
};

export const useInitMultipartUpload = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mimeType,
      fileSize,
      keyPrefix,
      useAccelerate,
    }: {
      mimeType: string;
      fileSize: number;
      keyPrefix: string;
      useAccelerate?: boolean;
    }) =>
      await initMultipartUpload(
        user?.uid ? user?.uid! : "anonymous",
        mimeType,
        fileSize,
        keyPrefix,
        useAccelerate,
      ),
    mutationKey: ["initMultipartUpload"],
  });
};

export const useCompleteMultipartUpload = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      key,
      uploadId,
      parts,
    }: {
      key: string;
      uploadId: string;
      parts: { PartNumber: number; ETag: string }[];
    }) =>
      await completeMultipartUpload(
        user?.uid ? user?.uid! : "anonymous",
        key,
        uploadId,
        parts,
      ),
    mutationKey: ["completeMultipartUpload"],
  });
};

export const useUploadChatImage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mimeType }: { mimeType: string }) =>
      await uploadChatImage(user?.uid ? user?.uid! : "anonymous", mimeType),
    mutationKey: ["uploadChatImage"],
  });
};

export const useUploadAudio = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mimeType }: { mimeType: string }) =>
      await uploadAudio(user?.uid ? user?.uid! : "anonymous", mimeType),
    mutationKey: ["uploadAudio"],
  });
};

export const useUploadFeedback = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mimeType }: { mimeType: string }) =>
      await uploadFeedback(user?.uid ? user?.uid! : "anonymous", mimeType),
    mutationKey: ["uploadFeedback"],
  });
};

export const useUploadExamReference = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mimeType }: { mimeType: string }) =>
      await uploadExamReference(user?.uid ? user?.uid! : "anonymous", mimeType),
    mutationKey: ["uploadExamReference"],
  });
};

export const useUrlToBlob = () => {
  return useMutation({
    mutationFn: async ({
      url,
      mimeType,
    }: {
      url: string;
      mimeType: string;
    }) => {
      const response = await fetch("/api/proxy-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url, mimeType: mimeType }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      return response.blob();
    },
    mutationKey: ["uploadPdf"],
  });
};
