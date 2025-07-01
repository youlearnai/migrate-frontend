import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModalStore } from "@/hooks/use-modal-store";
import { isDocumentType, isVideoType } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useGetSpace, useUpdateSpace } from "@/query-hooks/space";
import {
  AudioLines,
  CircleAlert,
  FileText,
  Globe,
  Link,
  Lock,
  MessageSquareText,
  Mic,
  Share,
  Youtube,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

const ShareSpace = () => {
  const { t } = useTranslation();
  const [_, copy] = useCopyToClipboard();
  const { mutate: updateSpace, isPending } = useUpdateSpace();
  const { data, isOpen, onClose, type } = useModalStore();
  const isModalOpen = type === "shareSpace" && isOpen;
  const spaceId = data.spaceId;
  const { data: spaceData, isLoading: isSpaceDataLoading } = useGetSpace(
    spaceId!,
  );
  const [value, setValue] = useState(spaceData?.space?.visibility!);

  const privacyOptions = [
    {
      value: t("shareSpace.privacyOptions.private.value"),
      description: t("shareSpace.privacyOptions.private.description"),
      icon: <Lock className="h-6 w-6" />,
    },
    {
      value: t("shareSpace.privacyOptions.public.value"),
      description: t("shareSpace.privacyOptions.public.description"),
      icon: <Globe className="h-6 w-6" />,
    },
  ];

  useEffect(() => {
    if (isModalOpen) {
      setValue(spaceData?.space?.visibility!);
    }
  }, [isModalOpen, spaceData?.space?.visibility]);

  const handleCopy = async () => {
    if (value === "public" && spaceData?.space?.visibility === "private") {
      await updateSpace({
        spaceId: spaceData?.space?._id!,
        spaceName: undefined,
        description: undefined,
        visibility: "public",
      });
    }

    const text = `/space/${spaceData?.space?._id}`;
    let domainName;
    if (typeof window !== "undefined") {
      domainName = window.location.origin;
    }
    try {
      copy(domainName + text);
      onClose();
      toast.success(t("shareSpace.copiedToastMessage"));
    } catch (error) {
      toast.error(t("errorModal.defaultTitle"));
    }
  };

  const handleValueChange = async (newValue: "public" | "private") => {
    if (newValue === "private") {
      await updateSpace({
        spaceId: spaceData?.space?._id!,
        spaceName: undefined,
        description: undefined,
        visibility: newValue,
      });
      setValue(newValue);
    } else {
      setValue(newValue);
    }
  };

  const filteredSpaceContent = spaceData?.contents?.filter(
    (content) => content.visibility === "private",
  );

  const showWarning =
    value === "public" &&
    filteredSpaceContent &&
    filteredSpaceContent.length > 0;

  if (isSpaceDataLoading) {
    return null;
  }

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
        base: "bg-white dark:bg-neutral-950 py-1 w-full max-w-lg rounded-xl",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
      key="share-space-modal"
    >
      <ModalContent className="border max-h-[90vh]" key="modal-content">
        {(onClose) => (
          <>
            <ModalHeader key="modal-header">
              <div className="flex flex-col px-3" key="header-container">
                <div
                  className="mt-0.5 flex flex-row text-primary/70 hover:text-primary"
                  key="header-title"
                >
                  <Share
                    className="w-4 h-4 mr-1 mt-0.5 mb-2"
                    key="share-icon"
                  />
                  <span className="text-sm" key="title-text">
                    {t("shareSpace.dialogTitle")}
                  </span>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-4 px-6" key="modal-body">
              <div
                className="flex flex-col gap-4"
                key="privacy-options-container"
              >
                {privacyOptions.map((option) => (
                  <Button
                    key={`privacy-option-${option.value}`}
                    onClick={() =>
                      handleValueChange(option.value as "public" | "private")
                    }
                    variant="outline"
                    className={cn(
                      "flex-col items-start gap-1 p-4 h-auto",
                      value === option.value && "border-primary bg-primary/10",
                    )}
                  >
                    <div
                      className="flex items-center gap-2"
                      key={`option-content-${option.value}`}
                    >
                      <span key={`option-icon-${option.value}`}>
                        {option.icon}
                      </span>
                      <span
                        className="capitalize"
                        key={`option-value-${option.value}`}
                      >
                        {option.value}
                      </span>
                    </div>
                    <p
                      className="text-xs text-muted-foreground text-left"
                      key={`option-desc-${option.value}`}
                    >
                      {option.description}
                    </p>
                  </Button>
                ))}
              </div>
              <AnimatePresence>
                {value === "public" && showWarning && (
                  <motion.div
                    key="warning-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 flex flex-col space-y-4"
                  >
                    <div
                      className="flex items-center gap-3 bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 px-2 py-4 rounded-md"
                      key="warning-box"
                    >
                      <CircleAlert
                        className="ml-1 h-4 w-4 text-yellow-800 dark:text-yellow-100"
                        key="warning-icon"
                      />
                      <span
                        className="text-sm text-yellow-800 dark:text-yellow-100"
                        key="warning-text"
                      >
                        {t("shareSpace.contentsTitle")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-primary/80 text-center"
                      key="warning-subtitle"
                    >
                      {t("shareSpace.subTitle")}
                    </p>
                    <ScrollArea
                      className="w-full rounded-md"
                      key="content-scroll-area"
                    >
                      {filteredSpaceContent.map((content) => (
                        <div
                          key={`content-item-${content._id}`}
                          className="flex items-center justify-center mb-2"
                        >
                          <div
                            className="flex items-center space-x-2"
                            key={`content-inner-${content._id}`}
                          >
                            {isDocumentType(content.type) ? (
                              <FileText
                                key={`content-icon-${content._id}`}
                                className="h-4 w-4 text-primary/60 flex-shrink-0"
                              />
                            ) : isVideoType(content.type) ? (
                              <Youtube
                                key={`content-icon-${content._id}`}
                                className="h-4 w-4 text-primary/60 flex-shrink-0"
                              />
                            ) : content.type === "audio" ? (
                              <AudioLines
                                key={`content-icon-${content._id}`}
                                className="h-4 w-4 text-primary/60 flex-shrink-0"
                              />
                            ) : content.type === "conversation" ? (
                              <MessageSquareText
                                key={`content-icon-${content._id}`}
                                className="h-4 w-4 text-primary/60 flex-shrink-0"
                              />
                            ) : (
                              <Mic
                                key={`content-icon-${content._id}`}
                                className="h-4 w-4 text-primary/60 flex-shrink-0"
                              />
                            )}
                            <span
                              className="text-sm text-primary/70"
                              key={`content-title-${content._id}`}
                            >
                              {content.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalBody>
            <ModalFooter key="modal-footer">
              <AnimatePresence>
                {value === "public" && (
                  <motion.div
                    key="copy-button-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <Button
                      key="copy-button"
                      onClick={handleCopy}
                      className="w-full"
                      disabled={isPending}
                    >
                      <Link key="copy-link-icon" className="h-4 w-4 mr-1.5" />
                      <div className="text-sm" key="copy-button-text">
                        {showWarning
                          ? t("shareSpace.understandCopyButtonLabel")
                          : t("shareSpace.copyButtonLabel")}
                      </div>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ShareSpace;
