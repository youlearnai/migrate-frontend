import { ModalBody } from "@nextui-org/modal";
import { ModalHeader } from "@nextui-org/modal";
import { ModalContent } from "@nextui-org/modal";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import Feedback from "../global/feedback";
import { TierLimitUpgradeModalContentProps } from "@/lib/types";

const TierLimitUpgradeModalContent = ({
  service,
  showFeedbackForm,
  setShowFeedbackForm,
  closeModal,
}: TierLimitUpgradeModalContentProps) => {
  const { t } = useTranslation();

  const defaultContent = () => {
    return (
      <ModalContent className="rounded-xl border">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              {t("upgradeModal.needHigherLimits")}
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-primary/80 mb-2">
                {t("upgradeModal.contactUsForCustomPlan")}
              </p>
              {!showFeedbackForm ? (
                <div className="flex flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={onClose}>
                    {t("onboarding.buttons.close")}
                  </Button>
                  <Button onClick={() => setShowFeedbackForm(true)}>
                    {t("error.contactUs")}
                  </Button>
                </div>
              ) : (
                <Feedback
                  className="max-w-full mt-4"
                  onClose={() => {
                    setShowFeedbackForm(false);
                    closeModal();
                  }}
                />
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    );
  };

  const uploadContentSizeContent = () => {
    return (
      <ModalContent className="rounded-xl border">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              {t("upgradeModal.uploadContentSizeLimitReached")}
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-primary/80 mb-2">
                {t("upgradeModal.uploadContentSizeLimitReachedDescription")}
              </p>
              <div className="flex flex-row gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  {t("onboarding.buttons.close")}
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    );
  };

  const renderContent = () => {
    switch (service) {
      case "upload_content_size":
        return uploadContentSizeContent();
      default:
        return defaultContent();
    }
  };

  return <>{renderContent()}</>;
};

export default TierLimitUpgradeModalContent;
