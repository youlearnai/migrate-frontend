"use client";
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { Mic, MonitorDot, MonitorSpeaker, ScreenShare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function RecordingOptionsModal() {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "recordingOptions";

  const { onMicrophoneSelect, onBrowserTabSelect } = data || {};

  const handleMicrophoneSelect = () => {
    onMicrophoneSelect?.();
    onClose();
  };

  const handleBrowserTabSelect = () => {
    onBrowserTabSelect?.();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">
              {t("recording.selectSource", {
                defaultValue: "Select Recording Source",
              })}
            </h2>
            {/* <p className="text-sm text-muted-foreground">
              {t("recording.selectSourceDescription", {
                defaultValue: "Choose how you want to record audio",
              })}
            </p> */}
          </div>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start space-x-3 hover:bg-accent dark:bg-neutral-800/50"
              onClick={handleMicrophoneSelect}
            >
              <div className="p-2 rounded-2xl">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left space-y-1">
                <div className="font-medium">
                  {t("recording.microphone", { defaultValue: "Microphone" })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("recording.microphoneDescription", {
                    defaultValue: "Record from your device's microphone",
                  })}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start space-x-3 hover:bg-accent dark:bg-neutral-800/50"
              onClick={handleBrowserTabSelect}
            >
              <div className="p-2 rounded-2xl">
                <MonitorDot className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left space-y-1">
                <div className="font-medium">
                  {t("recording.browserTab", {
                    defaultValue: "Browser Tab Audio",
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("recording.browserTabDescription", {
                    defaultValue: "Record audio from a browser tab",
                  })}
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
