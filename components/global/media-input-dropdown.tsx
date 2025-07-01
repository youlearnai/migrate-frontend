import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Mic, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useMicStore } from "@/hooks/use-mic-store";
import { useTranslation } from "react-i18next";

const MediaInputDropdown = ({
  className,
  onDeviceSelect,
}: {
  className?: string;
  onDeviceSelect: (device: MediaDeviceInfo | "system") => void;
}) => {
  const {
    audioDevices,
    selectedDevice,
    hasPermission,
    setSelectedDevice,
    requestMicrophoneAccess,
    getAudioDevices,
    isSystemAudio,
    setIsSystemAudio,
  } = useMicStore();
  const { t } = useTranslation();

  useEffect(() => {
    const checkPermission = async (): Promise<void> => {
      try {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        useMicStore.getState().setHasPermission(result.state === "granted");

        result.addEventListener("change", () => {
          useMicStore.getState().setHasPermission(result.state === "granted");
        });
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        useMicStore.getState().setHasPermission(false);
      }
    };

    checkPermission();
  }, []);

  useEffect(() => {
    if (hasPermission) {
      getAudioDevices();
      navigator.mediaDevices.addEventListener("devicechange", getAudioDevices);
    }

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        getAudioDevices,
      );
    };
  }, [hasPermission, getAudioDevices]);

  // Handle initial device selection
  useEffect(() => {
    if (!isSystemAudio && selectedDevice && audioDevices.length > 0) {
      onDeviceSelect(selectedDevice);
    }
  }, []); // Only run once on mount

  const handleDeviceChange = (deviceId: string) => {
    if (deviceId === "system-audio") {
      setIsSystemAudio(true);
      setSelectedDevice(null);
      onDeviceSelect("system");
    } else {
      setIsSystemAudio(false);
      const device = audioDevices.find((d) => d.deviceId === deviceId);
      if (device) {
        setSelectedDevice(device);
        onDeviceSelect(device);
      }
    }
  };

  if (hasPermission === false) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={requestMicrophoneAccess}
        className={cn("flex items-center gap-2", className)}
      >
        <Mic className="h-4 w-4" />
        <span className="text-sm">{t("record.allow_microphone_access")}</span>
      </Button>
    );
  }

  const currentValue = isSystemAudio
    ? "system-audio"
    : selectedDevice?.deviceId;
  const displayLabel = isSystemAudio
    ? "System Audio"
    : selectedDevice?.label || "Select Microphone";

  return (
    <Select value={currentValue} onValueChange={handleDeviceChange}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 h-2 w-fit bg-transparent border-none text-primary/80 focus:ring-0 focus:ring-offset-0 pl-0.5",
          className,
        )}
      >
        <SelectValue placeholder="Select Microphone">
          {displayLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-w-fit">
        {audioDevices.map((device) => (
          <SelectItem
            key={device.deviceId}
            value={device.deviceId}
            className="py-2"
          >
            <div className="flex items-center gap-2 w-full mr-1 py-0.5">
              <div className="flex-1 text-left">
                <div className="font-normal truncate">
                  {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MediaInputDropdown;
