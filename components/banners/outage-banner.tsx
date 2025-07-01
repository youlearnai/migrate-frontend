import React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLocalStorage } from "usehooks-ts";
import { useTranslation } from "react-i18next";

const OutageBanner = () => {
  const [isOpen, setIsOpen] = useLocalStorage("outage-banner-open", true);
  const { t } = useTranslation();
  const isOutage = process.env.NEXT_PUBLIC_OUTAGE_BANNER === "true";

  const handleClose = () => setIsOpen(false);

  if (!isOpen || !isOutage) return null;

  return (
    <Alert
      variant="default"
      className="top-0 left-0 right-0 z-50 flex items-center rounded-none py-1.5 bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700"
    >
      <div className="flex items-center justify-between text-sm w-full">
        <div className="flex items-center justify-center gap-2 flex-grow">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span className="font-medium text-red-700 dark:text-red-200">
            {t(
              "outageBanner.message",
              "We are currently experiencing an outage. Some features may be unavailable.",
            )}
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

export default OutageBanner;
