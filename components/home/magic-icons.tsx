"use client";
import { Loader2 } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { CardContent } from "../ui/card";
import { Card } from "../ui/card";
import { cn, IS_IMAGE_ACCEPT } from "@/lib/utils";
import { Upload, Link2, Mic, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getAllowedFileAccepts,
  getAllowedFileTypeDescriptions,
  MAX_SCREENSHOT_SIZE_FOR_CHAT,
} from "@/lib/utils";
import { MagicCardProps } from "@/lib/types";
import { useModalStore } from "@/hooks/use-modal-store";
import {
  useAddContent,
  useStartContentConversation,
  useStartSTT,
} from "@/query-hooks/content";
import { useParams, useRouter } from "next/navigation";
import { useUploadChatImage, useUploadContent } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import DropOverlay from "./drop-overlay";
import { toast } from "sonner";
import { useGetTier } from "@/query-hooks/user";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useMicStore } from "@/hooks/use-mic-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Progress } from "../ui/progress";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { useChat } from "@/query-hooks/generation";
import { useTabStore } from "@/hooks/use-tab";

const MAX_FILES = 10;

const MagicCard: React.FC<MagicCardProps> = ({
  name,
  description,
  icon: Icon,
  onClick,
  onTouchStart,
  isPopular,
  className,
  isLoading,
  isDisabled,
  tooltip,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "rounded-2xl group shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 cursor-pointer transition-all duration-200 relative",
              className,
              isDisabled && "cursor-not-allowed opacity-60",
            )}
            onClick={!isDisabled ? onClick : undefined}
            onTouchStart={!isDisabled ? onTouchStart : undefined}
          >
            {isPopular && (
              <div className="absolute top-2 right-2 dark:text-[#3CB371] text-[#3CB371] text-xs rounded-full px-2 py-0.5 font-normal bg-gradient-to-b from-[#3CB371]/10 to-[#3CB371]/5 dark:from-[#3CB371]/10 dark:to-[#3CB371]/5 backdrop-blur-sm border-t-[0.5px] border-l-[0.5px] border-r-[0.25px] border-b-[0.5px] border-[#3CB371]/50 dark:border-[#3CB371] z-20">
                {isPopular}
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            )}

            <CardContent className="p-4 sm:h-[112px] flex flex-col sm:flex-col items-start justify-center gap-y-1">
              <div className="flex items-center gap-x-3 sm:block space-y-2">
                <Icon className="h-6 w-6 text-primary/70 dark:text-primary/80 group-hover:text-primary transition-colors sm:mb-2 flex-shrink-0" />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-x-1">
                    <h3 className="font-medium text-sm sm:text-base text-left text-primary/70 dark:text-primary/80 group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm group-hover:text-primary/80 text-left text-primary/50 dark:text-primary/60 transition-colors">
                    {description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          className="animate-in fade-in-50 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 bg-gradient-to-br from-background to-background/90 border-primary/10 shadow-sm dark:shadow-primary/5 backdrop-blur-sm rounded-xl"
          sideOffset={5}
        >
          <div className="flex items-center gap-2 p-2">
            <Icon className="h-4 w-4 text-primary/70 flex-shrink-0" />
            <p className="text-sm font-medium">{tooltip}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export type MagicIconType = "upload" | "paste" | "record";

export type MagicIconsProps = {
  icons?: MagicIconType[];
  uploadAction?: (file: File) => void;
  magicBarAction?: (url: string) => Promise<void>;
  isDisabledExternal?: boolean;
};

const MagicIcons: React.FC<MagicIconsProps> = ({
  icons = ["upload", "paste", "record"],
  uploadAction,
  magicBarAction,
  isDisabledExternal = false,
}) => {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const { onScreenshot } = useScreenshotStore();
  const { mutate: startSTT, isPending: isRecording } = useStartSTT();
  const { mutate: uploadContent, isPending: isUploading } = useUploadContent();
  const {
    mutate: startContentConversation,
    isPending: isStartingContentConversation,
  } = useStartContentConversation();
  const { mutate: chat } = useChat();
  const { mutate: uploadChatImage, isPending: isUploadingChatImage } =
    useUploadChatImage();
  const {
    uploadFileToS3,
    isUploading: isUploadingS3,
    progress,
  } = useS3Upload();
  const { mutate: addFileContent, isPending: isAddingFileContent } =
    useAddContent();
  const { mutate: addPasteContent, isPending: isAddingPasteContent } =
    useAddContent();
  const { setCurrentTab } = useTabStore();
  const [uploadClicked, setUploadClicked] = useLocalStorage(
    "uploadButtonClicked",
    false,
  );
  const isMobile = useMediaQuery("(max-width: 768px)");
  const currentToastId = useRef<string | number | null>(null);
  const previousProgress = useRef<number>(0);

  useEffect(() => {
    if (
      currentToastId.current &&
      progress > 0 &&
      progress < 100 &&
      progress !== previousProgress.current
    ) {
      toast.loading(
        <div className="flex flex-col gap-2 w-full">
          <span>
            {t("stt.uploading")}... {progress}%
          </span>
          <Progress
            value={progress}
            className="bg-primary dark:bg-neutral-800 w-full"
            parentClassName="h-2 w-full"
          />
        </div>,
        {
          id: currentToastId.current,
        },
      );
      previousProgress.current = progress;
    }
  }, [progress]);

  const isDisabled =
    isUploading ||
    isAddingFileContent ||
    isUploadingS3 ||
    isAddingPasteContent ||
    isRecording ||
    isUploadingChatImage;

  const finalIsDisabled = isDisabled || isDisabledExternal;

  const handleUploadImage = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      uploadChatImage(
        { mimeType: file.type },
        {
          onSuccess: async (data) => {
            try {
              const url = await uploadFileToS3(file, data);
              if (url) {
                const currentScreenshots =
                  useScreenshotStore.getState().screenshot || [];
                onScreenshot([...currentScreenshots, url]);
                resolve();
              } else {
                reject(new Error("Failed to get upload URL"));
              }
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            reject(error);
          },
        },
      );
    });
  };

  const createContentFromUploadedFile = async (
    url: string,
    isMultipleUpload: boolean = false,
    title?: string,
  ) => {
    return new Promise<void>((resolve, reject) => {
      addFileContent(
        {
          spaceId: params.spaceId as string,
          contentURLs: [url],
          addToHistory: !params.spaceId,
          title,
        },
        {
          onSuccess: (data, variables) => {
            if (variables.spaceId) {
              resolve();
              return;
            }
            if (isMultipleUpload) {
              resolve();
              return;
            }
            router.push(`/learn/content/${data[0].content_id}`);
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        },
      );
    });
  };

  const createContentFromPastedUrl = async (url: string) => {
    return new Promise<void>((resolve, reject) => {
      addPasteContent(
        {
          spaceId: params.spaceId as string,
          contentURLs: [url],
          addToHistory: !params.spaceId,
        },
        {
          onSuccess: (data, variables) => {
            if (!variables.spaceId) {
              router.push(`/learn/content/${data[0].content_id}`);
            }
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        },
      );
    });
  };

  const uploadFileAndCreateContent = async (
    file: File,
    isMultipleUpload: boolean = false,
  ) => {
    const isSupported = getAllowedFileAccepts().includes(file.type);

    if (!isSupported) {
      toast.error(
        t("magicBar.unsupportedFileType", {
          defaultValue:
            "Unsupported file type. Please upload PDF, PPTX, DOCX, or TXT files only.",
        }),
      );
      return;
    }

    if (uploadAction) {
      uploadAction(file);
      return;
    }

    const toastId = toast.loading(
      <div className="flex flex-col gap-2">
        <span>{t("stt.uploading")}... 0%</span>
        <Progress
          value={0}
          className="bg-primary dark:bg-neutral-800 w-full"
          parentClassName="h-2 w-full"
        />
      </div>,
    );

    currentToastId.current = toastId;
    previousProgress.current = 0;

    try {
      if (IS_IMAGE_ACCEPT(file.type)) {
        if (file.size > MAX_SCREENSHOT_SIZE_FOR_CHAT) {
          toast.error(
            t("toast.fileSizeError", {
              size: MAX_SCREENSHOT_SIZE_FOR_CHAT / 1024 / 1024,
            }),
            {
              id: toastId,
            },
          );
          currentToastId.current = null;
          return;
        }

        await handleUploadImage(file);
        toast.success(
          t("magicBar.uploadComplete", {
            defaultValue: "Upload complete!",
          }),
          { id: toastId },
        );
        return;
      }
      const uploadResult = await new Promise<string | null>(
        (resolve, reject) => {
          uploadContent(
            {
              mimeType: file.type,
            },
            {
              onSuccess: async (result) => {
                try {
                  const url = await uploadFileToS3(file, result);
                  if (!url) {
                    reject(new Error("Failed to upload file"));
                    return;
                  }
                  resolve(url);
                } catch (error) {
                  reject(error);
                }
              },
              onError: (error) => {
                reject(error);
              },
            },
          );
        },
      );

      if (uploadResult) {
        toast.success(
          t("magicBar.uploadComplete", {
            defaultValue: "Upload complete!",
          }),
          { id: toastId },
        );

        await createContentFromUploadedFile(
          uploadResult as string,
          isMultipleUpload,
          file.name,
        );
      }
    } catch (error) {
      toast.error(
        t("magicBar.uploadFailed", {
          defaultValue: "Upload failed. Please try again.",
        }),
        { id: toastId },
      );

      currentToastId.current = null;
    }
  };

  const handleUploadClick = () => {
    setUploadClicked(true);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.max = MAX_FILES.toString();
    fileInput.accept = getAllowedFileAccepts().join(",");

    fileInput.addEventListener("change", async () => {
      const files = fileInput.files;
      if (!files) return;
      if (files.length > MAX_FILES) {
        toast.error(t("magicBar.maxFiles", { files: MAX_FILES }));
        return;
      }
      uploadMultipleFilesAndCreateContent(files);
    });

    fileInput.click();
  };

  const uploadMultipleFilesAndCreateContent = async (files: FileList) => {
    const filesArray = Array.from(files);
    const nonImageFiles = filesArray.filter(
      (file) => !IS_IMAGE_ACCEPT(file.type),
    );
    const imageFiles = filesArray.filter((file) => IS_IMAGE_ACCEPT(file.type));
    const isMultipleNonImageUpload = nonImageFiles.length > 1;

    for (const file of filesArray) {
      await uploadFileAndCreateContent(file, isMultipleNonImageUpload);
    }

    // if there are multiple non-image files, return
    if (isMultipleNonImageUpload) {
      return;
    } else {
      // if there are images, start content conversation
      if (imageFiles.length > 0) {
        handleStartContentConversation();
      }
    }
  };

  const handleStartContentConversation = () => {
    startContentConversation(
      { spaceId },
      {
        onSuccess: (response) => {
          if (spaceId) {
            router.push(
              `/learn/space/${spaceId}/content/${response.content_id}`,
            );
          } else {
            router.push(`/learn/content/${response.content_id}`);
          }
          handleChatSubmit(response.content_id, "");
        },
      },
    );
  };

  const handleChatSubmit = (contentId: string, query: string) => {
    setCurrentTab("chat");
    chat(
      {
        spaceId: spaceId,
        contentId: contentId,
        query,
        getExistingChatHistory: true,
        saveChatHistory: true,
        imageUrls: useScreenshotStore.getState().screenshot!,
      },
      {
        onSuccess: () => {
          onScreenshot(null);
        },
      },
    );
  };

  const handleMagicBarOpen = () => {
    if (magicBarAction) {
      onOpen("magicBar", {
        handleAddContent: magicBarAction,
        isAddingContent: false,
      });
      return;
    }
    onOpen("magicBar", {
      handleAddContent: createContentFromPastedUrl,
      isAddingContent: isAddingPasteContent,
    });
  };

  const handleRecordClick = () => {
    const { setIsSystemAudio } = useMicStore.getState();
    setIsSystemAudio(false);

    // On mobile, directly start microphone recording without showing modal
    if (isMobile) {
      const spaceId = params.spaceId as string | undefined;
      startSTT(
        {
          title: `Recording at ${new Date().toLocaleTimeString()}`,
          spaceId: spaceId,
        },
        {
          onSuccess: (data) => {
            if (spaceId) {
              router.push(`/learn/space/${spaceId}/content/${data.content_id}`);
            } else {
              router.push(`/learn/content/${data.content_id}`);
            }
          },
          onError: (error) => {
            console.error("Error starting recording:", error);
          },
        },
      );
      return;
    }

    // On desktop, show recording options modal
    onOpen("recordingOptions", {
      onMicrophoneSelect: () => {
        const spaceId = params.spaceId as string | undefined;
        startSTT(
          {
            title: `Recording at ${new Date().toLocaleTimeString()}`,
            spaceId: spaceId,
          },
          {
            onSuccess: (data) => {
              if (spaceId) {
                router.push(
                  `/learn/space/${spaceId}/content/${data.content_id}`,
                );
              } else {
                router.push(`/learn/content/${data.content_id}`);
              }
            },
            onError: (error) => {
              console.error("Error starting recording:", error);
            },
          },
        );
      },
      onBrowserTabSelect: () => {
        const spaceId = params.spaceId as string | undefined;
        startSTT(
          {
            title: `Recording at ${new Date().toLocaleTimeString()}`,
            spaceId: spaceId,
          },
          {
            onSuccess: (data) => {
              const searchParams = new URLSearchParams({
                browserTabAudio: "true",
              });
              if (spaceId) {
                router.push(
                  `/learn/space/${spaceId}/content/${data.content_id}?${searchParams.toString()}`,
                );
              } else {
                router.push(
                  `/learn/content/${data.content_id}?${searchParams.toString()}`,
                );
              }
            },
            onError: (error) => {
              console.error("Error starting browser tab recording:", error);
            },
          },
        );
      },
    });
  };

  const allowedFileTypes = getAllowedFileTypeDescriptions().join(", ");

  const renderMagicCard = (type: MagicIconType) => {
    switch (type) {
      case "upload":
        return (
          <MagicCard
            key="upload"
            name={t("magicBar.upload")}
            description={t("magicBar.uploadDescription")}
            icon={Upload}
            onClick={handleUploadClick}
            onTouchStart={handleUploadClick}
            isPopular={
              !uploadClicked
                ? t("magicBar.mostUsed", { defaultValue: "Popular" })
                : undefined
            }
            isLoading={
              isUploading ||
              isAddingFileContent ||
              isUploadingS3 ||
              isUploadingChatImage
            }
            isDisabled={finalIsDisabled}
            tooltip={t("magicBar.uploadTooltip", {
              supportedFileTypes: allowedFileTypes,
            })}
          />
        );
      case "paste":
        return (
          <MagicCard
            key="paste"
            name={t("onboarding.steps.upload.tabs.paste")}
            description={t("magicBar.pasteTypes")}
            icon={Link2}
            onClick={handleMagicBarOpen}
            onTouchStart={handleMagicBarOpen}
            isLoading={isAddingPasteContent}
            isDisabled={finalIsDisabled}
            tooltip={t("magicBar.pasteTooltip")}
          />
        );
      case "record":
        return (
          <MagicCard
            key="record"
            name={t("onboarding.steps.upload.tabs.record")}
            description={t("magicBar.recordDescription")}
            icon={Mic}
            onClick={handleRecordClick}
            onTouchStart={handleRecordClick}
            isLoading={isRecording}
            isDisabled={finalIsDisabled}
            tooltip={t("magicBar.recordTooltip")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DropOverlay dropFiles={uploadMultipleFilesAndCreateContent} />
      <div className="flex flex-col text-center 2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px] w-full z-30">
        <div className="sm:justify-center sm:items-center gap-3 sm:flex grid grid-cols-1 w-full">
          {icons.map((type) => (
            <div key={type} className="flex-1 w-full sm:w-1/3">
              {renderMagicCard(type)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MagicIcons;
