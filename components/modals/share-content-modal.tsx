"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import { useUpdateContent } from "@/query-hooks/content";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Link, Share, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "usehooks-ts";
import { useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatMilliseconds, isVideoType, isAudioType } from "@/lib/utils";
import { ContentType } from "@/lib/types";

export const ShareContentModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const { t } = useTranslation();
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [timestampCopied, setTimestampCopied] = useState(false);
  const [iframeCopied, setIframeCopied] = useState(false);
  const [showEmbedSection, setShowEmbedSection] = useState(false);
  const [_, copy] = useCopyToClipboard();
  const { mutate: updateContent } = useUpdateContent();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isModalOpen = isOpen && type === "shareContent";
  const {
    contentId,
    spaceId,
    visibility: initialVisibility,
    contentType,
    currentSource,
  } = data;
  const [currentVisibility, setCurrentVisibility] = useState(initialVisibility);

  useEffect(() => {
    setCurrentVisibility(initialVisibility);
  }, [initialVisibility]);

  useEffect(() => {
    // Reset embed section visibility when modal opens or content changes
    if (isModalOpen) {
      setShowEmbedSection(false);
    }
  }, [isModalOpen, contentId]);

  const shouldShowSourceOption = () => {
    return (
      currentSource !== undefined &&
      currentSource !== null &&
      currentSource >= 0
    );
  };

  const formatCurrentSource = () => {
    if (
      currentSource === undefined ||
      currentSource === null ||
      currentSource < 0
    )
      return "";

    if (
      contentType &&
      (isVideoType(contentType as ContentType) ||
        isAudioType(contentType as ContentType))
    ) {
      // Custom formatting without leading zeros
      const totalSeconds = Math.floor(currentSource);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      const formattedSeconds =
        seconds < 10 ? `0${seconds}` : seconds.toString();

      if (hours > 0) {
        const formattedHours = hours.toString(); // No leading zero for hours
        const formattedMinutes =
          minutes < 10 ? `0${minutes}` : minutes.toString();
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      } else {
        const formattedMinutes = minutes.toString(); // No leading zero for minutes when no hours
        return `${formattedMinutes}:${formattedSeconds}`;
      }
    }

    // For non-video/audio content, show as page number
    return `${t("shareContentModal.page")} ${currentSource}`;
  };

  const getShareUrl = () => {
    const domainName =
      typeof window !== "undefined" ? window.location.origin : "";
    const basePath = !spaceId
      ? `${domainName}/learn/content/${contentId}`
      : `${domainName}/learn/space/${spaceId}/content/${contentId}`;

    // Add source parameter if currentSource exists
    if (
      currentSource !== undefined &&
      currentSource !== null &&
      currentSource >= 0
    ) {
      const separator = basePath.includes("?") ? "&" : "?";
      return `${basePath}${separator}source=${Math.floor(currentSource)}`;
    }

    return basePath;
  };

  const getEmbedUrl = () => {
    const domainName =
      typeof window !== "undefined" ? window.location.origin : "";
    const locale = params.locale || "en";
    const basePath = !spaceId
      ? `${domainName}/${locale}/embed/learn/content/${contentId}`
      : `${domainName}/${locale}/embed/learn/space/${spaceId}/content/${contentId}`;

    if (
      currentSource !== undefined &&
      currentSource !== null &&
      currentSource >= 0
    ) {
      const separator = basePath.includes("?") ? "&" : "?";
      return `${basePath}${separator}source=${Math.floor(currentSource)}`;
    }

    return basePath;
  };

  const generateIframeCode = () => {
    const embedUrl = getEmbedUrl();
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  };

  const handleCopy = async () => {
    if (currentVisibility === "private") {
      const newVisibility = "public";

      updateContent(
        {
          contentId: contentId!,
          content: {
            visibility: newVisibility,
          },
        },
        {
          onSuccess: () => {
            setCurrentVisibility(newVisibility);
            useModalStore.setState({
              data: { ...data, visibility: newVisibility },
            });

            queryClient.invalidateQueries({
              queryKey: ["getSpace", user?.uid || "anonymous", spaceId],
            });
            queryClient.invalidateQueries({
              queryKey: ["getHistory", user?.uid || "anonymous"],
            });
          },
          onError: (data) => {
            setCurrentVisibility(currentVisibility);
          },
        },
      );
    }

    // Copy base URL without source parameter
    const domainName =
      typeof window !== "undefined" ? window.location.origin : "";
    const baseUrl = !spaceId
      ? `${domainName}/learn/content/${contentId}`
      : `${domainName}/learn/space/${spaceId}/content/${contentId}`;

    await copy(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIframeCopy = async () => {
    if (currentVisibility === "private") {
      const newVisibility = "public";

      updateContent(
        {
          contentId: contentId!,
          content: {
            visibility: newVisibility,
          },
        },
        {
          onSuccess: () => {
            setCurrentVisibility(newVisibility);
            useModalStore.setState({
              data: { ...data, visibility: newVisibility },
            });

            queryClient.invalidateQueries({
              queryKey: ["getSpace", user?.uid || "anonymous", spaceId],
            });
            queryClient.invalidateQueries({
              queryKey: ["getHistory", user?.uid || "anonymous"],
            });
          },
          onError: (data) => {
            setCurrentVisibility(currentVisibility);
          },
        },
      );
    }

    const iframeCode = generateIframeCode();
    await copy(iframeCode);
    setIframeCopied(true);
    setTimeout(() => setIframeCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white dark:bg-neutral-950 py-4 px-4 w-full max-w-lg rounded-xl",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-3 top-3",
      }}
    >
      <ModalContent className="border max-w-lg">
        {() => (
          <>
            <ModalHeader className="flex flex-col p-0">
              <div className="flex flex-col">
                <div className="flex flex-row text-primary/70">
                  <Share className="w-4 h-4 mr-2.5 mt-1" />
                  <span className="text-base font-medium text-primary/70">
                    {t("shareContentModal.title")}
                  </span>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-4 pb-0 px-0">
              <div className="flex flex-col space-y-4">
                {/* Direct Link Section */}
                <div className="flex flex-col space-y-3">
                  {/* <p className="text-sm text-muted-foreground">
                    {t("shareContentModal.shareDirectLink")}
                  </p> */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="grid flex-1 gap-2">
                      <div className="bg-muted/50 border border-border rounded-md px-3 py-[9px] text-primary/80 truncate font-mono text-xs">
                        {getShareUrl()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end sm:justify-start sm:flex-shrink-0">
                      <Button
                        onClick={handleCopy}
                        className="flex items-center gap-2 h-9 px-3 text-sm text-secondary hover:text-secondary font-medium bg-foreground hover:bg-foreground/80 border border-border shadow-sm"
                        variant="outline"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{t("shareContentModal.copied")}</span>
                          </>
                        ) : (
                          <>
                            <Link className="h-3.5 w-3.5" />
                            <span>
                              {currentVisibility === "public"
                                ? t("shareContentModal.copyLink")
                                : t("shareContentModal.createLink")}
                            </span>
                          </>
                        )}
                      </Button>
                      {shouldShowSourceOption() && (
                        <Button
                          variant="outline"
                          onClick={async () => {
                            // Generate URL with timestamp
                            const basePath = !spaceId
                              ? `${typeof window !== "undefined" ? window.location.origin : ""}/learn/content/${contentId}`
                              : `${typeof window !== "undefined" ? window.location.origin : ""}/learn/space/${spaceId}/content/${contentId}`;

                            const separator = basePath.includes("?")
                              ? "&"
                              : "?";
                            const urlToCopy = `${basePath}${separator}source=${Math.floor(currentSource || 0)}`;

                            // Handle visibility update if needed
                            if (currentVisibility === "private") {
                              const newVisibility = "public";
                              updateContent(
                                {
                                  contentId: contentId!,
                                  content: {
                                    visibility: newVisibility,
                                  },
                                },
                                {
                                  onSuccess: () => {
                                    setCurrentVisibility(newVisibility);
                                    useModalStore.setState({
                                      data: {
                                        ...data,
                                        visibility: newVisibility,
                                      },
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: [
                                        "getSpace",
                                        user?.uid || "anonymous",
                                        spaceId,
                                      ],
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: [
                                        "getHistory",
                                        user?.uid || "anonymous",
                                      ],
                                    });
                                  },
                                  onError: (data) => {
                                    setCurrentVisibility(currentVisibility);
                                  },
                                },
                              );
                            }

                            // Copy the URL
                            await copy(urlToCopy);
                            setTimestampCopied(true);
                            setTimeout(() => setTimestampCopied(false), 2000);
                          }}
                          className="h-9 px-3 text-sm text-primary/80 font-medium bg-background hover:bg-muted border border-border shadow-sm"
                        >
                          {timestampCopied
                            ? `${t("shareContentModal.copiedAt")} ${formatCurrentSource()}`
                            : currentVisibility === "public"
                              ? `${t("shareContentModal.startAt")} ${formatCurrentSource()}`
                              : `${t("shareContentModal.createLinkAt")} ${formatCurrentSource()}`}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Embed Toggle Button */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setShowEmbedSection(!showEmbedSection)}
                    className="text-sm underline text-primary/60 text-left w-fit"
                  >
                    {t("shareContentModal.shareEmbed")}
                  </button>
                </div>

                {/* Embed Section - Conditionally Rendered */}
                {showEmbedSection && (
                  <div className="flex flex-col space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="grid flex-1 gap-2">
                        <div className="bg-muted/50 border border-border rounded-md px-3 py-[9px] text-primary/80 truncate font-mono text-xs">
                          {generateIframeCode()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end sm:justify-start sm:flex-shrink-0">
                        <Button
                          onClick={handleIframeCopy}
                          className="flex items-center gap-2 h-9 px-3 text-sm text-secondary hover:text-secondary font-medium bg-foreground hover:bg-foreground/80 border border-border shadow-sm"
                          variant="outline"
                        >
                          {iframeCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>{t("shareContentModal.copied")}</span>
                            </>
                          ) : (
                            <>
                              <Code2 className="h-3.5 w-3.5" />
                              <span>
                                {currentVisibility === "public"
                                  ? t("shareContentModal.copyLink")
                                  : t("shareContentModal.createLink")}
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
