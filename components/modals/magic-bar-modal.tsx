"use client";
import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Loader2, Link2, ClipboardPaste } from "lucide-react";
import {
  checkIsAllowedDocumentLink,
  checkIsYoutubeLink,
  checkIsPlaylistLink,
} from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useUploadContent, useUrlToBlob } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { mapExtensionToAccept } from "@/lib/utils";
import { useErrorStore } from "@/hooks/use-error-store";
import { useYouTubePlaylist } from "@/query-hooks/content";

const formSchema = z.object({
  link: z.string().trim().optional(),
  textContent: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        return val.length >= 100 && val.length <= 1000000;
      },
      {
        message: "Text must be between 100 and 1,000,000 characters.",
      },
    ),
});

type FormValues = z.infer<typeof formSchema>;

const MagicBarModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const { openModal } = useErrorStore();
  const { handleAddContent, isAddingContent } = data;
  const isModalOpen = isOpen && type === "magicBar";
  const { t } = useTranslation();
  const { mutate: uploadContent, isPending: isUploading } = useUploadContent();
  const { uploadMultipartToS3: uploadFileToS3, isUploading: isUploadingS3 } =
    useS3Upload();
  const { mutate: urlToBlob, isPending: isConvertingUrlToBlob } =
    useUrlToBlob();
  const { mutate: getYouTubePlaylist, isPending: isGettingYouTubePlaylist } =
    useYouTubePlaylist();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: "",
      textContent: "",
    },
  });

  const { errors } = form.formState;

  function convertTextToFile(text: string, filename = "output.txt"): File {
    const normalizedText = text.normalize("NFC");
    const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
    const encodedText = new TextEncoder().encode(normalizedText);
    return new File([BOM, encodedText], filename, {
      type: "text/plain;charset=utf-8",
    });
  }

  const handleClose = () => {
    onClose();
    form.reset();
  };

  const handleLinkInputChange = useCallback(
    (value: string) => {
      if (value.length > 5) {
        setTimeout(() => {
          const isYoutubeLink = checkIsYoutubeLink(value);
          if (isYoutubeLink && handleAddContent) {
            handleAddContent(value);
            handleClose();
          }
        }, 100);
      }
    },
    [form, handleAddContent, handleClose],
  );

  const handleTextFileUpload = async (values: FormValues) => {
    const file = await convertTextToFile(values.textContent.trim());
    return new Promise((resolve, reject) => {
      uploadContent(
        {
          mimeType: "text/plain",
        },
        {
          onSuccess: async (result) => {
            try {
              const url = await uploadFileToS3(file, result);

              if (!url) {
                toast.error(t("magicBar.uploadError"));
                reject(new Error("Upload failed"));
                return;
              }

              handleAddContent?.(url);
              resolve(url);
            } catch (error) {
              toast.error(t("magicBar.uploadError"));
              reject(error);
            }
          },
          onError: (error) => {
            toast.error(t("magicBar.uploadError"));
            reject(error);
          },
        },
      );
    });
  };

  const handlePasteFileUpload = async (fileUrl: string, fileType: string) => {
    uploadContent(
      {
        mimeType: fileType,
      },
      {
        onSuccess: async (result) => {
          try {
            urlToBlob(
              { url: fileUrl, mimeType: fileType },
              {
                onSuccess: async (blob) => {
                  const url = (await uploadFileToS3(blob, result)) as string;

                  await handleAddContent?.(url);
                  handleClose();
                },
              },
            );
          } catch (error) {
            openModal(
              {
                status: 500,
                statusText: "Error uploading file",
                title: "Upload Failed",
                message:
                  "We couldn't upload your file. Please check that the file is valid and try again.",
              },
              undefined,
              true,
            );
          }
        },
      },
    );
  };

  const onSubmit = async (values: FormValues) => {
    if (values.link && values.link.trim().length > 0) {
      const isPlaylistLink = checkIsPlaylistLink(values.link);
      if (isPlaylistLink) {
        getYouTubePlaylist(
          { playlistUrl: values.link },
          {
            onSuccess: async (data) => {
              handleClose();
              for (const video of data.videos) {
                await handleAddContent?.(video.url);
              }
            },
            onError: (error) => {
              toast.error(`Failed to fetch playlist: ${error.message}`);
            },
          },
        );
        return;
      }

      const isAllowedDocumentLink = checkIsAllowedDocumentLink(values.link);
      if (isAllowedDocumentLink) {
        const accept = mapExtensionToAccept(isAllowedDocumentLink.extension);
        if (accept) {
          await handlePasteFileUpload(values.link, accept);
          return;
        }
      }
      handleAddContent?.(values.link);
      handleClose();
      return;
    }

    if (values.textContent && values.textContent.trim().length > 0) {
      try {
        await handleTextFileUpload(values);
        handleClose();
      } catch (error) {
        console.error("Upload failed:", error);
      }
      return;
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base text-left flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t("magicBar.pasteLink")}
          </DialogTitle>
          <DialogDescription className="text-left">
            {t("magicBar.pasteLinkDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 pb-4"
          >
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="https://youtu.be/dQw4w9WgXcQ"
                      className="col-span-3 px-4 rounded-2xl"
                      disabled={isAddingContent}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleLinkInputChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-primary/20 dark:border-primary/40"></div>
              <span className="flex-shrink mx-4 text-primary/50 text-sm font-medium">
                {t("common.or", { defaultValue: "or" })}
              </span>
              <div className="flex-grow border-t border-primary/20 dark:border-primary/40"></div>
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-base flex items-center gap-2">
                <ClipboardPaste className="h-4 w-4" />
                {t("magicBar.pasteText")}
              </DialogTitle>
              <DialogDescription className="pb-2">
                {t("magicBar.pasteTextDescription")}
              </DialogDescription>

              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder={
                            t("magicBar.textPlaceholder") ||
                            "Paste your text here..."
                          }
                          className={cn(
                            "resize-none min-h-[45px] sm:min-h-[126px] px-4 py-3 rounded-2xl",
                            errors.textContent && "border-destructive",
                          )}
                          disabled={
                            isAddingContent || isUploadingS3 || isUploading
                          }
                          {...field}
                        />
                        {field.value.trim().length > 0 && (
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground backdrop-blur-sm bg-opacity-80 px-1 rounded">
                            {field.value.trim().length}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="sm:gap-0 gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("contentDeleteModal.cancel")}
              </Button>
              <Button
                disabled={
                  isAddingContent ||
                  isUploadingS3 ||
                  isUploading ||
                  isConvertingUrlToBlob ||
                  isGettingYouTubePlaylist
                }
                type="submit"
              >
                {isAddingContent ||
                isUploadingS3 ||
                isUploading ||
                isConvertingUrlToBlob ||
                isGettingYouTubePlaylist ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    {t("processing")}...
                  </div>
                ) : (
                  t("smartkbd.add")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MagicBarModal;
