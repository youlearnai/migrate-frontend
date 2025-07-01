import {
  getAllowedFileAccepts,
  getAllowedFileTypeDescriptions,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const MAX_FILES = 10;

const DropOverlay = ({
  dropFiles,
}: {
  dropFiles: (files: FileList) => void;
}) => {
  const { t } = useTranslation();
  const [isDragValid, setIsDragValid] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      setIsDragOver(true);
    };

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      const items = event.dataTransfer?.items;
      if (items) {
        let hasValidItem = false;
        for (const item of items) {
          const isSupported = getAllowedFileAccepts().includes(item.type);
          if (isSupported) {
            hasValidItem = true;
            break;
          }
        }
        setIsDragValid(hasValidItem);
      }
      setIsDragOver(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      if (!event.relatedTarget || event.relatedTarget === document.body) {
        setIsDragOver(false);
        setIsDragValid(true);
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      setIsDragValid(true);

      const droppedFiles = event.dataTransfer?.files;

      if (!droppedFiles) return;
      if (droppedFiles.length > MAX_FILES) {
        toast.error(t("magicBar.maxFiles", { files: MAX_FILES }));
        return;
      }

      dropFiles(droppedFiles);
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [t]);

  if (!isDragOver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl p-12 text-center">
        <Upload
          className={cn(
            "mx-auto mb-6 h-16 w-16",
            !isDragValid && "text-red-800 dark:text-destructive",
          )}
        />
        <h2
          className={cn(
            "mb-2 text-2xl font-semibold",
            !isDragValid && "text-red-800 dark:text-destructive",
          )}
        >
          {isDragValid
            ? t("magicBar.dropPdfHere")
            : t("magicBar.unsupportedFileType", {
                defaultValue: "Unsupported file type",
              })}
        </h2>
        <p
          className={cn(
            "text-primary/80",
            !isDragValid && "text-red-800 dark:text-destructive",
          )}
        >
          {isDragValid
            ? getAllowedFileTypeDescriptions().join(", ")
            : t("magicBar.supportedFileTypes", {
                defaultValue:
                  getAllowedFileTypeDescriptions().join(", ") + " only",
              })}
        </p>
      </div>
    </div>
  );
};

export default DropOverlay;
