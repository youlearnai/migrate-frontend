import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useChatLimitBannerStore } from "@/hooks/use-chat-limit-banner-store";
import { useErrorStore } from "@/hooks/use-error-store";
import { useTotalChatLimit } from "@/query-hooks/limit";
import { Tier } from "@/lib/types";
import { useGetTier } from "@/query-hooks/user";
import { AlertCircle, X } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HIGHEST_TIERS } from "@/lib/utils";

const TimerDisplay = React.memo(() => {
  const [timeLeft, setTimeLeft] = React.useState("");
  const tomorrow = useMemo(() => {
    const now = new Date();
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = tomorrow.getTime() - now.getTime();

      // If we somehow get a negative difference, recalculate tomorrow
      if (difference < 0) {
        const newTomorrow = new Date(now);
        newTomorrow.setDate(newTomorrow.getDate() + 1);
        newTomorrow.setHours(0, 0, 0, 0);
        const newDifference = newTomorrow.getTime() - now.getTime();

        // Ensure we never show negative values
        const hours = Math.max(0, Math.floor(newDifference / (1000 * 60 * 60)));
        const minutes = Math.max(
          0,
          Math.floor((newDifference % (1000 * 60 * 60)) / (1000 * 60)),
        );
        const seconds = Math.max(
          0,
          Math.floor((newDifference % (1000 * 60)) / 1000),
        );

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [tomorrow]);

  return <>{timeLeft}</>;
});

TimerDisplay.displayName = "TimerDisplay";

const ChatLimitBanner = () => {
  const { data: tier, isLoading: tierLoading } = useGetTier();
  const { data: totalChatLimit, isLoading: totalChatLimitLoading } =
    useTotalChatLimit();
  const { t } = useTranslation();
  const { isOpen: isVisible, setIsOpen: setIsVisible } =
    useChatLimitBannerStore();
  const { openModal } = useErrorStore();

  const currentUsage = totalChatLimit?.current_usage;
  const limit = totalChatLimit?.limit;

  const handleClose = useCallback(() => setIsVisible(false), []);

  const shouldShow = useMemo(() => {
    if (!currentUsage || !limit) return null;
    if (tier === "anonymous") return false;
    if (totalChatLimitLoading || tierLoading) return false;
    if (!isVisible || currentUsage < limit) return false;
    return true;
  }, [
    tier,
    totalChatLimitLoading,
    isVisible,
    currentUsage,
    limit,
    tierLoading,
  ]);

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal(
      {
        status: 402,
        statusText: "Upgrade to continue",
      },
      {
        source: "chat-limit-banner",
      },
    );
  };

  if (!shouldShow) return null;

  return (
    <Alert className="fixed bottom-0 left-0 right-0 z-50 flex rounded-none py-1 px-4 bg-yellow-100 border-yellow-300 text-yellow-800">
      <div className="flex items-center justify-between gap-2 text-sm max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 flex-grow flex-wrap">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            {t("banner.chatLimit")} <TimerDisplay />.
          </span>
          {HIGHEST_TIERS.includes(tier as Tier) ? (
            <Link href="/contact">
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
              >
                {t("banner.absoluteChatLimit")}
              </Button>
            </Link>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
              onClick={handleUpgradeClick}
            >
              {t("banner.chatLimitUpgradeLink")}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 hover:bg-yellow-200"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};

export default React.memo(ChatLimitBanner);
