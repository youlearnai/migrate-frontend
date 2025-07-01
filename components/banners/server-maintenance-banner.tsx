import React, { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLocalStorage } from "usehooks-ts";
import { useTranslation } from "react-i18next";

const ServerMaintenanceBanner = () => {
  const [isOpen, setIsOpen] = useLocalStorage(
    "maintenance-banner-open-v2",
    true,
  );
  const [localTimeString, setLocalTimeString] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    // Create Date objects for maintenance window in PST
    const pstDate = new Date("2025-04-05T14:30:00-07:00");
    const pstEndDate = new Date("2025-04-05T17:30:00-07:00");

    // Convert to local time
    const localStartTime = pstDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const localEndTime = pstEndDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const localDate = pstDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setLocalTimeString(
      `${localDate}, ${localStartTime} to ${localEndTime} (${localTimezone})`,
    );
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Alert
      variant="default"
      className="top-0 left-0 right-0 z-50 flex items-center rounded-none py-1.5 bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700"
    >
      <div className="flex items-center justify-between text-sm w-full">
        <div className="flex items-center justify-center gap-2 flex-grow">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            {t("serverMaintenanceBanner.title")}
            {localTimeString && ` ${localTimeString}`}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export default ServerMaintenanceBanner;
