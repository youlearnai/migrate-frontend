import AgenticMode from "@/components/learn/agentic-mode";
import { useCaptureStore } from "@/hooks/use-capture-store";
import { useChatStore } from "@/hooks/use-chat-store";
import { useErrorStore } from "@/hooks/use-error-store";
import { useHighlightStore } from "@/hooks/use-highlight-store";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { useS3Upload } from "@/hooks/use-upload-s3";
import {
  aiModelsOptions,
  MAX_FILES_FOR_CHAT,
  MAX_FILE_SIZE_FOR_CHAT,
  MAX_SCREENSHOT_SIZE_FOR_CHAT,
  getAllowedFileAccepts,
  getMentionItems,
} from "@/lib/utils";
import { Content, ContentType, EnhancedFeatureMentionItem } from "@/lib/types";
import { useUploadChatImage, useUploadContent } from "@/query-hooks/upload";
import { useGetTier, useUpdateUser, useUserProfile } from "@/query-hooks/user";
import { useChatVoiceRecording } from "@/hooks/use-chat-voice-recording";
import {
  ArrowUp,
  Check,
  CornerDownRight,
  Loader2,
  Mic,
  Paperclip,
  X,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import {
  FormEventHandler,
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  memo,
} from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ImageWithRemove from "../global/image-with-remove";
import FileWithRemove from "../global/file-with-remove";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import AiModelDropdown from "./ai-model-dropdown";
import CaptureButton from "./capture-button";
import { cn } from "@/lib/utils";
import { isDocumentType } from "@/lib/utils";
import WebSearchTool from "./web-search-tool";
import { useSpaceExamQuestionIdStore } from "@/hooks/use-space-exam-question-id-store";
import AdvancedVoiceModeButton from "../global/advanced-voice-mode-button";
import { MentionsInput, Mention } from "react-mentions";
import MentionTool from "./mention-tool";
import { useTheme } from "next-themes";
import { useFeatureMentions } from "@/lib/constants";
import { useAddContent } from "@/query-hooks/content";
import { useChatContentContextStore } from "@/hooks/use-chat-content-context-store";

const MAX_WORD_LIMIT = {
  free: 1000,
  core: 5000,
  pro: 5000,
  plus: 5000,
  unlimited: 10000,
};

const ChatInput = ({
  isSubmitting,
  handleSubmit: submit,
  className,
  type,
  enabledVoice = false,
  chatContextContents,
}: {
  isSubmitting: boolean;
  handleSubmit: (text: string) => void;
  className?: string;
  type?: ContentType;
  enabledVoice?: boolean;
  chatContextContents?: Content[];
}) => {
  const { t } = useTranslation();
  const toolMentions = useFeatureMentions();
  const pathname = usePathname();
  const params = useParams();
  const { data: user } = useUserProfile();
  const { mutate: updateUser } = useUpdateUser();
  const { highlight, onHighlight, data } = useHighlightStore();
  const { screenshot, onScreenshot } = useScreenshotStore();
  const { contextContents, addContextContent, removeContextContent } =
    useChatContentContextStore();
  const { message, setMessage, getMessageForContent, setMessageForContent } =
    useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { mutate: uploadChatImage, isPending: isUploadingChatImage } =
    useUploadChatImage();
  const { mutate: uploadContent, isPending: isUploadingContent } =
    useUploadContent();
  const { mutate: addContent, isPending: isAddingContent } = useAddContent();
  const { loading } = useCaptureStore();
  const { uploadFileToS3, isUploading } = useS3Upload();
  const { data: tier } = useGetTier();
  const { openModal } = useErrorStore();
  const { questionId, setQuestionId, title } = useSpaceExamQuestionIdStore();
  const isSpacePage = pathname.startsWith("/space");
  const contentId = params.contentId as string;
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const {
    recordingState,
    startRecording: startRecordingHook,
    stopAndTranscribe: stopAndTranscribeHook,
    cancelRecording: cancelRecordingHook,
  } = useChatVoiceRecording();
  const featureMentions = getMentionItems(toolMentions, chatContextContents);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setPortalHost(containerRef.current);
    }
  }, []);

  const startRecording = () => startRecordingHook();

  const stopAndTranscribe = () => {
    stopAndTranscribeHook((text: string) => {
      setMessage(message + " " + text);
      setMessageForContent(contentId, message + " " + text);
    });
  };

  const cancelRecording = () => cancelRecordingHook();

  useEffect(() => {
    if (contentId) {
      const contentMessage = getMessageForContent(contentId);
      if (message !== contentMessage) {
        setMessage(contentMessage);
      }
    }
  }, [contentId, getMessageForContent, message, setMessage]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement === textareaRef.current ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === "Shift" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "CapsLock" ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F")
      ) {
        return;
      }

      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement &&
          document.activeElement.getAttribute("contenteditable") === "true");

      if (!isInput && e.key.length === 1 && contentId) {
        e.preventDefault();
        textareaRef.current?.focus();
        const newMessage = message + e.key;
        setMessage(newMessage);
        setMessageForContent(contentId, newMessage);
        setIsFocused(true);
        setTimeout(adjustTextareaHeight, 0);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [contentId, message, setMessage, setMessageForContent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current?.contains(event.target as Node)) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest(".chat-input-propagate-click")
      ) {
        return;
      }

      setIsFocused(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlight && data?.contentId === contentId) {
      textareaRef.current?.focus();
      setIsFocused(true);
    }
  }, [highlight, data?.contentId, contentId]);

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const submitMessage = async () => {
    const wordCount = getWordCount(message);
    if (wordCount > MAX_WORD_LIMIT[tier as keyof typeof MAX_WORD_LIMIT]) {
      if (tier === "free") {
        openModal(
          {
            status: 402,
            statusText: "Upgrade to continue",
          },
          {
            source: "chat-submit-word-limit",
          },
        );
      }
      toast.error(
        t("chatInput.messageExceedsLimit", {
          limit: MAX_WORD_LIMIT[tier as keyof typeof MAX_WORD_LIMIT],
        }),
      );
      return;
    }
    if (isFileOrScreenshotUploading) {
      toast.error(t("chatInput.fileOrScreenshotUploading"));
      return;
    }
    if (
      message.trim() ||
      (screenshot && screenshot.length > 0) ||
      contextContents.length > 0
    ) {
      submit(message);
      setMessage("");
      setMessageForContent(contentId, "");
      resetTextareaHeight();
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ): void => {
    if (isSubmitting) return;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submitMessage();
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 28)}px`;
    }
  }, []);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const resetTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "28px";
    }
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const processFiles = useCallback(
    async (filesToProcess: File[]) => {
      const imageFiles = filesToProcess.filter(isImageFile);
      const nonImageFiles = filesToProcess.filter((f) => !isImageFile(f));

      const totalFiles =
        (screenshot?.length || 0) +
        contextContents.length +
        filesToProcess.length;

      if (totalFiles > MAX_FILES_FOR_CHAT) {
        toast.error(
          t("chatInput.maxScreenshotsExceeded", { limit: MAX_FILES_FOR_CHAT }),
        );
        return;
      }

      if (imageFiles.length > 0) {
        const uploadedScreenshots: string[] = [...(screenshot || [])];

        for (const file of imageFiles) {
          if (file.size > MAX_SCREENSHOT_SIZE_FOR_CHAT) {
            toast.error(
              t("toast.fileSizeError", {
                size: MAX_SCREENSHOT_SIZE_FOR_CHAT / 1024 / 1024,
              }),
            );
            continue;
          }
          try {
            await new Promise<void>((resolve, reject) => {
              uploadChatImage(
                { mimeType: file.type },
                {
                  onSuccess: async (data) => {
                    const url = await uploadFileToS3(file, data);
                    if (url) {
                      uploadedScreenshots.push(url);
                    }
                    resolve();
                  },
                  onError: () => {
                    reject();
                  },
                },
              );
            });
          } catch (error) {}
        }

        onScreenshot(uploadedScreenshots, data);
      }

      for (let index = 0; index < nonImageFiles.length; index++) {
        const file = nonImageFiles[index];

        if (file.size > MAX_FILE_SIZE_FOR_CHAT) {
          toast.error(
            t("toast.fileSizeError", {
              size: MAX_FILE_SIZE_FOR_CHAT / 1024 / 1024,
            }),
          );
          continue;
        }

        try {
          await new Promise<void>((resolve, reject) => {
            uploadContent(
              { mimeType: file.type },
              {
                onSuccess: async (data) => {
                  const url = await uploadFileToS3(file, data);

                  if (url) {
                    await new Promise<void>(
                      (addContentResolve, addContentReject) => {
                        addContent(
                          {
                            spaceId: undefined,
                            contentURLs: [url],
                            addToHistory: false,
                            showToast: false,
                            sync: true,
                          },
                          {
                            onSuccess: (data) => {
                              if (data.length) {
                                addContextContent({
                                  ...data[0],
                                });
                              }

                              addContentResolve();
                            },
                            onError: (error) => {
                              addContentReject(error);
                            },
                          },
                        );
                      },
                    );
                  }
                  resolve();
                },
                onError: (error) => {
                  toast.error(
                    t("toast.fileUploadFailed", { fileName: file.name }),
                  );
                  reject(error);
                },
              },
            );
          });
        } catch (error) {
          toast.error(t("toast.fileUploadFailed", { fileName: file.name }));
        }
      }
    },
    [
      screenshot,
      data,
      onScreenshot,
      uploadChatImage,
      uploadContent,
      uploadFileToS3,
      addContextContent,
      removeContextContent,
      contextContents,
      t,
      params.spaceId,
      addContent,
    ],
  );

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      event.preventDefault();
      processFiles(files);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);

    event.target.value = "";
  };

  useEffect(() => {
    const modelId = user?.user_profile.chat_model_id;
    if (!modelId) return;
    if (!screenshot || screenshot.length === 0) return;

    const model = aiModelsOptions.find((model) => model.value === modelId);
    if (model && !model.allowedImages) {
      toast.info(t("chatInput.modelImagesNotSupported"), {
        id: "model-images-not-supported",
      });
      onScreenshot(null);
    }
  }, [user?.user_profile.chat_model_id, onScreenshot, screenshot, t]);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
        e.dataTransfer.clearData();
      }
    },
    [processFiles],
  );

  const isFileOrScreenshotUploading =
    isUploading ||
    isUploadingChatImage ||
    isUploadingContent ||
    isAddingContent ||
    loading;

  const formClasses = cn(
    className,
    "relative flex w-full flex-col transition-all pr-2 duration-150 items-end justify-center px-2 mt-0 border rounded-2xl space-y-1 focus-within:border dark:border-primary/5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50",
  );

  return (
    <form
      ref={formRef}
      className={formClasses}
      onSubmit={handleSubmit}
      onClick={() => textareaRef.current?.focus()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-green-500 z-50 flex items-center justify-center rounded-2xl pointer-events-none">
          <div className="absolute inset-0 bg-background/95 rounded-2xl" />
          <p className="relative text-sm font-medium text-muted-foreground">
            {t("magicBar.dropPdfHere")}
          </p>
        </div>
      )}
      {highlight && data?.contentId === contentId && (
        <div className="w-full items-center text-primary/70 bg-primary/5 flex justify-between p-2 mt-2 rounded-t-md rounded">
          <div className="gap-2 flex items-center">
            <CornerDownRight className="flex-shrink-0 h-5 w-5" />
            <span className="text-sm line-clamp-3">{highlight}</span>
          </div>
          <Button
            onClick={() => onHighlight(null)}
            size="icon"
            className="p-0.5 h-6 w-6"
            variant="ghost"
          >
            <X className="flex-shrink-0 h-5 w-5" />
          </Button>
        </div>
      )}

      {questionId && (
        <div className="w-full items-center text-primary/70 bg-primary/5 flex justify-between p-2 mt-2 rounded-t-md rounded">
          <div className="gap-2 flex items-center">
            <CornerDownRight className="flex-shrink-0 h-5 w-5" />
            <span className="text-sm line-clamp-3">{title}</span>
          </div>
          <Button
            onClick={() => setQuestionId(null)}
            size="icon"
            className="p-0.5 h-6 w-6"
            variant="ghost"
          >
            <X className="flex-shrink-0 h-5 w-5" />
          </Button>
        </div>
      )}

      {((screenshot && screenshot.length > 0) ||
        (contextContents && contextContents.length > 0) ||
        isFileOrScreenshotUploading) && (
        <div className="w-full flex py-1 pt-2 rounded-t-md rounded">
          <div className="flex w-full gap-2 flex-wrap">
            {screenshot?.map((imageSrc, index) => (
              <ImageWithRemove
                key={`img-${index}`}
                imageSrc={imageSrc}
                onRemove={() =>
                  onScreenshot(
                    screenshot.filter((_, i) => i !== index),
                    data,
                  )
                }
              />
            ))}
            {contextContents.map((file, index) => (
              <FileWithRemove
                key={`file-${index}`}
                fileName={file.title}
                type={file.type}
                onRemove={() => removeContextContent(file)}
              />
            ))}
            {(isUploading ||
              loading ||
              isAddingContent ||
              isUploadingChatImage ||
              isUploadingContent) && (
              <Skeleton>
                <div className="relative w-14 h-14 flex justify-center items-center flex-shrink-0 rounded overflow-hidden">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div className="absolute top-0 right-0 rounded-full w-5 h-5 flex items-center justify-center text-xs" />
                </div>
              </Skeleton>
            )}
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex flex-col w-full">
        <div className="flex w-full items-center mt-3 mb-1">
          {recordingState === "idle" && (
            <MentionsInput
              inputRef={textareaRef}
              autoFocus
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setMessageForContent(contentId, e.target.value);
              }}
              className={cn(
                "sm:mx-1 mx-0 flex-1 overflow-hidden focus-visible:ring-0 bg-transparent border-none resize-none text-base placeholder-primary/50 max-h-[120px] min-h-[28px] bg-white dark:bg-transparent",
                "flex w-full bg-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              )}
              placeholder={t("chatInput.typeMessagePlaceholder")}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              a11ySuggestionsListLabel={"Suggested mentions"}
              suggestionsPortalHost={portalHost ?? undefined}
              allowSuggestionsAboveCursor={true}
              style={{
                "&multiLine": {
                  input: {
                    border: "none",
                    outline: "none",
                  },
                },
                suggestions: {
                  backgroundColor: "transparent",
                  list: {
                    border: `1px solid ${theme === "dark" ? "hsl(0 0% 14.9%)" : "hsl(0 0% 87.8%)"}`,
                    borderRadius: "0.75rem",
                    backgroundColor:
                      theme === "dark" ? "hsl(0 0% 9%)" : "hsl(0 0% 100%)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    padding: "0rem 0.25rem",
                    position: "relative",
                    width: "12rem",
                    maxHeight: "420px",
                    overflowY: "auto",
                    overscrollBehaviorY: "none",
                  },
                  item: {
                    margin: "0.25rem 0",
                    borderRadius: "0.75rem",
                    "&focused": {
                      backgroundColor:
                        theme === "dark"
                          ? "hsl(0 0% 14.9%)"
                          : "hsl(0 0% 96.1%)",
                      color:
                        theme === "dark" ? "hsl(0 0% 98%)" : "hsl(0 0% 9%)",
                    },
                  },
                },
              }}
            >
              <Mention
                className="bg-emerald-100 dark:bg-emerald-900 py-[1px]"
                data={(query, callback) => {
                  const filtered = featureMentions.filter((item) => {
                    return item.display
                      .toLowerCase()
                      .includes(query.toLowerCase());
                  });

                  const sectionsWithFirstItem = new Map<string, boolean>();
                  const enhancedFiltered = filtered.map((item) => {
                    const isFirst = !sectionsWithFirstItem.has(item.itemType);
                    if (isFirst) {
                      sectionsWithFirstItem.set(item.itemType, true);
                    }
                    return {
                      ...item,
                      isFirstInSection: isFirst,
                    };
                  });

                  callback(enhancedFiltered);
                }}
                appendSpaceOnAdd
                trigger="@"
                markup=" @[__id__] "
                displayTransform={(id) => {
                  const mention = featureMentions.find((m) => m.id === id);
                  return ` @${mention?.display} `;
                }}
                // @ts-ignore
                renderSuggestion={(suggestion: EnhancedFeatureMentionItem) => {
                  const sectionClass =
                    suggestion.isFirstInSection && suggestion.sectionCssClass
                      ? suggestion.sectionCssClass
                      : "";

                  return (
                    <div
                      className={`flex w-full items-center gap-2.5 p-2 rounded-md group/item text-primary/60 dark:text-primary/40 border border-transparent ${sectionClass}`}
                      style={
                        {
                          "--feature-color": suggestion.color,
                          "--feature-color-border": `${suggestion.color}50`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center group-hover/item:text-[color:var(--feature-color)]">
                        {React.createElement(suggestion.logo, {
                          className: "h-5 w-5",
                        })}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium group-hover/item:text-primary/80 truncate">
                          {suggestion.display}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </MentionsInput>
          )}
          {recordingState === "recording" && (
            <div className="flex flex-col w-full">
              <div className="px-2 mb-1">
                <canvas data-voice-canvas="true" className="w-full h-12" />
              </div>
            </div>
          )}
          {recordingState === "processing" && (
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-center text-primary/70 p-3 mb-1">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">{t("chat.processingAudio")}</span>
              </div>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex flex-row justify-between items-end transition-all",
            isFocused ? "opacity-100" : "opacity-70",
          )}
        >
          <div className="flex items-center flex-wrap space-x-1 mb-0.5">
            {user && (
              <AiModelDropdown
                value={user?.user_profile.chat_model_id}
                onModelSelect={(value) => {
                  updateUser({
                    chatModelId: value,
                  });
                }}
              />
            )}
            {!params.examId && !isSpacePage && type !== "conversation" && (
              <AgenticMode />
            )}
            <WebSearchTool />
            <MentionTool chatContextContents={chatContextContents} />
          </div>
          <div className="flex items-center">
            {isDocumentType(type as ContentType) && (
              <div className="md:block hidden">
                <CaptureButton />
              </div>
            )}
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-primary/50 rounded-md hover:bg-muted opacity-100 p-2 mb-1">
                      <Paperclip className="-rotate-45 flex-shrink-0 h-4 w-4" />
                    </div>
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("chat.attachImage")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              id="image-upload"
              type="file"
              accept={getAllowedFileAccepts().join(",") + ",image/*"}
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {recordingState === "idle" && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      className={cn(
                        "text-primary/50 rounded-md hover:bg-muted opacity-100 p-2 mb-1 mr-1",
                      )}
                      size="messageIcon"
                      onClick={startRecording}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("chat.dictate")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isSubmitting ? (
              <Button
                type="button"
                className="rounded-full mb-2"
                size="messageIcon"
                disabled
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            ) : recordingState === "recording" ? (
              <div className="flex gap-0.5">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        type="button"
                        className={cn(
                          "rounded-md text-primary/50 hover:text-primary/50 mb-1",
                        )}
                        size="messageIcon"
                        onClick={cancelRecording}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("chat.cancelRecording")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        type="button"
                        className={cn(
                          "rounded-md text-primary/50 hover:text-primary/50 mb-1",
                        )}
                        size="messageIcon"
                        onClick={stopAndTranscribe}
                      >
                        <Check className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("chat.doneDictating")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : recordingState === "processing" ? (
              <Button className="rounded-full mb-2" size="messageIcon" disabled>
                <ArrowUp className="h-5 w-5" />
              </Button>
            ) : message ||
              (screenshot && screenshot?.length > 0) ||
              (contextContents && contextContents.length > 0) ||
              isFileOrScreenshotUploading ? (
              <Button
                className="rounded-full mb-2"
                size="messageIcon"
                disabled={isFileOrScreenshotUploading}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            ) : enabledVoice ? (
              <AdvancedVoiceModeButton />
            ) : (
              <Button className="rounded-full mb-2" size="messageIcon" disabled>
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default memo(ChatInput);
