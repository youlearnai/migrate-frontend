import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  ArrowUp,
  Loader2,
  X,
  Link as LinkIcon,
  Play,
  Globe,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/query-hooks/generation";
import { useUserProfile, useUpdateUser, useGetTier } from "@/query-hooks/user";
import {
  useAddContent,
  useStartContentConversation,
} from "@/query-hooks/content";
import { ChatTextarea } from "../ui/chat-textarea";
import AiModelDropdown from "../learn/ai-model-dropdown";
import WebSearchTool from "../learn/web-search-tool";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import { useTranslation } from "react-i18next";
import { useErrorStore } from "@/hooks/use-error-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { categorizeInput } from "@/lib/utils";
import { usePasteChatInputStore } from "@/hooks/use-paste-item-input-store";
import { useQueryClient } from "@tanstack/react-query";
import { chatHistory } from "@/endpoints/generation";
import useAuth from "@/hooks/use-auth";
import { InputType } from "zlib";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { MAX_FILES_FOR_CHAT } from "@/lib/utils";
import { useUploadChatImage } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import ImageWithRemove from "../global/image-with-remove";
import { Skeleton } from "../ui/skeleton";
import { useTabStore } from "@/hooks/use-tab";

const formSchema = z.object({
  query: z.string().min(1, { message: "Please enter a query" }),
});

const MAX_WORD_LIMIT = {
  free: 1000,
  core: 5000,
  pro: 5000,
  plus: 5000,
  unlimited: 10000,
};

type FormValues = z.infer<typeof formSchema>;

const inputClassNames = (type: InputType) => {
  switch (type) {
    case "web":
      return "!bg-blue-100/80 dark:!bg-blue-500/20 border-blue-500/20 dark:border-blue-500/80";
    case "youtube":
      return "!bg-red-100/80 dark:!bg-red-500/20 border-red-500/20 dark:border-red-500/80";
    default:
      return "!bg-neutral-100/80 dark:!bg-neutral-900/20 border-neutral-500/20 dark:border-neutral-500/80";
  }
};

const getInputTextColor = (type: InputType) => {
  switch (type) {
    case "web":
      return "text-blue-600 dark:text-blue-400";
    case "youtube":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-neutral-600 dark:text-neutral-400 ";
  }
};

const getInputIcon = (type: InputType) => {
  switch (type) {
    case "youtube":
      return <Play className="w-2.5 h-2.5 mr-1" />;
    case "web":
      return <Globe className="w-2.5 h-2.5 mr-1" />;
    default:
      return <LinkIcon className="w-2.5 h-2.5 mr-1" />;
  }
};

const getButtonHoverClass = (type: InputType) => {
  switch (type) {
    case "web":
      return "hover:bg-blue-200/60 dark:hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-400";
    case "youtube":
      return "hover:bg-red-200/60 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-400";
    default:
      return "hover:bg-neutral-200/60 dark:hover:bg-neutral-900/20 hover:text-neutral-700 dark:hover:text-neutral-400";
  }
};

