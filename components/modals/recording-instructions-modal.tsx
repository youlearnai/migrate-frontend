"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import Image from "next/image";

export default function RecordingInstructionsModal() {
  const { isOpen, type, onClose } = useModalStore();
  const { t } = useTranslation();
  const isModalOpen = isOpen && type === "recording-instructions";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {t("recordingInstructions.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <div className="mb-6 space-y-2">
            <div className="group flex items-center space-x-4 p-2 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 dark:bg-secondary text-white text-sm font-semibold shadow-sm">
                1
              </div>
              <p className="text-neutral-900 font-medium dark:text-neutral-100">
                {t("recordingInstructions.step1.title")}
              </p>
            </div>

            <div className="group flex items-center space-x-4 p-2 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 dark:bg-secondary text-white text-sm font-semibold shadow-sm">
                2
              </div>
              <p className="text-neutral-900 font-medium dark:text-neutral-100">
                {t("recordingInstructions.step2.title")}
              </p>
            </div>

            <div className="group flex items-center space-x-4 p-2 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 dark:bg-secondary text-white text-sm font-semibold shadow-sm">
                3
              </div>
              <p className="text-neutral-900 font-medium dark:text-neutral-100">
                {t("recordingInstructions.step3.title")}
              </p>
            </div>

            <div className="group flex items-center space-x-4 p-2 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 dark:bg-secondary text-white text-sm font-semibold shadow-sm">
                4
              </div>
              <p className="text-neutral-900 font-medium dark:text-neutral-100">
                {t("recordingInstructions.step4.title")}
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/ShareAudio.png"
              alt={t("recordingInstructions.imageAlt")}
              width={500}
              height={300}
              unoptimized
              className="rounded-lg border-1.5 shadow-sm dark:hidden"
            />
            <Image
              src="/ShareAudioDark.png"
              alt={t("recordingInstructions.imageAlt")}
              width={500}
              height={300}
              unoptimized
              className="rounded-lg border-1.5 shadow-sm hidden dark:block"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={handleClose}>
            {t("recordingInstructions.gotIt")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
