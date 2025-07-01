"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { NewFeature } from "@/lib/types";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import Spinner from "@/components/global/spinner";

export default function NewFeatureModal() {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const feature = data?.feature as NewFeature;
  const allFeatures = data?.allFeatures as NewFeature[];
  const handleDismiss = data?.handleDismiss;
  const [currentStep, setCurrentStep] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);
  const [singleVideoLoading, setSingleVideoLoading] = useState(true);

  const isModalOpen = isOpen && type === "newFeature";

  if (allFeatures && allFeatures.length > 0) {
    const handleNext = () => {
      if (currentStep < allFeatures.length - 1) {
        setCurrentStep(currentStep + 1);
        setVideoLoading(true); // Reset loading state for next video
      } else {
        onClose();
      }
    };

    const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    const handleDotClick = (index: number) => {
      setCurrentStep(index);
      setVideoLoading(true); // Reset loading state when jumping to different step
    };

    return (
      <Dialog open={isModalOpen} onOpenChange={onClose}>
        <DialogContent
          className={`${
            allFeatures[currentStep]?.mediaSrc
              ? "sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px]"
              : "sm:max-w-[425px] md:max-w-[550px]"
          }`}
        >
          <div className="flex flex-col items-start">
            <h2 className="text-xs sm:text-sm bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1.5 py-0.5 rounded-sm mb-2">
              {t("modals.newFeature.badge")}
            </h2>
            <DialogTitle className="text-2xl font-normal mb-2">
              {t(allFeatures[currentStep]?.title)}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground md:text-base w-full text-left">
              {t(allFeatures[currentStep]?.description)}
            </DialogDescription>

            {allFeatures[currentStep]?.mediaSrc && (
              <div className="mt-4 relative w-full h-[280px] sm:h-[300px] md:h-[340px] lg:h-[400px] border-2 border-primary/20 rounded-lg">
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-md">
                    <Spinner />
                  </div>
                )}
                <video
                  className="w-full h-full rounded-md object-cover bg-primary/20"
                  src={allFeatures[currentStep]?.mediaSrc}
                  autoPlay
                  loop
                  playsInline
                  muted
                  onLoadedData={() => setVideoLoading(false)}
                  onLoadStart={() => setVideoLoading(true)}
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between w-full items-center sm:justify-between flex-row">
            <div className="flex gap-1">
              {allFeatures.length > 1 &&
                allFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? "bg-primary" : "bg-primary/10"
                    }`}
                  />
                ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  {t("onboarding.buttons.back")}
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === allFeatures.length - 1
                  ? t("onboarding.buttons.close")
                  : t("onboarding.buttons.next")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleDismissAndClose = () => {
    handleDismiss?.(feature.id);
    onClose();
  };

  if (!feature) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
        <div className="flex flex-col items-start space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {t("modals.newFeature.badge")}
            </div>
            <DialogTitle className="text-2xl font-medium">
              {t(feature.title)}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              {t(feature.description)}
            </DialogDescription>
          </div>

          {feature.mediaSrc && (
            <div className="w-full mt-6">
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] border border-border rounded-lg overflow-hidden bg-muted/20">
                {singleVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
                    <Spinner />
                  </div>
                )}
                <video
                  className="w-full h-full object-cover"
                  src={feature.mediaSrc}
                  autoPlay
                  controls
                  loop
                  playsInline
                  muted
                  onLoadedData={() => setSingleVideoLoading(false)}
                  onLoadStart={() => setSingleVideoLoading(true)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end">
          <Button onClick={handleDismissAndClose}>
            {t("recordingInstructions.gotIt")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
