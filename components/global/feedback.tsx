import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { cn } from "@/lib/utils";
import { useUploadFeedback } from "@/query-hooks/upload";
import { useContact, useGetTier } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import html2canvas from "html2canvas";
import {
  ArrowUpFromLine,
  Camera,
  ImageIcon,
  Phone,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import ImageWithRemove from "./image-with-remove";
import Spinner from "./spinner";
import { HIGHEST_TIERS } from "@/lib/utils";
import { Tier } from "@/lib/types";
import { getMarketingBaseUrl } from "@/lib/domains";

const formSchema = z.object({
  message: z.string().min(1, "Feedback is required"),
  imageUrls: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Feedback = ({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      imageUrls: [],
    },
  });
  const { mutate: uploadFeedback } = useUploadFeedback();
  const { uploadFileToS3, isUploading: isUploadingS3 } = useS3Upload();
  const { mutate: contact } = useContact();
  const [uploadedScreenshots, setUploadedScreenshots] = useState<string[]>([]);
  const { data: tier } = useGetTier();
  const [phoneNumberCopied, setPhoneNumberCopied] = useState(false);

  async function onSubmit(values: FormValues) {
    try {
      contact(
        {
          message:
            values.message +
            (uploadedScreenshots.length > 0
              ? "\n Images: " + uploadedScreenshots.join("\n")
              : ""),
          imageUrls: values.imageUrls,
        },
        {
          onSuccess: (data, variables) => {
            toast.success(t("contact.form.submitSuccess"));
          },
        },
      );
      form.reset();
      setUploadedScreenshots([]);
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await new Promise<void>((resolve, reject) => {
          uploadFeedback(
            { mimeType: file.type },
            {
              onSuccess: async (data) => {
                const url = await uploadFileToS3(file, data);
                if (url) {
                  setUploadedScreenshots((prev) => [...prev, url]);
                  const currentScreenshots = form.getValues("imageUrls") || [];
                  form.setValue("imageUrls", [...currentScreenshots, url]);
                }
                resolve();
              },
              onError: (error) => {
                console.error("Upload error:", error);
                reject(error);
              },
            },
          );
        });
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText("+1 (248) 962-3814");
    setPhoneNumberCopied(true);
    setTimeout(() => setPhoneNumberCopied(false), 2000);
  };

  return (
    <div
      className={cn("w-full max-w-md", className)}
      style={{ touchAction: "manipulation" }}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onClick={(e) => e.stopPropagation()}
          onFocusCapture={(e) => e.stopPropagation()}
          className="flex flex-col space-y-4"
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={t(
                      "feedback.placeholder",
                      "Share your thoughts...",
                    )}
                    autoFocus
                    className="min-h-[120px] max-w-lg resize-none transition-all ring-primary p-3"
                    onTouchStart={(e) => e.stopPropagation()}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between items-center gap-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.reset();
                onClose();
              }}
            >
              {t("contentDeleteModal.cancel", "Cancel")}
            </Button>
            <div className="flex items-center gap-x-2">
              {uploadedScreenshots.length <= 0 ? (
                <DropdownMenu modal>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 border"
                      disabled={isUploadingS3}
                    >
                      {isUploadingS3 ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem asChild>
                      <label
                        htmlFor="screenshot-upload"
                        className="flex items-center gap-x-2 cursor-pointer"
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                        {t("feedback.uploadScreenshot", "Upload screenshot")}
                      </label>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const canvas = await html2canvas(document.body);
                          const blob = await new Promise<Blob>((resolve) => {
                            canvas.toBlob((blob) => {
                              if (blob) resolve(blob);
                            }, "image/png");
                          });

                          const file = new File([blob], "screenshot.png", {
                            type: "image/png",
                          });

                          uploadFeedback(
                            { mimeType: file.type },
                            {
                              onSuccess: async (data) => {
                                const url = await uploadFileToS3(file, data);
                                if (url) {
                                  setUploadedScreenshots((prev) => [
                                    ...prev,
                                    url,
                                  ]);
                                  const currentScreenshots =
                                    form.getValues("imageUrls") || [];
                                  form.setValue("imageUrls", [
                                    ...currentScreenshots,
                                    url,
                                  ]);
                                }
                              },
                              onError: (error) => {
                                console.error(
                                  "Screenshot capture error:",
                                  error,
                                );
                              },
                            },
                          );
                        } catch (error) {
                          console.error("Error capturing screenshot:", error);
                        } finally {
                        }
                      }}
                      disabled={isUploadingS3}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {t("feedback.captureScreen", "Capture screen")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => {
                    setUploadedScreenshots([]);
                    form.setValue("imageUrls", []);
                  }}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  {t("feedback.clearScreenshots", "Clear")}
                </Button>
              )}
              {uploadedScreenshots.length > 0 && (
                <div className="flex gap-2">
                  {uploadedScreenshots.map((screenshot, index) => (
                    <ImageWithRemove
                      key={index}
                      imageSrc={screenshot}
                      baseClassName="w-10 h-10"
                      iconClassName="w-3 h-3"
                      onRemove={() => {
                        setUploadedScreenshots((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                        const currentScreenshots =
                          form.getValues("imageUrls") || [];
                        form.setValue(
                          "imageUrls",
                          currentScreenshots.filter((_, i) => i !== index),
                        );
                      }}
                    />
                  ))}
                </div>
              )}
              <Button type="submit" size="sm">
                {t("feedback.submit", "Send feedback")}
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            id="screenshot-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/gif"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          {HIGHEST_TIERS.includes(tier as Tier) ? (
            <div className="text-xs space-y-2">
              <div className="border-t border-neutral-200 dark:border-neutral-800 mb-4" />
              <p className="text-primary font-medium flex items-center flex-row">
                {t("feedback.premiumSupport")}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {t("feedback.phoneSupport")}
                <div className="flex items-center mt-2 border w-fit p-1 rounded-md px-2 bg-neutral-50 dark:bg-neutral-900">
                  <a
                    href="tel:+18005551234"
                    className="text-green-500 dark:text-[#7DFF97]/100 font-medium hover:text-green-600 dark:hover:text-[#7DFF97]"
                  >
                    +1 (248) 962-3814
                  </a>
                  <Button
                    onClick={copyPhoneNumber}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                  >
                    {phoneNumberCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-400">
              {t("feedback.discordNote", "Join our ")}
              <a
                href={`${getMarketingBaseUrl()}/discord`}
                className="text-green-500 dark:text-[#7DFF97]/100 font-medium hover:text-green-600 dark:hover:text-[#7DFF97]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("feedback.discordCommunity", "Discord Community")}
              </a>
              {t(
                "feedback.discordNote2",
                " to connect with other users, share ideas, and help shape our platform.",
              )}
            </p>
          )}
        </form>
      </Form>
    </div>
  );
};

export default Feedback;
