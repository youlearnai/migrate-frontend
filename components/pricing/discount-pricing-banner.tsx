"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useGetTier,
  useGetUserUpgradeLimitFirstReachedTime,
  useUser,
} from "@/query-hooks/user";
import { isPast } from "date-fns";

const DiscountPricingBanner = () => {
  const { data: tier, isLoading } = useGetTier();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { data: user } = useUser();
  const isTestGroup = user?.user_group?.group === "upgrade_modal_052525";
  const { data: upgradeLimitFirstReachedTime } =
    useGetUserUpgradeLimitFirstReachedTime({
      enabled: isTestGroup,
    });

  const promoCode = isTestGroup ? "OFFER25" : "SUMMER25";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    (user?.user_group?.group === "upgrade_modal_052525" &&
      (isLimitedDiscountTimePassed || isTimeNullOrUndefined))
  )
    return null;

  return (
    <div className="rounded-xl mt-4 w-full md:mx-0 bg-emerald-300/10 dark:bg-emerald-300/10 text-primary py-8 px-4 text-center border-2 border-emerald-300/20 dark:border-emerald-400/20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            <span className="text-3xl md:text-4xl capitalize font-semibold text-emerald-500 dark:text-emerald-400">
              {t("blackFriday.discount")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl text-emerald-500 capitalize dark:text-emerald-400">
              {isTestGroup
                ? t("testGroupDiscount.title")
                : t("blackFriday.title")}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-background/80 dark:bg-background/40 rounded-lg p-2 border-2 border-emerald-300/30 dark:border-emerald-400/30">
            <code className="text-lg text-primary">{promoCode}</code>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="ml-2 hover:bg-emerald-300/10 dark:bg-transparent dark:hover:bg-emerald-400/10 border border-emerald-300 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-500"
            >
              {copied ? t("blackFriday.copied") : t("blackFriday.copy")}
            </Button>
          </div>
          <p className="text-xs sm:text-sm mx-4 sm:mx-0 text-emerald-500 dark:text-emerald-400">
            {t("blackFriday.instructions")} <br />
            {isTestGroup
              ? t("testGroupDiscount.terms")
              : t("blackFriday.terms")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscountPricingBanner;