const MagicBarInput = () => {
  const router = useRouter();
  const params = useParams();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });
  const { mutate: chat } = useChat();
  const spaceId = params.spaceId as string;
  const userProfile = useUserProfile();
  const { mutate: updateUser } = useUpdateUser();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    mutate: startContentConversation,
    isPending: isStartingContentConversation,
  } = useStartContentConversation();
  const { isWebSearch } = useWebSearchStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { openModal } = useErrorStore();
  const { data: tier } = useGetTier();
  const { appendInput, inputs, removeInput, removeAllInputs } =
    usePasteChatInputStore();
  const { mutate: addContent, isPending: isAddingContent } = useAddContent();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { onScreenshot, screenshot } = useScreenshotStore();
  const { mutate: uploadChatImage } = useUploadChatImage();
  const { uploadFileToS3, isUploading } = useS3Upload();
  const { setCurrentTab } = useTabStore();

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
        e.key === "F1" ||
        e.key === "F2" ||
        e.key === "F3" ||
        e.key === "F4" ||
        e.key === "F5" ||
        e.key === "F6" ||
        e.key === "F7" ||
        e.key === "F8" ||
        e.key === "F9" ||
        e.key === "F10" ||
        e.key === "F11" ||
        e.key === "F12"
      ) {
        return;
      }

      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement &&
          document.activeElement.getAttribute("contenteditable") === "true");

      if (!isInput && e.key.length === 1) {
        e.preventDefault();
        textareaRef.current?.focus();
        setMessage((prevMessage) => prevMessage + e.key);
        setTimeout(adjustTextareaHeight, 0);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current?.contains(event.target as Node)) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest(".magic-bar-input-propagate-click")
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

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const processFiles = async (files: File[]) => {
    const totalScreenshots = (screenshot?.length || 0) + files.length;

    if (totalScreenshots > MAX_FILES_FOR_CHAT) {
      toast.error(
        t("chatInput.maxScreenshotsExceeded", { limit: MAX_FILES_FOR_CHAT }),
      );
      return;
    }

    const uploadedScreenshots: string[] = [...(screenshot || [])];

    for (const file of files) {
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

    onScreenshot(uploadedScreenshots);
  };

  const handleChatSubmit = async (contentId: string, query: string) => {
    await queryClient.prefetchQuery({
      queryKey: [
        "chatHistory",
        spaceId ? "space" : "content",
        contentId,
        spaceId,
      ],
      queryFn: () =>
        chatHistory(
          user?.uid || "anonymous",
          spaceId ? "space" : "content",
          contentId,
          spaceId,
        ),
    });

    setCurrentTab("chat");

    chat(
      {
        spaceId: spaceId,
        contentId: contentId,
        query,
        getExistingChatHistory: true,
        saveChatHistory: true,
        chatModelId: userProfile?.data?.user_profile.chat_model_id!,
        isWebSearch: isWebSearch,
        imageUrls: screenshot!,
      },
      {
        onSuccess: () => {
          onScreenshot(null);
        },
      },
    );
  };

  const checkWordLimit = () => {
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
      return true;
    }
    return false;
  };

  const handleSubmitCases = () => {
    // 1. No inputs, and there is a message or screenshot
    if (
      (!inputs || inputs.length === 0) &&
      (message.trim().length > 0 || (screenshot && screenshot?.length > 0))
    ) {
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
            handleChatSubmit(response.content_id, message);
          },
        },
      );
      return;
    }

    // 2. No message and no screenshot, but there are inputs
    if (
      message.trim().length === 0 &&
      (!screenshot || screenshot.length === 0) &&
      inputs &&
      inputs.length > 0
    ) {
      addContent(
        {
          spaceId: spaceId,
          contentURLs: inputs.map((input) => input.value),
          addToHistory: !spaceId,
        },
        {
          onSuccess: (data, variables) => {
            if (!variables.spaceId) {
              router.push(`/learn/content/${data[0].content_id}`);
            }
          },
        },
      );
      return;
    }

    // 3. There are both (message or screenshot) and inputs
    if (
      (message.trim().length > 0 || (screenshot && screenshot?.length > 0)) &&
      inputs &&
      inputs.length > 0
    ) {
      addContent(
        {
          spaceId: spaceId,
          contentURLs: inputs.map((input) => input.value),
          addToHistory: !spaceId,
        },
        {
          onSuccess: (data, variables) => {
            handleChatSubmit(data[0].content_id, message);
            if (variables.spaceId) {
              router.push(
                `/learn/space/${variables.spaceId}/content/${data[0].content_id}`,
              );
            } else {
              router.push(`/learn/content/${data[0].content_id}`);
            }
          },
        },
      );
    }
  };

  const onSubmit = () => {
    if (
      message.trim() ||
      inputs?.length ||
      (screenshot && screenshot?.length > 0)
    ) {
      if (checkWordLimit()) return;
      handleSubmitCases();
      setMessage("");
      resetTextareaHeight();
      form.reset();
      removeAllInputs();
      onScreenshot(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isStartingContentConversation) return;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 28)}px`;
    }
  };

  const resetTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "28px";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Handle text paste
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      const inputType = categorizeInput(text);
      if (inputType) {
        if (!inputs?.length) {
          e.preventDefault();
          appendInput({
            type: inputType,
            value: text,
          });
        } else {
          toast.warning(t("magicBar.pasteInputLimit"));
        }
      }
    }

    // Handle image paste
    const items = e.clipboardData.items;
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
      processFiles(files);
    }
  };

  const handleRemoveInput = (id: string) => {
    removeInput(id);
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex w-full flex-col transition-all pb-1.5 pt-0.5 duration-150 justify-center px-2.5 border rounded-2xl space-y-1 focus-within:border shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 relative"
      >
        <div className="flex flex-col space-y-2">
          {inputs && inputs.length > 0 && (
            <div className="mt-1 gap-1 flex">
              {inputs.map((input) => (
                <div
                  className={cn(
                    "flex text-xs p-1 px-1.5 w-fit border max-w-xs truncate rounded-lg flex-row items-center gap-1",
                    inputClassNames(input.type),
                  )}
                  key={input.id}
                >
                  <div className={getInputTextColor(input.type)}>
                    {getInputIcon(input.type)}
                  </div>
                  <div
                    className={cn("truncate", getInputTextColor(input.type))}
                  >
                    {input.value}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "p-1 my-0 h-fit ml-1 rounded-md",
                      getInputTextColor(input.type),
                      getButtonHoverClass(input.type),
                    )}
                    onClick={() => handleRemoveInput(input.id)}
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {((screenshot && screenshot.length > 0) || isUploading) && (
            <div className="w-full flex mt-1 rounded-t-md rounded">
              <div className="flex w-full gap-2">
                {screenshot?.map((imageSrc, index) => (
                  <ImageWithRemove
                    key={index}
                    imageSrc={imageSrc}
                    onRemove={() =>
                      onScreenshot(screenshot.filter((_, i) => i !== index))
                    }
                  />
                ))}
                {isUploading && (
                  <Skeleton>
                    <div className="relative w-14 h-14 flex justify-center items-center flex-shrink-0 rounded overflow-hidden">
                      <Loader2 className="animate-spin w-5 h-5" />
                      <div className="absolute top-0 right-0 rounded-full w-5 h-5 flex items-center justify-center text-xs" />
                    </div>
                  </Skeleton>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full relative transition-all duration-500 ease-in">
          <div className="flex w-full items-center">
            <ChatTextarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onFocus={() => setIsFocused(true)}
              className="flex-1 focus-visible:ring-0 bg-transparent ring-0 border-none outline-none placeholder-primary/50 resize-none text-base pt-2 pb-2"
              placeholder={t("magicBar.placeholder2", "Or ask AI tutor")}
              onKeyDown={handleKeyDown}
              autoFocus={false}
              onPaste={handlePaste}
            />
          </div>
          <div
            ref={dropdownRef}
            className={`overflow-hidden transition-all relative ${isFocused ? "max-h-20 opacity-100 mb-0" : "max-h-0 opacity-0"}`}
          >
            <div className="flex flex-row justify-start items-center gap-2 pt-1">
              {userProfile?.data && (
                <AiModelDropdown
                  value={userProfile.data.user_profile.chat_model_id}
                  onModelSelect={(value) => {
                    updateUser({
                      chatModelId: value,
                    });
                  }}
                />
              )}
              <WebSearchTool />
            </div>
          </div>

          <div
            className={cn(
              "absolute transition-all right-0 bottom-[0.175rem]",
              isFocused && "bottom-1",
            )}
          >
            <Button
              className="rounded-full h-[34px] w-[34px]"
              size="messageIcon"
              disabled={
                (!message && !inputs?.length && !screenshot?.length) ||
                isStartingContentConversation ||
                isAddingContent
              }
              type="button"
              onClick={onSubmit}
            >
              {isStartingContentConversation || isAddingContent ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default MagicBarInput;
