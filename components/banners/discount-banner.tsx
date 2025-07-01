import React, { useState, useEffect, useMemo } from "react";
import { PartyPopper, X, Clock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useErrorStore } from "@/hooks/use-error-store";
import {
  useGetTier,
  useGetUserUpgradeLimitFirstReachedTime,
  useUser,
} from "@/query-hooks/user";
import { useLocalStorage } from "usehooks-ts";
import { isPast } from "date-fns";

const DiscountBanner = () => {
  const { data: user, isLoading } = useUser();
  const [isOpen, setIsOpen] = useLocalStorage(
    "discount-banner-open-finals",
    true,
  );
  const { t } = useTranslation();
  const { openModal } = useErrorStore();
  const { data: tier } = useGetTier();
  const isTestGroup = user?.user_group?.group === "upgrade_modal_052525";
  const {
    data: upgradeLimitFirstReachedTime,
    isLoading: isLoadingUpgradeLimitFirstReachedTime,
  } = useGetUserUpgradeLimitFirstReachedTime({
    enabled: isTestGroup && isOpen,
  });

  const memoizedEndDate = useMemo(() => {
    if (!upgradeLimitFirstReachedTime?.upgrade_limit_first_reached_at) return 0;
    const endDate = new Date(
      upgradeLimitFirstReachedTime.upgrade_limit_first_reached_at,
    );
    const now = new Date();
    const initialTimeLeft = Math.max(
      0,
      Math.floor((endDate.getTime() - now.getTime()) / 1000),
    );
    return initialTimeLeft;
  }, [upgradeLimitFirstReachedTime]);
  const [timeLeft, setTimeLeft] = useState(memoizedEndDate);

  useEffect(() => {
    setTimeLeft(memoizedEndDate);
  }, [memoizedEndDate]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleUpgrade = () => {
    openModal(
      {
        status: 402,
        statusText: "Payment Required",
      },
      {
        source: "discount-banner",
      },
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = () => {
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  };

  const freeTier = tier === "free";

  const showLimitedDiscountReachedAtTime =
    upgradeLimitFirstReachedTime?.upgrade_limit_first_reached_at;
  const isTimeNullOrUndefined =
    showLimitedDiscountReachedAtTime === null ||
    showLimitedDiscountReachedAtTime === undefined;
  const isLimitedDiscountTimePassed =
    showLimitedDiscountReachedAtTime &&
    isPast(showLimitedDiscountReachedAtTime);

  if (
    !freeTier ||
    isLoading ||
    isLoadingUpgradeLimitFirstReachedTime ||
    !isOpen ||
    isLimitedDiscountTimePassed ||
    isTimeNullOrUndefined
  )
    return null;

  return (
    <Alert
      variant="green"
      className="top-0 left-0 right-0 z-50 flex items-center rounded-none py-1 bg-green-500/10"
    >
      <div className="flex items-center justify-between text-sm w-full">
        <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-grow flex-wrap">
          <div className="flex items-center gap-1">
            <span className="font-semibold flex items-center gap-1 text-[#3CB371] dark:text-[#7DFF97]">
              <PartyPopper className="h-4 w-4 flex-shrink-0" />
              {t("blackFriday.discount")}:
            </span>
            <span className="font-medium capitalize text-[#3CB371] dark:text-[#7DFF97]">
              {isTestGroup
                ? t("testGroupDiscount.title")
                : t("blackFriday.title")}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-green-500/20 backdrop-blur-sm text-[#3CB371] dark:text-[#7DFF97] bg-green-500/10">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-xs">{formatTime()}</span>
          </div>

          <Button
            variant="link"
            size="sm"
            onClick={handleUpgrade}
            className="font-semibold px-0 underline text-[#3CB371] dark:text-[#7DFF97] hover:text-green-700 dark:hover:text-green-300"
          >
            {t("claimDiscount")}
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 text-[#3CB371] dark:text-[#7DFF97]"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export default DiscountBanner;
