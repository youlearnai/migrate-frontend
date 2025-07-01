"use client";
import Feedback from "@/components/global/feedback";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import useAuth from "@/hooks/use-auth";
import { useErrorStore } from "@/hooks/use-error-store";
import { ErrorCodes } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ErrorModal = () => {
  const { isOpen, closeModal, error, override } = useErrorStore();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: isLoading } = useAuth();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setShowFeedbackForm(false);
    }
  }, [isOpen]);

  const errorCodes: ErrorCodes = {
    400: {
      title: t("errorModal.errors.400.title"),
      description: t("errorModal.errors.400.description"),
      actionText: t("errorModal.errors.400.actionText"),
      actionLink: () => router.push("/contact"),
      secondaryText: t("onboarding.buttons.close"),
      secondaryAction: () => closeModal(),
      showFeedback: true,
    },
    // 401: {
    //   title: t("errorModal.errors.401.title"),
    //   description: t("errorModal.errors.401.description"),
    //   actionText: t("errorModal.errors.401.actionText"),
    //   actionLink: `/signin?returnUrl=${encodeURIComponent(pathname)}`,
    //   secondaryText: t("errorModal.errors.401.secondaryText"),
    //   secondaryAction: () =>
    //     router.push(`/signup?returnUrl=${encodeURIComponent(pathname)}`),
    // },
    403: {
      title: t("errorModal.errors.403.title"),
      description: t("errorModal.errors.403.description"),
      actionText: t("errorModal.errors.403.secondaryText"),
      actionLink: () => router.push("/"),
    },
    409: {
      title: t("errorModal.errors.409.title"),
      description: t("errorModal.errors.409.description"),
      actionText: t("errorModal.errors.409.actionText"),
      actionLink: () => router.push("/contact"),
      secondaryText: t("onboarding.buttons.close"),
      secondaryAction: () => closeModal(),
    },
    413: {
      title: t("errorModal.errors.413.title"),
      description: t("errorModal.errors.413.description"),
      actionText: t("onboarding.buttons.close"),
      actionLink: () => closeModal(),
    },
    422: {
      title: t("errorModal.errors.422.title"),
      description: t("errorModal.errors.422.description"),
      actionText: t("errorModal.errors.422.actionText"),
      actionLink: () => router.push("/"),
      secondaryText: t("onboarding.buttons.close"),
      secondaryAction: () => closeModal(),
    },
    429: {
      title: t("errorModal.errors.429.title"),
      description: t("errorModal.errors.429.description"),
      actionText: t("errorModal.errors.429.actionText"),
      actionLink: () => router.push("/"),
      secondaryText: t("onboarding.buttons.close"),
      secondaryAction: () => closeModal(),
    },
    500: {
      title: t("errorModal.errors.500.title"),
      description: t("errorModal.errors.500.description"),
      actionText: t("errorModal.errors.500.actionText"),
      actionLink: () => router.push("/contact"),
      secondaryText: t("onboarding.buttons.close"),
      secondaryAction: () => closeModal(),
      showFeedback: true,
    },
  };

  // Convert 403 to 401 if user is not authenticated
  const effectiveError =
    !user && !isLoading && error?.status === 403
      ? { ...error, status: 401 }
      : error;

  const currentError = errorCodes[effectiveError?.status as keyof ErrorCodes];

  if (!user && !isLoading && error?.status === 403) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  // Return null if error status is not in errorCodes
  if (!error?.status || !errorCodes[error.status as keyof ErrorCodes]) {
    return null;
  }

  // if 401 in sign in page, do not show anything
  if (error?.status === 401 && pathname.includes("sign") && user) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
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
    >
      <ModalContent className="border">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col font-medium text-lg space-y-1.5 text-center sm:text-left">
              {override
                ? error?.title
                : currentError?.title || t("errorModal.defaultTitle")}
            </ModalHeader>
            <ModalBody className="text-sm text-primary/60">
              {override
                ? error?.message
                : currentError?.description ||
                  t("errorModal.defaultDescription")}
            </ModalBody>
            {!showFeedbackForm && (
              <ModalFooter>
                {currentError?.secondaryText && (
                  <Button
                    variant="secondary"
                    className="focus-visible:ring-0"
                    onClick={() => {
                      currentError.secondaryAction?.();
                      closeModal();
                    }}
                  >
                    {currentError.secondaryText}
                  </Button>
                )}
                {currentError?.actionLink && (
                  <Button
                    className="mb-3 md:mb-0"
                    onClick={(e) => {
                      if (user && currentError.showFeedback) {
                        e.preventDefault();
                        setShowFeedbackForm(true);
                      } else {
                        closeModal();
                      }
                    }}
                    asChild={!currentError.showFeedback}
                  >
                    {user && currentError.showFeedback ? (
                      currentError.actionText
                    ) : (
                      <span
                        className="cursor-pointer"
                        onClick={currentError.actionLink}
                      >
                        {currentError.actionText}
                      </span>
                    )}
                  </Button>
                )}
              </ModalFooter>
            )}
            {showFeedbackForm && (
              <ModalBody className="pt-0">
                <Feedback
                  onClose={() => {
                    setShowFeedbackForm(false);
                    closeModal();
                  }}
                />
              </ModalBody>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default React.memo(ErrorModal);
