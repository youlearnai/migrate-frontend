import React from "react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTranslation } from "react-i18next";
import { PauseCircle, XCircle } from "lucide-react";

const PauseSubscriptionPrompt = () => {
  const { isOpen, onClose, type, onOpen } = useModalStore();
  const { t } = useTranslation();
  const isModalOpen = isOpen && type === "pauseSubscriptionPrompt";

  const handlePauseInstead = () => {
    onClose();
    onOpen("pauseSubscription");
  };

  const handleContinueCancel = () => {
    onClose();
    onOpen("cancelSubscriptionModal");
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      isDismissable={false}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.05,
            },
          },
          exit: {
            opacity: 0,
            transition: {
              duration: 0.05,
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white rounded-lg dark:bg-neutral-950 py-1 w-full max-w-md",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
      portalContainer={document.body}
    >
      <ModalContent className="border">
        {() => (
          <>
            <ModalHeader>{t("profile.considerPausingTitle")}</ModalHeader>

            <ModalBody className="py-4 space-y-4">
              <p className="text-sm text-primary/80">
                {t("profile.considerPausingDescription")}
              </p>
            </ModalBody>

            <ModalFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleContinueCancel}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                {t("profile.continueToCancel")}
              </Button>
              <Button
                type="button"
                onClick={handlePauseInstead}
                className="flex items-center gap-2"
              >
                <PauseCircle className="h-4 w-4" />
                {t("profile.pauseInstead")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PauseSubscriptionPrompt;
