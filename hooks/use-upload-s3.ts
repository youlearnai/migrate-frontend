import { PartETag, UploadFile } from "@/lib/types";
import { useState } from "react";
import {
  useInitMultipartUpload,
  useCompleteMultipartUpload,
} from "@/query-hooks/upload";

export const useS3Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const { mutateAsync: initMultipartUpload } = useInitMultipartUpload();
  const { mutateAsync: completeMultipartUpload } = useCompleteMultipartUpload();

  const uploadFileToS3 = async (
    file: Blob,
    params: UploadFile,
    useMultipart = false,
  ): Promise<string | null> => {
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("key", params.fields.key);
    formData.append("x-amz-algorithm", params.fields["x-amz-algorithm"]);
    formData.append("x-amz-credential", params.fields["x-amz-credential"]);
    formData.append("x-amz-date", params.fields["x-amz-date"]);
    formData.append("policy", params.fields.policy);
    formData.append("Content-Type", params.fields["Content-Type"]);
    formData.append("x-amz-signature", params.fields["x-amz-signature"]);
    formData.append("file", file, (file as File)?.name || "file");

    return new Promise<string | null>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const cleanUrl = params.url.endsWith("/")
            ? params.url.slice(0, -1)
            : params.url;
          const publicUrl = `${cleanUrl}/${params.fields.key}`;
          setIsUploading(false);
          setProgress(100);
          // Reset progress after a short delay to show completion
          setTimeout(() => setProgress(0), 100);
          resolve(publicUrl);
        } else {
          const errorText = xhr.responseText;
          console.error("Upload failed:", errorText);
          setError(errorText);
          setIsUploading(false);
          reject(new Error(errorText));
        }
      });

      xhr.addEventListener("error", () => {
        const errorMessage = "Network error occurred during upload";
        setError(errorMessage);
        setIsUploading(false);
        reject(new Error(errorMessage));
      });

      xhr.addEventListener("abort", () => {
        const errorMessage = "Upload was aborted";
        setError(errorMessage);
        setIsUploading(false);
        reject(new Error(errorMessage));
      });

      try {
        setIsUploading(true);
        xhr.open("POST", params.url);
        xhr.send(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setIsUploading(false);
        const cleanUrl = params.url.endsWith("/")
          ? params.url.slice(0, -1)
          : params.url;
        const publicUrl = `${cleanUrl}/${params.fields.key}`;
        resolve(publicUrl);
      }
    });
  };

  const uploadMultipartToS3 = async (
    file: Blob,
    params: UploadFile,
    useAccelerate: boolean = false,
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setProgress(0);

      const keyParts = params.fields.key.split("/");
      const keyPrefix = keyParts.join("/");

      const initResult = await initMultipartUpload({
        mimeType: params.fields["Content-Type"],
        fileSize: file.size,
        keyPrefix: keyPrefix,
        useAccelerate,
      });

      const {
        upload_id: uploadId,
        key,
        part_urls: parts,
        chunk_size: chunkSize,
      } = initResult;

      const partPromises: Promise<void>[] = [];
      const partETags: PartETag[] = [];
      const totalParts = Math.ceil(file.size / chunkSize);
      const partProgress: number[] = new Array(totalParts).fill(0);

      for (let i = 0; i < totalParts; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        const chunkActualSize = end - start;

        const uploadPartPromise = new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              partProgress[i] = event.loaded;
              const totalUploaded = partProgress.reduce(
                (sum, bytes) => sum + bytes,
                0,
              );
              const percentComplete = Math.round(
                (totalUploaded / file.size) * 100,
              );
              setProgress(percentComplete);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader("ETag");
              partETags[i] = {
                PartNumber: i + 1,
                ETag: etag?.replace(/"/g, "") || "",
              };
              partProgress[i] = chunkActualSize;
              const totalUploaded = partProgress.reduce(
                (sum, bytes) => sum + bytes,
                0,
              );
              const percentComplete = Math.round(
                (totalUploaded / file.size) * 100,
              );
              setProgress(percentComplete);
              resolve();
            } else {
              reject(new Error(`Failed to upload part ${i + 1}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error(`Network error uploading part ${i + 1}`));
          });

          xhr.open("PUT", parts[i].url);
          xhr.send(chunk);
        });

        partPromises.push(uploadPartPromise);
      }

      await Promise.all(partPromises);

      const completeResult = await completeMultipartUpload({
        key: key,
        uploadId,
        parts: partETags,
      });

      setProgress(100);
      // Reset progress after a short delay to show completion
      setTimeout(() => setProgress(0), 100);
      return completeResult?.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFileToS3,
    isUploading,
    error,
    uploadMultipartToS3,
    progress,
  };
};
