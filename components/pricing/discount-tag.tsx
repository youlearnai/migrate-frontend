"use client";

import { PartyPopper, Copy, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetUserUpgradeLimitFirstReachedTime,
  useUser,
} from "@/query-hooks/user";
import { isPast } from "date-fns";

const DiscountTag = ({
  upgradeLimitFirstReachedTime,
}: {
  upgradeLimitFirstReachedTime: Date | null | undefined;
}) => {
  const { data: user, isLoading } = useUser();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isTestGroup = user?.user_group?.group === "upgrade_modal_052525";
  const promoCode = isTestGroup ? "OFFER25" : "SUMMER25";
  const copyToClipboard = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memoizedEndDate = useMemo(() => {
    if (!upgradeLimitFirstReachedTime) return 0;
    const endDate = new Date(upgradeLimitFirstReachedTime);
    const now = new Date();
    const initialTimeLeft = Math.max(
      0,
      Math.floor((endDate.getTime() - now.getTime()) / 1000),
    );
    return initialTimeLeft;
  }, [upgradeLimitFirstReachedTime]);
  const [timeLeft, setTimeLeft] = useState(memoizedEndDate);

  const formatTime = () => {
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  };

  useEffect(() => {
    setTimeLeft(memoizedEndDate);
  }, [memoizedEndDate]);

  const showLimitedDiscountReachedAtTime = upgradeLimitFirstReachedTime;
  const isTimeNullOrUndefined =
    showLimitedDiscountReachedAtTime === null ||
    showLimitedDiscountReachedAtTime === undefined;
  const isLimitedDiscountTimePassed =
    showLimitedDiscountReachedAtTime &&
    isPast(showLimitedDiscountReachedAtTime);

  if (
    isLoading ||
    (user?.user_group?.group === "upgrade_modal_052525" &&
      (isLimitedDiscountTimePassed || isTimeNullOrUndefined))
  )
    return null;

  return (
    <div className="flex flex-col items-center gap-2 mb-4 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
      {isTestGroup && (
        <div className="flex items-center mb-1 gap-1 px-2 py-1 rounded-md border border-green-500/20 backdrop-blur-sm text-[#3CB371] dark:text-[#7DFF97] bg-green-500/10">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-xs">{formatTime()}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-[#3CB371] dark:text-[#7DFF97]" />
        <span className="text-lg font-base capitalize text-[#3CB371] dark:text-[#7DFF97]">
          {t("blackFriday.discount")}
        </span>
        {isTestGroup && (
          <span className="text-lg font-base capitalize text-[#3CB371] dark:text-[#7DFF97]">
            - {t("testGroupDiscount.title")}
          </span>
        )}
      </div>
      <div className="flex items-center border rounded-md px-3 py-1.5 border-green-500/20 bg-green-500/10">
        <code className="text-sm font-mono text-[#3CB371] dark:text-[#7DFF97]">
          {promoCode}
        </code>
        <Button
          onClick={copyToClipboard}
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 ml-2 text-[#3CB371] dark:text-[#7DFF97] hover:bg-transparent hover:text-green-700 dark:hover:text-green-300"
          aria-label={copied ? t("promoTag.copied") : t("promoTag.copy")}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex flex-col items-center text-xs text-center text-[#3CB371] dark:text-[#7DFF97]">
        <span>
          {isTestGroup
            ? t("testGroupDiscount.offerEnds")
            : t("promoTag.offerEnds")}
        </span>
      </div>
    </div>
  );
};

export default DiscountTag;
