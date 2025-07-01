import { cn } from "@/lib/utils";
import {
  X,
  FileText,
  File,
  FileSpreadsheet,
  Image,
  Video,
  Music,
} from "lucide-react";
import { Button } from "../ui/button";
import { ContentType } from "@/lib/types";

const FileWithRemove = ({
  fileName,
  onRemove,
  type,
}: {
  fileName: string;
  type: ContentType;
  onRemove?: () => void;
}) => {
  const getFileName = (url: string) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split("?")[0];
  };

  const getFileTypeInfo = () => {
    switch (type) {
      case "pdf":
        return {
          icon: FileText,
          label: "PDF",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border",
        };
      case "arxiv":
        return {
          icon: FileText,
          label: "PDF",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border",
        };
      case "docx":
        return {
          icon: FileText,
          label: "PDF",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          borderColor: "border",
        };
      case "pptx":
        return {
          icon: FileText,
          label: "PDF",
          bgColor: "bg-orange-100 dark:bg-orange-900/30",
          iconColor: "text-orange-600 dark:text-orange-400",
          borderColor: "border",
        };
      case "text":
        return {
          icon: FileText,
          label: "PDF",
          bgColor: "bg-teal-100 dark:bg-teal-900/30",
          iconColor: "text-teal-600 dark:text-teal-400",
          borderColor: "border",
        };
      case "video":
        return {
          icon: Video,
          label: "Video",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border",
        };
      case "stt":
      case "audio":
        return {
          icon: Music,
          label: "Audio",
          bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
          iconColor: "text-indigo-600 dark:text-indigo-400",
          borderColor: "border",
        };
      default:
        return {
          icon: File,
          label: "File",
          bgColor: "bg-muted",
          iconColor: "text-muted-foreground",
          borderColor: "border",
        };
    }
  };

  const displayName = getFileName(fileName);
  const fileInfo = getFileTypeInfo();
  const Icon = fileInfo.icon;

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 px-2 py-2 rounded-lg border",
        "bg-background",
        fileInfo.borderColor,
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0",
          fileInfo.bgColor,
        )}
      >
        <Icon className={cn("w-4 h-4", fileInfo.iconColor)} />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
          {displayName}
        </span>
        <span className="text-xs text-muted-foreground uppercase">{type}</span>
      </div>

      {onRemove && (
        <Button
          className={cn(
            "absolute -top-1 -right-1 rounded-full border border-neutral-300 w-4 h-4 p-0 flex items-center justify-center",
            "bg-background hover:bg-foreground/10",
          )}
          type="button"
          size="icon"
          onClick={onRemove}
        >
          <X className="w-3 h-3 text-foreground" />
        </Button>
      )}
    </div>
  );
};

export default FileWithRemove;
